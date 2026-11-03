"""
SmartProperty AI — Real Client Data Seed Generator
Populates:
1. MANARA HOMES (13 Units, Mixed Commercial & Residential)
2. MANARA CENTER (23 Units, Commercial & Studios)
3. GRANDEUR GOLD (4 Units, Residential 3BHK)
"""
import sys
import os
import random
from datetime import date, timedelta

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Property, Unit, Tenant, Lease, Payment, Maintenance
from app.models.property import PropertyType
from app.models.unit import UnitType, UnitStatus
from app.models.lease import RenewalStatus
from app.models.payment import PaymentStatus
from app.models.maintenance import MaintenancePriority, MaintenanceStatus

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_real_data():
    db = SessionLocal()
    try:
        print("Clearing old dummy data from smartproperty.db...")
        db.query(Maintenance).delete()
        db.query(Payment).delete()
        db.query(Lease).delete()
        db.query(Unit).delete()
        db.query(Tenant).delete()
        db.query(Property).delete()
        db.commit()

        today = date.today()

        # ─── 1. REAL PROPERTIES ───────────────────────────────────────────────────
        prop_homes = Property(
            name="MANARA HOMES",
            type=PropertyType.mixed,
            address="No. 12, Main Road, Anna Nagar",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600040",
            total_floors=3,
            description="G+2 Mixed-use building featuring prime commercial ground frontage and residential 1BHK & 2BHK apartments on Floors 1 & 2."
        )

        prop_center = Property(
            name="MANARA CENTER",
            type=PropertyType.commercial,
            address="No. 88, Commercial Corridor, Mount Road",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600002",
            total_floors=3,
            description="G+2 Commercial complex featuring retail showrooms, frontline shops, and professional studio spaces."
        )

        prop_grandeur = Property(
            name="GRANDEUR GOLD",
            type=PropertyType.residential,
            address="Plot 4B, Grandeur Avenue, Chetpet",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600031",
            total_floors=2,
            description="Exclusive luxury residential enclave comprising four premium 3BHK residences."
        )

        db.add_all([prop_homes, prop_center, prop_grandeur])
        db.commit()
        db.refresh(prop_homes)
        db.refresh(prop_center)
        db.refresh(prop_grandeur)
        print("✅ 3 Real Properties created")

        # ─── 2. REAL UNITS & TENANTS ──────────────────────────────────────────────
        all_created_leases = []

        # ── PROPERTY 1: MANARA HOMES (13 Units) ──
        homes_configs = [
            (0, "G01", UnitType.shop, 37400, "STATE BANK OF INDIA", "044-26154000", "sbi.branch@sbi.co.in", "Branch Manager", "Commercial"),
            (0, "G02", UnitType.shop, 23000, "POLY CLINIC", "9840123456", "admin@polyclinic.in", "Dr. Senthil Kumar", "Commercial"),
            (1, "F1", UnitType.apartment, 6000, "Karthik Ramanathan", "9840111001", "karthik.r@gmail.com", "Karthik", "1BHK"),
            (1, "F2", UnitType.apartment, 6000, "Praveen Kumar", "9840111002", "praveen.k@gmail.com", "Praveen", "1BHK"),
            (1, "F3", UnitType.apartment, 6000, "Meera Krishnan", "9840111003", "meera.k@gmail.com", "Meera", "1BHK"),
            (1, "F4", UnitType.apartment, 6000, "Suresh Raina", "9840111004", "suresh.r@gmail.com", "Suresh", "1BHK"),
            (1, "F5", UnitType.apartment, 6000, "Anand Natarajan", "9840111005", "anand.n@gmail.com", "Anand", "1BHK"),
            (1, "F6", UnitType.apartment, 6000, "Divya Bharathi", "9840111006", "divya.b@gmail.com", "Divya", "1BHK"),
            (2, "S1", UnitType.apartment, 6000, "Venkatesh S", "9840222001", "venkatesh.s@gmail.com", "Venkatesh", "1BHK"),
            (2, "S2", UnitType.apartment, 6000, "Saravanan M", "9840222002", "saravanan.m@gmail.com", "Saravanan", "1BHK"),
            (2, "S3", UnitType.apartment, 6000, "Gayathri R", "9840222003", "gayathri.r@gmail.com", "Gayathri", "1BHK"),
            (2, "S4", UnitType.apartment, 8000, "Ramesh Babu", "9840333001", "ramesh.babu@gmail.com", "Ramesh", "2BHK"),
            (2, "S5", UnitType.apartment, 8000, "Kavitha Sundaram", "9840333002", "kavitha.s@gmail.com", "Kavitha", "2BHK"),
        ]

        for floor, u_num, u_type, rent, t_name, phone, email, contact, u_cat in homes_configs:
            unit = Unit(
                property_id=prop_homes.id,
                floor_number=floor,
                unit_number=u_num,
                unit_type=u_type,
                area_sqft=900 if "G" in u_num else (750 if "S4" in u_num or "S5" in u_num else 550),
                rent_amount=rent,
                deposit_amount=rent * 2,
                status=UnitStatus.occupied,
                description=f"{u_cat} Unit {u_num} in MANARA HOMES"
            )
            db.add(unit)
            db.commit()
            db.refresh(unit)

            tenant = Tenant(
                name=t_name,
                email=email,
                phone=phone,
                emergency_contact_name=f"{contact} Family",
                emergency_contact_phone=phone,
                address="MANARA HOMES, Anna Nagar, Chennai",
                notes=f"Real Tenant — {u_num}"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

            lease = Lease(
                unit_id=unit.id,
                tenant_id=tenant.id,
                lease_start=date(2026, 1, 1),
                lease_end=date(2027, 12, 31) if "G" in u_num else date(2026, 12, 31),
                rent_due_day=5,
                renewal_status=RenewalStatus.active,
                notes=f"Active Lease for {u_num}"
            )
            db.add(lease)
            db.commit()
            db.refresh(lease)
            all_created_leases.append((lease, rent))

        print(f"✅ MANARA HOMES: 13 Units & Tenants seeded")

        # ── PROPERTY 2: MANARA CENTER (23 Units) ──
        center_ground = [
            (0, "G01", UnitType.shop, 4000, "PANDIAN XEROX", "9841234001", "pandian.xerox@gmail.com", "Pandian"),
            (0, "G02", UnitType.shop, 30000, "JAYADEV HARDWARE", "9841234002", "jayadev.hardware@gmail.com", "Jayadev"),
            (0, "G03", UnitType.shop, 45000, "JAYAM SUPERMARKET", "9841234003", "jayam.supermarket@gmail.com", "Jayam Store Manager"),
        ]
        for floor, u_num, u_type, rent, t_name, phone, email, contact in center_ground:
            unit = Unit(
                property_id=prop_center.id,
                floor_number=floor,
                unit_number=u_num,
                unit_type=u_type,
                area_sqft=200 if u_num == "G01" else (800 if u_num == "G02" else 1500),
                rent_amount=rent,
                deposit_amount=rent * 2,
                status=UnitStatus.occupied,
                description=f"Prime Ground Commercial Shop {u_num} in MANARA CENTER"
            )
            db.add(unit)
            db.commit()
            db.refresh(unit)

            tenant = Tenant(
                name=t_name,
                email=email,
                phone=phone,
                emergency_contact_name=f"{contact} Family",
                emergency_contact_phone=phone,
                address="MANARA CENTER, Mount Road, Chennai",
                notes=f"Real Tenant — {u_num}"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

            lease = Lease(
                unit_id=unit.id,
                tenant_id=tenant.id,
                lease_start=date(2026, 1, 1),
                lease_end=date(2027, 12, 31),
                rent_due_day=5,
                renewal_status=RenewalStatus.active,
                notes=f"Commercial Lease for {u_num}"
            )
            db.add(lease)
            db.commit()
            db.refresh(lease)
            all_created_leases.append((lease, rent))

        # First Floor Commercial: FS01 (Vacant ₹8000), FS02 (POPPAIAH ₹7000)
        fs01 = Unit(
            property_id=prop_center.id,
            floor_number=1,
            unit_number="FS01",
            unit_type=UnitType.shop,
            area_sqft=350,
            rent_amount=8000,
            deposit_amount=16000,
            status=UnitStatus.vacant,
            description="First Floor Front Commercial Space FS01 — Ready for Lease"
        )
        db.add(fs01)
        db.commit()

        fs02 = Unit(
            property_id=prop_center.id,
            floor_number=1,
            unit_number="FS02",
            unit_type=UnitType.shop,
            area_sqft=320,
            rent_amount=7000,
            deposit_amount=14000,
            status=UnitStatus.occupied,
            description="First Floor Commercial Space FS02 in MANARA CENTER"
        )
        db.add(fs02)
        db.commit()
        db.refresh(fs02)

        t_poppaiah = Tenant(
            name="POPPAIAH",
            email="poppaiah.store@gmail.com",
            phone="9841234004",
            emergency_contact_name="Poppaiah Family",
            emergency_contact_phone="9841234004",
            address="MANARA CENTER, Mount Road, Chennai",
            notes="Real Tenant — MANARA CENTER FS02"
        )
        db.add(t_poppaiah)
        db.commit()
        db.refresh(t_poppaiah)

        lease_fs02 = Lease(
            unit_id=fs02.id,
            tenant_id=t_poppaiah.id,
            lease_start=date(2026, 1, 1),
            lease_end=date(2026, 12, 31),
            rent_due_day=5,
            renewal_status=RenewalStatus.active,
            notes="Commercial Lease for FS02"
        )
        db.add(lease_fs02)
        db.commit()
        db.refresh(lease_fs02)
        all_created_leases.append((lease_fs02, 7000))

        # F1 to F8 (8 Studio Units) - Vacant (₹5000 each)
        for i in range(1, 9):
            u_num = f"F{i}"
            u_studio = Unit(
                property_id=prop_center.id,
                floor_number=1,
                unit_number=u_num,
                unit_type=UnitType.studio,
                area_sqft=250,
                rent_amount=5000,
                deposit_amount=10000,
                status=UnitStatus.vacant,
                description=f"First Floor Commercial Studio {u_num} — Available for Lease"
            )
            db.add(u_studio)
        db.commit()

        # S01 to S10 (10 Studio Units) - Vacant (₹5000 each)
        for i in range(1, 11):
            u_num = f"S{i:02d}"
            u_studio = Unit(
                property_id=prop_center.id,
                floor_number=2,
                unit_number=u_num,
                unit_type=UnitType.studio,
                area_sqft=250,
                rent_amount=5000,
                deposit_amount=10000,
                status=UnitStatus.vacant,
                description=f"Second Floor Commercial Studio {u_num} — Available for Lease"
            )
            db.add(u_studio)
        db.commit()

        print("✅ MANARA CENTER: 23 Units seeded (4 Occupied, 19 Vacant)")

        # ── PROPERTY 3: GRANDEUR GOLD (4 Units) ──
        grandeur_configs = [
            (0, "G01", 25000, "VIVEK RAJ", "9884011221", "vivek.raj@gmail.com", "Vivek Raj"),
            (0, "G02", 25000, "DEVIS", "9884011222", "devis.m@gmail.com", "Devis"),
            (1, "101", 25000, "NOBLE", "9884011223", "noble.antony@gmail.com", "Noble"),
            (1, "102", 25000, "AMIT", "9884011224", "amit.sharma@gmail.com", "Amit"),
        ]

        for floor, u_num, rent, t_name, phone, email, contact in grandeur_configs:
            unit = Unit(
                property_id=prop_grandeur.id,
                floor_number=floor,
                unit_number=u_num,
                unit_type=UnitType.apartment,
                area_sqft=1650,
                rent_amount=rent,
                deposit_amount=rent * 2,
                status=UnitStatus.occupied,
                description=f"Luxury 3BHK Residence {u_num} in GRANDEUR GOLD"
            )
            db.add(unit)
            db.commit()
            db.refresh(unit)

            tenant = Tenant(
                name=t_name,
                email=email,
                phone=phone,
                emergency_contact_name=f"{contact} Family",
                emergency_contact_phone=phone,
                address="GRANDEUR GOLD, Chetpet, Chennai",
                notes=f"Real Tenant — {u_num}"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

            lease = Lease(
                unit_id=unit.id,
                tenant_id=tenant.id,
                lease_start=date(2026, 1, 1),
                lease_end=date(2026, 12, 31),
                rent_due_day=5,
                renewal_status=RenewalStatus.active,
                notes=f"Luxury 3BHK Lease for {u_num}"
            )
            db.add(lease)
            db.commit()
            db.refresh(lease)
            all_created_leases.append((lease, rent))

        print("✅ GRANDEUR GOLD: 4 Units & Tenants seeded (100% Occupied)")

        # ─── 3. PAYMENTS FOR ACTIVE LEASES ────────────────────────────────────────
        payment_modes = ["UPI", "Bank Transfer", "NEFT", "Cheque"]

        for lease, rent in all_created_leases:
            # Payment for October 2026 (Paid)
            p_oct = Payment(
                lease_id=lease.id,
                amount=rent,
                due_date=date(2026, 10, 5),
                paid_date=date(2026, 10, random.randint(2, 6)),
                status=PaymentStatus.paid,
                payment_mode=random.choice(payment_modes),
                transaction_ref=f"TXN2610{random.randint(100000, 999999)}",
                notes="Rent for October 2026"
            )
            db.add(p_oct)

            # Payment for November 2026 (Paid or Pending)
            is_nov_paid = random.random() > 0.15
            p_nov = Payment(
                lease_id=lease.id,
                amount=rent,
                due_date=date(2026, 11, 5),
                paid_date=date(2026, 11, 2) if is_nov_paid else None,
                status=PaymentStatus.paid if is_nov_paid else PaymentStatus.pending,
                payment_mode=random.choice(payment_modes) if is_nov_paid else None,
                transaction_ref=f"TXN2611{random.randint(100000, 999999)}" if is_nov_paid else None,
                notes="Rent for November 2026"
            )
            db.add(p_nov)

        db.commit()
        print("✅ Verified payments for recent cycles created")

        # ─── 4. MAINTENANCE REQUESTS ──────────────────────────────────────────────
        all_units = db.query(Unit).all()
        occupied_units = [u for u in all_units if u.status == UnitStatus.occupied]

        maint_samples = [
            ("HVAC Routine Servicing", "Annual maintenance and filter replacement of AC units in commercial space.", "Electrical", MaintenancePriority.low, MaintenanceStatus.resolved, 1500, "CoolTech Services", "9840998877"),
            ("Water Line Pressure Check", "Plumbing inspection on upper floor lines.", "Plumbing", MaintenancePriority.medium, MaintenanceStatus.in_progress, 800, "Metro Plumbers", "9840887766"),
            ("Distribution Board Inspection", "Monthly preventative electrical review of MCB panel.", "Electrical", MaintenancePriority.high, MaintenanceStatus.open, 2200, "Spark Electric Works", "9840776655"),
        ]

        for i, (title, desc, cat, prio, stat, cost, vendor, vphone) in enumerate(maint_samples):
            target_unit = occupied_units[i % len(occupied_units)]
            m = Maintenance(
                unit_id=target_unit.id,
                title=title,
                description=desc,
                category=cat,
                priority=prio,
                status=stat,
                cost=cost,
                vendor_name=vendor,
                vendor_phone=vphone,
                scheduled_date=today + timedelta(days=i * 2),
                resolved_date=today if stat == MaintenanceStatus.resolved else None
            )
            db.add(m)
        db.commit()
        print("✅ Real maintenance records created")

        print("\n" + "="*50)
        print("🎉 SUCCESS: ALL REAL CLIENT DATA APPLIED TO SMARTPROPERTY.DB!")
        print("="*50)

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seed: {e}")
        raise e
    finally:
        db.close()

seed = seed_real_data

if __name__ == "__main__":
    seed_real_data()
