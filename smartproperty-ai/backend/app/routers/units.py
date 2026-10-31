from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, timedelta
from app.database import get_db
from app.models import Unit, Lease, Tenant, Payment, Property
from app.models.unit import UnitStatus
from app.models.lease import RenewalStatus
from app.schemas.unit_tenant import UnitCreate, UnitUpdate, UnitResponse

router = APIRouter(prefix="/api/units", tags=["units"])


def enrich_unit(unit: Unit, db: Session) -> UnitResponse:
    r = UnitResponse.model_validate(unit)
    prop = db.query(Property).filter(Property.id == unit.property_id).first()
    if prop:
        r.property_name = prop.name
        r.property_type = prop.type.value if hasattr(prop.type, 'value') else str(prop.type)

    active_lease = db.query(Lease).filter(
        Lease.unit_id == unit.id,
        Lease.renewal_status == RenewalStatus.active
    ).first()
    if active_lease:
        tenant = db.query(Tenant).filter(Tenant.id == active_lease.tenant_id).first()
        if tenant:
            r.current_tenant_name = tenant.name
        r.lease_end_date = str(active_lease.lease_end)
    return r


@router.get("/", response_model=List[UnitResponse])
def list_units(
    property_id: Optional[UUID] = Query(None),
    status: Optional[UnitStatus] = Query(None),
    floor_number: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Unit)
    if property_id:
        q = q.filter(Unit.property_id == property_id)
    if status:
        q = q.filter(Unit.status == status)
    if floor_number is not None:
        q = q.filter(Unit.floor_number == floor_number)
    units = q.all()
    return [enrich_unit(u, db) for u in units]


@router.post("/", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(data: UnitCreate, db: Session = Depends(get_db)):
    unit = Unit(**data.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return enrich_unit(unit, db)


@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(unit_id: UUID, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return enrich_unit(unit, db)


@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(unit_id: UUID, data: UnitUpdate, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(unit, k, v)
    db.commit()
    db.refresh(unit)
    return enrich_unit(unit, db)


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: UUID, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()


@router.get("/{unit_id}/maintenance")
def get_unit_maintenance(unit_id: UUID, db: Session = Depends(get_db)):
    from app.models import Maintenance
    records = db.query(Maintenance).filter(Maintenance.unit_id == unit_id).all()
    return records


@router.get("/{unit_id}/payments")
def get_unit_payments(unit_id: UUID, db: Session = Depends(get_db)):
    leases = db.query(Lease).filter(Lease.unit_id == unit_id).all()
    all_payments = []
    for lease in leases:
        payments = db.query(Payment).filter(Payment.lease_id == lease.id).all()
        all_payments.extend(payments)
    return all_payments
