from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta
from app.database import get_db
from app.models import Property, Unit, Payment, Lease, Maintenance
from app.models.unit import UnitStatus
from app.models.payment import PaymentStatus

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/revenue")
def monthly_revenue_report(db: Session = Depends(get_db)):
    today = date.today()
    result = []
    for i in range(11, -1, -1):
        offset_days = i * 30
        month_date = today - timedelta(days=offset_days)
        month_start = date(month_date.year, month_date.month, 1)
        if month_date.month == 12:
            month_end = date(month_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(month_date.year, month_date.month + 1, 1) - timedelta(days=1)

        paid = db.query(func.sum(Payment.amount)).filter(
            Payment.paid_date >= month_start,
            Payment.paid_date <= month_end,
            Payment.status == PaymentStatus.paid
        ).scalar() or 0

        pending = db.query(func.sum(Payment.amount)).filter(
            Payment.due_date >= month_start,
            Payment.due_date <= month_end,
            Payment.status.in_([PaymentStatus.pending, PaymentStatus.overdue])
        ).scalar() or 0

        result.append({
            "month": month_start.strftime("%b %Y"),
            "month_key": month_start.strftime("%Y-%m"),
            "collected": float(paid),
            "pending": float(pending),
            "total": float(paid) + float(pending)
        })
    return result


@router.get("/occupancy")
def occupancy_trend(db: Session = Depends(get_db)):
    properties = db.query(Property).all()
    result = []
    for prop in properties:
        total = db.query(Unit).filter(Unit.property_id == prop.id).count()
        occupied = db.query(Unit).filter(
            Unit.property_id == prop.id,
            Unit.status == UnitStatus.occupied
        ).count()
        result.append({
            "property": prop.name,
            "type": prop.type.value,
            "total_units": total,
            "occupied": occupied,
            "vacant": total - occupied,
            "occupancy_rate": round(occupied / total * 100, 1) if total else 0
        })
    return result


@router.get("/maintenance-costs")
def maintenance_cost_analysis(db: Session = Depends(get_db)):
    from app.models.maintenance import MaintenanceStatus
    records = db.query(Maintenance).filter(
        Maintenance.cost > 0
    ).all()

    by_category = {}
    for m in records:
        cat = m.category or "General"
        if cat not in by_category:
            by_category[cat] = {"category": cat, "total_cost": 0, "count": 0}
        by_category[cat]["total_cost"] += float(m.cost)
        by_category[cat]["count"] += 1

    total = db.query(func.sum(Maintenance.cost)).scalar() or 0
    return {
        "total_maintenance_cost": float(total),
        "by_category": list(by_category.values()),
        "total_records": len(records)
    }


@router.get("/vacancy")
def vacancy_analysis(db: Session = Depends(get_db)):
    vacant = db.query(Unit).filter(Unit.status == UnitStatus.vacant).all()
    result = []
    for u in vacant:
        prop = db.query(Property).filter(Property.id == u.property_id).first()
        last_lease = db.query(Lease).filter(
            Lease.unit_id == u.id
        ).order_by(Lease.lease_end.desc()).first()
        days_vacant = None
        if last_lease and last_lease.exit_date:
            days_vacant = (date.today() - last_lease.exit_date).days
        result.append({
            "unit_number": u.unit_number,
            "property": prop.name if prop else "Unknown",
            "type": u.unit_type.value,
            "floor": u.floor_number,
            "rent_amount": float(u.rent_amount),
            "days_vacant": days_vacant
        })
    return {"vacant_units": result, "total_vacant": len(result)}


@router.get("/renewal-pipeline")
def renewal_pipeline(db: Session = Depends(get_db)):
    today = date.today()
    from app.models.lease import RenewalStatus
    from app.models import Tenant
    pipeline = []
    leases = db.query(Lease).filter(
        Lease.lease_end >= today,
        Lease.renewal_status == RenewalStatus.active
    ).order_by(Lease.lease_end.asc()).all()
    for lease in leases:
        tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
        unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
        prop = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None
        pipeline.append({
            "lease_id": str(lease.id),
            "tenant": tenant.name if tenant else "Unknown",
            "phone": tenant.phone if tenant else "",
            "unit": unit.unit_number if unit else "",
            "property": prop.name if prop else "",
            "property_type": prop.type.value if (prop and hasattr(prop, 'type') and prop.type) else "residential",
            "lease_end": str(lease.lease_end),
            "days_until_expiry": (lease.lease_end - today).days,
            "rent_amount": float(unit.rent_amount) if unit else float(lease.rent_amount)
        })
    return pipeline
