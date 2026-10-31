from app.routers.properties import router as properties_router
from app.routers.units import router as units_router
from app.routers.tenants import router as tenants_router
from app.routers.leases import router as leases_router
from app.routers.payments import router as payments_router
from app.routers.maintenance import router as maintenance_router
from app.routers.calendar import router as calendar_router
from app.routers.ai import router as ai_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router

__all__ = [
    "properties_router",
    "units_router",
    "tenants_router",
    "leases_router",
    "payments_router",
    "maintenance_router",
    "calendar_router",
    "ai_router",
    "dashboard_router",
    "reports_router",
]
