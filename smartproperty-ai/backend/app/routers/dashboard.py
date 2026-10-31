from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models import Property, Unit, Tenant, Lease, Payment, Maintenance
from app.models.unit import UnitStatus
from app.models.lease import RenewalStatus
from app.models.payment import PaymentStatus
from app.models.maintenance import MaintenanceStatus

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    today = date.today()
    thirty_days = today + timedelta(days=30)

    total_properties = db.query(Property).count()
    total_units = db.query(Unit).count()
    occupied_units = db.query(Unit).filter(Unit.status == UnitStatus.occupied).count()
    vacant_units = db.query(Unit).filter(Unit.status == UnitStatus.vacant).count()

    upcoming_renewals = db.query(Lease).filter(
        Lease.lease_end >= today,
        Lease.lease_end <= thirty_days,
        Lease.renewal_status == RenewalStatus.active
    ).count()

    rent_due = db.query(Payment).filter(
        Payment.status.in_([PaymentStatus.pending, PaymentStatus.overdue]),
        Payment.due_date <= today
    ).count()

    maintenance_due = db.query(Maintenance).filter(
        Maintenance.status.in_([MaintenanceStatus.open, MaintenanceStatus.in_progress]),
        Maintenance.scheduled_date <= thirty_days
    ).count()

    # Monthly revenue = sum of rent for occupied units
    monthly_revenue = db.query(func.sum(Unit.rent_amount)).filter(
        Unit.status == UnitStatus.occupied
    ).scalar() or 0

    occupancy_rate = (occupied_units / total_units * 100) if total_units > 0 else 0

    return {
        "total_properties": total_properties,
        "total_units": total_units,
        "occupied_units": occupied_units,
        "vacant_units": vacant_units,
        "upcoming_renewals": upcoming_renewals,
        "rent_due": rent_due,
        "maintenance_due": maintenance_due,
        "monthly_revenue": float(monthly_revenue),
        "occupancy_rate": round(occupancy_rate, 1)
    }


@router.get("/revenue-trend")
def get_revenue_trend(db: Session = Depends(get_db)):
    """Last 6 months revenue from paid payments."""
    today = date.today()
    trend = []
    for i in range(5, -1, -1):
        month_start = date(today.year, today.month, 1) - timedelta(days=i * 30)
        month_end = date(month_start.year, month_start.month + 1 if month_start.month < 12 else 1, 1) - timedelta(days=1)
        revenue = db.query(func.sum(Payment.amount)).filter(
            Payment.paid_date >= month_start,
            Payment.paid_date <= month_end,
            Payment.status == PaymentStatus.paid
        ).scalar() or 0
        trend.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": float(revenue)
        })
    return trend


@router.get("/occupancy-by-property")
def get_occupancy_by_property(db: Session = Depends(get_db)):
    properties = db.query(Property).all()
    result = []
    for prop in properties:
        units = db.query(Unit).filter(Unit.property_id == prop.id).all()
        occupied = sum(1 for u in units if u.status == UnitStatus.occupied)
        result.append({
            "property": prop.name,
            "total": len(units),
            "occupied": occupied,
            "vacant": len(units) - occupied,
            "rate": round(occupied / len(units) * 100, 1) if units else 0
        })
    return result
