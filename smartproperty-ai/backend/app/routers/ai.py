from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models import Property, Unit, Tenant, Lease, Payment, Maintenance
from app.models.unit import UnitStatus
from app.models.lease import RenewalStatus
from app.models.payment import PaymentStatus
from app.models.maintenance import MaintenanceStatus
from app.services.ai_service import ask_gemini, build_property_context

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AIQueryRequest(BaseModel):
    query: str


@router.post("/query")
async def natural_language_query(request: AIQueryRequest, db: Session = Depends(get_db)):
    context = build_property_context(db)
    response = await ask_gemini(request.query, context)
    return {"query": request.query, "response": response}


@router.get("/alerts")
def get_ai_alerts(db: Session = Depends(get_db)):
    today = date.today()
    alerts = []

    # Lease expiry alerts
    for days in [30, 15, 7, 3, 1]:
        threshold = today + timedelta(days=days)
        leases = db.query(Lease).filter(
            Lease.lease_end == threshold,
            Lease.renewal_status == RenewalStatus.active
        ).all()
        for lease in leases:
            tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
            unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
            if tenant and unit:
                alerts.append({
                    "type": "lease_expiry",
                    "severity": "high" if days <= 7 else "medium",
                    "title": f"Lease expiring in {days} day{'s' if days > 1 else ''}",
                    "message": f"{tenant.name} — Unit {unit.unit_number} — Expires on {lease.lease_end}",
                    "days": days,
                    "entity_id": str(lease.id)
                })

    # Overdue rent alerts
    overdue_payments = db.query(Payment).filter(
        Payment.status == PaymentStatus.overdue
    ).all()
    for payment in overdue_payments:
        lease = db.query(Lease).filter(Lease.id == payment.lease_id).first()
        if lease:
            tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
            unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
            days_overdue = (today - payment.due_date).days
            alerts.append({
                "type": "rent_overdue",
                "severity": "high",
                "title": f"Rent overdue by {days_overdue} days",
                "message": f"{tenant.name if tenant else 'Unknown'} — Unit {unit.unit_number if unit else ''} — ₹{payment.amount}",
                "days": days_overdue,
                "entity_id": str(payment.id)
            })

    # Long-term vacant units
    vacant_units = db.query(Unit).filter(Unit.status == UnitStatus.vacant).all()
    for unit in vacant_units:
        prop = db.query(Property).filter(Property.id == unit.property_id).first()
        alerts.append({
            "type": "vacant_unit",
            "severity": "low",
            "title": "Unit is vacant",
            "message": f"Unit {unit.unit_number} in {prop.name if prop else 'Unknown'} is currently vacant",
            "entity_id": str(unit.id)
        })

    # Upcoming maintenance
    seven_days = today + timedelta(days=7)
    upcoming_maintenance = db.query(Maintenance).filter(
        Maintenance.scheduled_date >= today,
        Maintenance.scheduled_date <= seven_days,
        Maintenance.status.in_([MaintenanceStatus.open, MaintenanceStatus.in_progress])
    ).all()
    for m in upcoming_maintenance:
        unit = db.query(Unit).filter(Unit.id == m.unit_id).first()
        days_until = (m.scheduled_date - today).days
        alerts.append({
            "type": "maintenance_due",
            "severity": "medium" if m.priority.value in ["high", "emergency"] else "low",
            "title": f"Maintenance due in {days_until} days",
            "message": f"{m.title} — Unit {unit.unit_number if unit else ''} — {m.category or 'General'}",
            "entity_id": str(m.id)
        })

    return sorted(alerts, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["severity"]])


@router.get("/insights")
def get_ai_insights(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_units = db.query(Unit).count()
    occupied = db.query(Unit).filter(Unit.status == UnitStatus.occupied).count()
    occupancy_rate = round(occupied / total_units * 100, 1) if total_units else 0

    monthly_revenue = db.query(func.sum(Unit.rent_amount)).filter(
        Unit.status == UnitStatus.occupied
    ).scalar() or 0

    maintenance_cost = db.query(func.sum(Maintenance.cost)).scalar() or 0

    top_property = None
    properties = db.query(Property).all()
    max_rev = 0
    for prop in properties:
        units = db.query(Unit).filter(
            Unit.property_id == prop.id,
            Unit.status == UnitStatus.occupied
        ).all()
        rev = sum(float(u.rent_amount) for u in units)
        if rev > max_rev:
            max_rev = rev
            top_property = prop.name

    return {
        "occupancy_rate": occupancy_rate,
        "monthly_revenue": float(monthly_revenue),
        "total_maintenance_cost": float(maintenance_cost),
        "top_performing_property": top_property,
        "vacant_count": total_units - occupied,
        "insights": [
            f"Your portfolio has a {occupancy_rate}% occupancy rate.",
            f"Monthly revenue stands at ₹{monthly_revenue:,.0f}.",
            f"Total maintenance spend to date: ₹{maintenance_cost:,.0f}.",
            f"Top earning property: {top_property}" if top_property else "No data yet."
        ]
    }
