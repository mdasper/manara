from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models import Property, Unit, UnitStatus
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter(prefix="/api/properties", tags=["properties"])


@router.get("/", response_model=List[PropertyResponse])
def list_properties(db: Session = Depends(get_db)):
    properties = db.query(Property).all()
    result = []
    for prop in properties:
        units = db.query(Unit).filter(Unit.property_id == prop.id).all()
        occupied = sum(1 for u in units if u.status == UnitStatus.occupied)
        vacant = sum(1 for u in units if u.status == UnitStatus.vacant)
        revenue = sum(float(u.rent_amount) for u in units if u.status == UnitStatus.occupied)
        r = PropertyResponse.model_validate(prop)
        r.total_units = len(units)
        r.occupied_units = occupied
        r.vacant_units = vacant
        r.monthly_revenue = revenue
        result.append(r)
    return result


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(data: PropertyCreate, db: Session = Depends(get_db)):
    prop = Property(**data.model_dump())
    db.add(prop)
    db.commit()
    db.refresh(prop)
    r = PropertyResponse.model_validate(prop)
    r.total_units = 0
    r.occupied_units = 0
    r.vacant_units = 0
    r.monthly_revenue = 0.0
    return r


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: UUID, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    units = db.query(Unit).filter(Unit.property_id == property_id).all()
    occupied = sum(1 for u in units if u.status == UnitStatus.occupied)
    vacant = sum(1 for u in units if u.status == UnitStatus.vacant)
    revenue = sum(float(u.rent_amount) for u in units if u.status == UnitStatus.occupied)
    r = PropertyResponse.model_validate(prop)
    r.total_units = len(units)
    r.occupied_units = occupied
    r.vacant_units = vacant
    r.monthly_revenue = revenue
    return r


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: UUID, data: PropertyUpdate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(prop, k, v)
    db.commit()
    db.refresh(prop)
    return PropertyResponse.model_validate(prop)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: UUID, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
