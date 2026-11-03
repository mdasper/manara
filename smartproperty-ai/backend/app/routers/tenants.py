from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import Tenant, Lease, Unit, Property
from app.models.lease import RenewalStatus
from app.schemas.unit_tenant import TenantCreate, TenantUpdate, TenantResponse
import aiofiles, os, uuid

router = APIRouter(prefix="/api/tenants", tags=["tenants"])

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def enrich_tenant(tenant: Tenant, db: Session) -> TenantResponse:
    r = TenantResponse.model_validate(tenant)
    active_lease = db.query(Lease).filter(
        Lease.tenant_id == tenant.id,
        Lease.renewal_status == RenewalStatus.active
    ).first()
    if active_lease:
        unit = db.query(Unit).filter(Unit.id == active_lease.unit_id).first()
        if unit:
            r.current_unit = unit.unit_number
            r.current_rent = float(unit.rent_amount) if unit.rent_amount is not None else None
            prop = db.query(Property).filter(Property.id == unit.property_id).first()
            if prop:
                r.current_property = prop.name
    return r


@router.get("/", response_model=List[TenantResponse])
def list_tenants(db: Session = Depends(get_db)):
    tenants = db.query(Tenant).all()
    return [enrich_tenant(t, db) for t in tenants]


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(data: TenantCreate, db: Session = Depends(get_db)):
    tenant = Tenant(**data.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return enrich_tenant(tenant, db)


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(tenant_id: UUID, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return enrich_tenant(tenant, db)


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(tenant_id: UUID, data: TenantUpdate, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(tenant, k, v)
    db.commit()
    db.refresh(tenant)
    return enrich_tenant(tenant, db)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(tenant_id: UUID, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    db.delete(tenant)
    db.commit()


@router.get("/{tenant_id}/leases")
def get_tenant_leases(tenant_id: UUID, db: Session = Depends(get_db)):
    leases = db.query(Lease).filter(Lease.tenant_id == tenant_id).all()
    result = []
    for l in leases:
        unit = db.query(Unit).filter(Unit.id == l.unit_id).first()
        prop = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None
        result.append({
            "id": str(l.id),
            "unit_id": str(l.unit_id),
            "tenant_id": str(l.tenant_id),
            "lease_start": str(l.lease_start),
            "lease_end": str(l.lease_end),
            "renewal_status": l.renewal_status.value if hasattr(l.renewal_status, "value") else str(l.renewal_status),
            "rent_due_day": l.rent_due_day,
            "exit_date": str(l.exit_date) if l.exit_date else None,
            "notes": l.notes,
            "unit_number": unit.unit_number if unit else None,
            "rent_amount": float(unit.rent_amount) if unit and unit.rent_amount is not None else 0.0,
            "property_name": prop.name if prop else None,
        })
    return result


@router.get("/{tenant_id}/payments")
def get_tenant_payments(tenant_id: UUID, db: Session = Depends(get_db)):
    from app.models import Payment
    leases = db.query(Lease).filter(Lease.tenant_id == tenant_id).all()
    all_payments = []
    for lease in leases:
        payments = db.query(Payment).filter(Payment.lease_id == lease.id).order_by(Payment.due_date.desc()).all()
        for p in payments:
            all_payments.append({
                "id": str(p.id),
                "lease_id": str(p.lease_id),
                "amount": float(p.amount) if p.amount is not None else 0.0,
                "due_date": str(p.due_date) if p.due_date else None,
                "paid_date": str(p.paid_date) if p.paid_date else None,
                "status": p.status.value if hasattr(p.status, "value") else str(p.status),
                "payment_mode": p.payment_mode,
                "transaction_ref": p.transaction_ref,
                "notes": p.notes,
            })
    return all_payments


@router.post("/{tenant_id}/upload-document")
async def upload_document(
    tenant_id: UUID,
    doc_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    url = f"/uploads/documents/{filename}"
    if doc_type == "aadhaar":
        tenant.aadhaar_doc_url = url
    elif doc_type == "pan":
        tenant.pan_doc_url = url
    elif doc_type == "agreement":
        tenant.agreement_url = url
    elif doc_type == "photo":
        tenant.photo_url = url
    db.commit()
    return {"url": url, "doc_type": doc_type}
