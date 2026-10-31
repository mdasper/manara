from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from app.models.maintenance import MaintenancePriority, MaintenanceStatus


class MaintenanceBase(BaseModel):
    unit_id: UUID
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: MaintenanceStatus = MaintenanceStatus.open
    priority: MaintenancePriority = MaintenancePriority.medium
    cost: Optional[float] = 0.0
    vendor_name: Optional[str] = None
    vendor_phone: Optional[str] = None
    scheduled_date: Optional[date] = None
    resolved_date: Optional[date] = None
    notes: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    cost: Optional[float] = None
    vendor_name: Optional[str] = None
    vendor_phone: Optional[str] = None
    scheduled_date: Optional[date] = None
    resolved_date: Optional[date] = None
    notes: Optional[str] = None


class MaintenanceResponse(MaintenanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
