from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine
from app.models import Property, Unit, Tenant, Lease, Payment, Maintenance
from app.database import Base

from app.routers import (
    properties,
    units,
    tenants,
    leases,
    payments,
    maintenance,
    calendar,
    ai,
    dashboard,
    reports,
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MANARA API",
    description="MANARA Property Management SaaS — FastAPI Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file uploads
os.makedirs("uploads/documents", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(dashboard.router)
app.include_router(properties.router)
app.include_router(units.router)
app.include_router(tenants.router)
app.include_router(leases.router)
app.include_router(payments.router)
app.include_router(maintenance.router)
app.include_router(calendar.router)
app.include_router(ai.router)
app.include_router(reports.router)


@app.on_event("startup")
def startup_event():
    try:
        from app.database import SessionLocal
        from app.models import Property, Unit, UnitStatus
        from app.seed.seed_data import seed_real_data
        db = SessionLocal()
        manara_prop = db.query(Property).filter(Property.name == "MANARA HOMES").first()
        occupied_homes = db.query(Unit).filter(Unit.property_id == manara_prop.id, Unit.status == UnitStatus.occupied).count() if manara_prop else 0
        
        # If MANARA HOMES doesn't exist or has more than 2 occupied units (i.e. outdated seed), refresh real data
        if not manara_prop or occupied_homes != 2:
            print("⚡ Real client data not up-to-date in DB. Seeding real client data...")
            seed_real_data()
        else:
            print("✅ Verified: Real client data present in DB with exact vacant units.")
        db.close()
    except Exception as e:
        print(f"Startup check warning: {e}")


@app.get("/")
def root():
    return {
        "app": "MANARA",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/admin/reset-real-data")
@app.post("/api/admin/reset-real-data")
def trigger_reset_real_data():
    from app.seed.seed_data import seed_real_data
    seed_real_data()
    return {"status": "success", "message": "All real client data seeded successfully!"}
