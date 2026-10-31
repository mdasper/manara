from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from app.models.lease import RenewalStatus


class LeaseBase(BaseModel):
    unit_id: UUID
    tenant_id: UUID
    lease_start: date
    lease_end: date
    renewal_status: RenewalStatus = RenewalStatus.active
    rent_due_day: int = 1
    exit_date: Optional[date] = None
    notes: Optional[str] = None


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None
    renewal_status: Optional[RenewalStatus] = None
    rent_due_day: Optional[int] = None
    exit_date: Optional[date] = None
    notes: Optional[str] = None


class LeaseResponse(LeaseBase):
    id: UUID
    created_at: datetime
    days_until_expiry: Optional[int] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None
    property_type: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None

    class Config:
        from_attributes = True
