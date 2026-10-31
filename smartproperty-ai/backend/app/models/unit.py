import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Enum, Numeric, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UnitType(str, enum.Enum):
    apartment = "apartment"
    office = "office"
    shop = "shop"
    studio = "studio"
    penthouse = "penthouse"


class UnitStatus(str, enum.Enum):
    occupied = "occupied"
    vacant = "vacant"
    maintenance = "maintenance"


class Unit(Base):
    __tablename__ = "units"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    property_id = Column(Uuid, ForeignKey("properties.id"), nullable=False)
    floor_number = Column(Integer, nullable=False, default=1)
    unit_number = Column(String(20), nullable=False)
    unit_type = Column(Enum(UnitType), nullable=False, default=UnitType.apartment)
    area_sqft = Column(Numeric(10, 2))
    rent_amount = Column(Numeric(12, 2), nullable=False)
    deposit_amount = Column(Numeric(12, 2), default=0)
    status = Column(Enum(UnitStatus), nullable=False, default=UnitStatus.vacant)
    description = Column(Text)
    amenities = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="units")
    leases = relationship("Lease", back_populates="unit", cascade="all, delete-orphan")
    maintenance_records = relationship("Maintenance", back_populates="unit", cascade="all, delete-orphan")
