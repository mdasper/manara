from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from app.models.payment import PaymentStatus


class PaymentBase(BaseModel):
    lease_id: UUID
    amount: float
    due_date: date
    paid_date: Optional[date] = None
    status: PaymentStatus = PaymentStatus.pending
    payment_mode: Optional[str] = None
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    paid_date: Optional[date] = None
    status: Optional[PaymentStatus] = None
    payment_mode: Optional[str] = None
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
