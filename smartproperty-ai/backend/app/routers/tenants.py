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
    return leases


@router.get("/{tenant_id}/payments")
def get_tenant_payments(tenant_id: UUID, db: Session = Depends(get_db)):
    from app.models import Payment
    leases = db.query(Lease).filter(Lease.tenant_id == tenant_id).all()
    all_payments = []
    for lease in leases:
        payments = db.query(Payment).filter(Payment.lease_id == lease.id).all()
        all_payments.extend(payments)
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
