from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.database import get_db
from app.models import Payment, Lease
from app.models.payment import PaymentStatus
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/", response_model=List[PaymentResponse])
def list_payments(
    status: Optional[PaymentStatus] = Query(None),
    lease_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Payment)
    if status:
        q = q.filter(Payment.status == status)
    if lease_id:
        q = q.filter(Payment.lease_id == lease_id)
    return q.order_by(Payment.due_date.desc()).all()


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    payment = Payment(**data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/overdue", response_model=List[PaymentResponse])
def get_overdue_payments(db: Session = Depends(get_db)):
    today = date.today()
    payments = db.query(Payment).filter(
        Payment.status == PaymentStatus.overdue
    ).all()
    # Also mark pending payments past due date as overdue
    pending_past_due = db.query(Payment).filter(
        Payment.status == PaymentStatus.pending,
        Payment.due_date < today
    ).all()
    for p in pending_past_due:
        p.status = PaymentStatus.overdue
    db.commit()
    return db.query(Payment).filter(Payment.status == PaymentStatus.overdue).all()


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: UUID, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: UUID, data: PaymentUpdate, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(payment, k, v)
    db.commit()
    db.refresh(payment)
    return payment
