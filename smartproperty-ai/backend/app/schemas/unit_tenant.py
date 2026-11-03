from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.unit import UnitType, UnitStatus


class UnitBase(BaseModel):
    property_id: UUID
    floor_number: int = 1
    unit_number: str
    unit_type: UnitType = UnitType.apartment
    area_sqft: Optional[float] = None
    rent_amount: float
    deposit_amount: float = 0.0
    status: UnitStatus = UnitStatus.vacant
    description: Optional[str] = None
    amenities: Optional[str] = None


class UnitCreate(UnitBase):
    pass


class UnitUpdate(BaseModel):
    floor_number: Optional[int] = None
    unit_number: Optional[str] = None
    unit_type: Optional[UnitType] = None
    area_sqft: Optional[float] = None
    rent_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    status: Optional[UnitStatus] = None
    description: Optional[str] = None
    amenities: Optional[str] = None


class UnitResponse(UnitBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    current_tenant_name: Optional[str] = None
    lease_end_date: Optional[str] = None
    property_name: Optional[str] = None
    property_type: Optional[str] = None

    class Config:
        from_attributes = True


class TenantBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    alternate_phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_doc_url: Optional[str] = None
    pan_doc_url: Optional[str] = None
    agreement_url: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    notes: Optional[str] = None


class TenantResponse(TenantBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    current_unit: Optional[str] = None
    current_property: Optional[str] = None
    current_rent: Optional[float] = None

    class Config:
        from_attributes = True
