from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, timedelta
from app.database import get_db
from app.models import Maintenance
from app.models.maintenance import MaintenanceStatus, MaintenancePriority
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/", response_model=List[MaintenanceResponse])
def list_maintenance(
    status: Optional[MaintenanceStatus] = Query(None),
    priority: Optional[MaintenancePriority] = Query(None),
    unit_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Maintenance)
    if status:
        q = q.filter(Maintenance.status == status)
    if priority:
        q = q.filter(Maintenance.priority == priority)
    if unit_id:
        q = q.filter(Maintenance.unit_id == unit_id)
    return q.order_by(Maintenance.created_at.desc()).all()


@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(data: MaintenanceCreate, db: Session = Depends(get_db)):
    record = Maintenance(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/due", response_model=List[MaintenanceResponse])
def get_due_maintenance(days: int = Query(7), db: Session = Depends(get_db)):
    today = date.today()
    threshold = today + timedelta(days=days)
    return db.query(Maintenance).filter(
        Maintenance.scheduled_date >= today,
        Maintenance.scheduled_date <= threshold,
        Maintenance.status.in_([MaintenanceStatus.open, MaintenanceStatus.in_progress])
    ).all()


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance(maintenance_id: UUID, db: Session = Depends(get_db)):
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return record


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(maintenance_id: UUID, data: MaintenanceUpdate, db: Session = Depends(get_db)):
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(record, k, v)
    if data.status == MaintenanceStatus.resolved and not record.resolved_date:
        record.resolved_date = date.today()
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance(maintenance_id: UUID, db: Session = Depends(get_db)):
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    db.delete(record)
    db.commit()
