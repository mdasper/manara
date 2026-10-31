import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Integer, Enum, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class RenewalStatus(str, enum.Enum):
    active = "active"
    renewed = "renewed"
    expired = "expired"
    pending_renewal = "pending_renewal"
    terminated = "terminated"


class Lease(Base):
    __tablename__ = "leases"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    unit_id = Column(Uuid, ForeignKey("units.id"), nullable=False)
    tenant_id = Column(Uuid, ForeignKey("tenants.id"), nullable=False)
    lease_start = Column(Date, nullable=False)
    lease_end = Column(Date, nullable=False)
    renewal_status = Column(Enum(RenewalStatus), default=RenewalStatus.active)
    rent_due_day = Column(Integer, default=1)  # Day of month rent is due
    exit_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    unit = relationship("Unit", back_populates="leases")
    tenant = relationship("Tenant", back_populates="leases")
    payments = relationship("Payment", back_populates="lease", cascade="all, delete-orphan")
