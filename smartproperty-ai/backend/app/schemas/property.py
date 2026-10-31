from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.property import PropertyType


class PropertyBase(BaseModel):
    name: str
    type: PropertyType
    address: str
    city: str
    state: str = "Tamil Nadu"
    pincode: Optional[str] = None
    total_floors: int = 1
    description: Optional[str] = None
    image_url: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[PropertyType] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    total_floors: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    total_units: Optional[int] = 0
    occupied_units: Optional[int] = 0
    vacant_units: Optional[int] = 0
    monthly_revenue: Optional[float] = 0.0

    class Config:
        from_attributes = True
