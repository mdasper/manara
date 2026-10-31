import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Enum, Numeric, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class MaintenancePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    emergency = "emergency"


class MaintenanceStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    cancelled = "cancelled"


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    unit_id = Column(Uuid, ForeignKey("units.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Plumbing, Electrical, Civil, etc.
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.open)
    priority = Column(Enum(MaintenancePriority), default=MaintenancePriority.medium)
    cost = Column(Numeric(12, 2), default=0)
    vendor_name = Column(String(200))
    vendor_phone = Column(String(20))
    scheduled_date = Column(Date)
    resolved_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    unit = relationship("Unit", back_populates="maintenance_records")
