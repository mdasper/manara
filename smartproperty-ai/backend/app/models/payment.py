import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Enum, Numeric, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PaymentStatus(str, enum.Enum):
    paid = "paid"
    overdue = "overdue"
    pending = "pending"
    partial = "partial"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    lease_id = Column(Uuid, ForeignKey("leases.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    payment_mode = Column(String(50))  # Cash / UPI / Bank Transfer / Cheque
    transaction_ref = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    lease = relationship("Lease", back_populates="payments")
