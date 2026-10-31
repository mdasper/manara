import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Uuid
from sqlalchemy.orm import relationship
from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    email = Column(String(200))
    phone = Column(String(20), nullable=False)
    alternate_phone = Column(String(20))
    address = Column(Text)
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relation = Column(String(100))
    aadhaar_number = Column(String(20))
    pan_number = Column(String(20))
    aadhaar_doc_url = Column(Text)
    pan_doc_url = Column(Text)
    agreement_url = Column(Text)
    photo_url = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    leases = relationship("Lease", back_populates="tenant", cascade="all, delete-orphan")
