from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models import Lease, Payment, Maintenance
from app.models.lease import RenewalStatus
from app.models.payment import PaymentStatus
from app.models.maintenance import MaintenanceStatus

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/events")
def get_calendar_events(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: Session = Depends(get_db)
):
    from calendar import monthrange
    from app.models import Tenant, Unit, Property

    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)

    events = []

    # Lease expiries
    leases = db.query(Lease).filter(
        Lease.lease_end >= start_date,
        Lease.lease_end <= end_date,
        Lease.renewal_status == RenewalStatus.active
    ).all()
    for lease in leases:
        tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
        unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
        events.append({
            "id": str(lease.id),
            "type": "lease_expiry",
            "title": f"Lease Expiry — {tenant.name if tenant else 'Unknown'} ({unit.unit_number if unit else ''})",
            "date": str(lease.lease_end),
            "color": "#EF4444"
        })

    # Rent due payments
    payments = db.query(Payment).filter(
        Payment.due_date >= start_date,
        Payment.due_date <= end_date,
        Payment.status.in_([PaymentStatus.pending, PaymentStatus.overdue])
    ).all()
    for payment in payments:
        lease = db.query(Lease).filter(Lease.id == payment.lease_id).first()
        if lease:
            tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
            events.append({
                "id": str(payment.id),
                "type": "rent_due",
                "title": f"Rent Due — {tenant.name if tenant else 'Unknown'} (₹{payment.amount})",
                "date": str(payment.due_date),
                "color": "#F59E0B",
                "status": payment.status
            })

    # Maintenance scheduled
    maintenance = db.query(Maintenance).filter(
        Maintenance.scheduled_date >= start_date,
        Maintenance.scheduled_date <= end_date,
        Maintenance.status.in_([MaintenanceStatus.open, MaintenanceStatus.in_progress])
    ).all()
    for m in maintenance:
        unit = db.query(Unit).filter(Unit.id == m.unit_id).first()
        events.append({
            "id": str(m.id),
            "type": "maintenance",
            "title": f"Maintenance — {m.title} ({unit.unit_number if unit else ''})",
            "date": str(m.scheduled_date),
            "color": "#8B5CF6",
            "priority": m.priority
        })

    # Exit dates
    exited = db.query(Lease).filter(
        Lease.exit_date >= start_date,
        Lease.exit_date <= end_date
    ).all()
    for lease in exited:
        tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
        events.append({
            "id": f"exit-{str(lease.id)}",
            "type": "exit",
            "title": f"Tenant Exit — {tenant.name if tenant else 'Unknown'}",
            "date": str(lease.exit_date),
            "color": "#6366F1"
        })

    return sorted(events, key=lambda x: x["date"])
