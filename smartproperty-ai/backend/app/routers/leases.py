from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, timedelta
from app.database import get_db
from app.models import Lease, Unit, Tenant, Payment, Property
from app.models.unit import UnitStatus
from app.models.lease import RenewalStatus
from app.models.payment import PaymentStatus
from app.schemas.lease import LeaseCreate, LeaseUpdate, LeaseResponse

router = APIRouter(prefix="/api/leases", tags=["leases"])


def enrich_lease(lease: Lease, db: Session) -> LeaseResponse:
    r = LeaseResponse.model_validate(lease)
    today = date.today()
    r.days_until_expiry = (lease.lease_end - today).days

    unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
    if unit:
        r.unit_number = unit.unit_number
        prop = db.query(Property).filter(Property.id == unit.property_id).first()
        if prop:
            r.property_name = prop.name
            r.property_type = prop.type.value if hasattr(prop.type, 'value') else str(prop.type)

    tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
    if tenant:
        r.tenant_name = tenant.name
        r.tenant_phone = tenant.phone

    return r


@router.get("/", response_model=List[LeaseResponse])
def list_leases(
    renewal_status: Optional[RenewalStatus] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Lease)
    if renewal_status:
        q = q.filter(Lease.renewal_status == renewal_status)
    return [enrich_lease(l, db) for l in q.all()]


@router.post("/", response_model=LeaseResponse, status_code=status.HTTP_201_CREATED)
def create_lease(data: LeaseCreate, db: Session = Depends(get_db)):
    # Update unit status to occupied
    unit = db.query(Unit).filter(Unit.id == data.unit_id).first()
    if unit:
        unit.status = UnitStatus.occupied
    lease = Lease(**data.model_dump())
    db.add(lease)
    db.commit()
    db.refresh(lease)
    return enrich_lease(lease, db)


@router.get("/expiring", response_model=List[LeaseResponse])
def get_expiring_leases(days: int = Query(30), db: Session = Depends(get_db)):
    today = date.today()
    threshold = today + timedelta(days=days)
    leases = db.query(Lease).filter(
        Lease.lease_end >= today,
        Lease.lease_end <= threshold,
        Lease.renewal_status == RenewalStatus.active
    ).all()
    return [enrich_lease(l, db) for l in leases]


@router.get("/{lease_id}", response_model=LeaseResponse)
def get_lease(lease_id: UUID, db: Session = Depends(get_db)):
    lease = db.query(Lease).filter(Lease.id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    return enrich_lease(lease, db)


@router.put("/{lease_id}", response_model=LeaseResponse)
def update_lease(lease_id: UUID, data: LeaseUpdate, db: Session = Depends(get_db)):
    lease = db.query(Lease).filter(Lease.id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(lease, k, v)
    # If terminated or expired, mark unit as vacant
    if data.renewal_status in [RenewalStatus.terminated, RenewalStatus.expired]:
        unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
        if unit:
            unit.status = UnitStatus.vacant
    db.commit()
    db.refresh(lease)
    return enrich_lease(lease, db)
