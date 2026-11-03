import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Enum, Text, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PropertyType(str, enum.Enum):
    residential = "residential"
    commercial = "commercial"
    shopping_complex = "shopping_complex"
    mixed = "mixed"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    type = Column(Enum(PropertyType), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    pincode = Column(String(10))
    total_floors = Column(Integer, default=1)
    description = Column(Text)
    image_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    units = relationship("Unit", back_populates="property", cascade="all, delete-orphan")
