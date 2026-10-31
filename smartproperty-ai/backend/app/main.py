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
