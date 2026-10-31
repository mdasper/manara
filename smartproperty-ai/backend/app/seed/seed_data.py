"""
SmartProperty AI — Seed Data Generator
Generates 3 properties, 30 units, 22 tenants, leases, payments, and maintenance records.
"""
import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Property, Unit, Tenant, Lease, Payment, Maintenance
from app.models.property import PropertyType
from app.models.unit import UnitType, UnitStatus
from app.models.lease import RenewalStatus
from app.models.payment import PaymentStatus
from app.models.maintenance import MaintenancePriority, MaintenanceStatus
from app.database import Base

# Create all tables
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(Maintenance).delete()
        db.query(Payment).delete()
        db.query(Lease).delete()
        db.query(Unit).delete()
        db.query(Tenant).delete()
        db.query(Property).delete()
        db.commit()

        today = date.today()

        # ─── PROPERTIES ──────────────────────────────────────────────────────────

        prop1 = Property(
            name="Sunrise Residency",
            type=PropertyType.residential,
            address="42, Anna Nagar East, 3rd Street",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600102",
            total_floors=5,
            description="Premium residential complex with 15 apartments spread across 5 floors."
        )

        prop2 = Property(
            name="Nexus Commercial Tower",
            type=PropertyType.commercial,
            address="789, Mount Road, Teynampet",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600018",
            total_floors=8,
            description="Modern commercial tower with office spaces on all 8 floors."
        )

        prop3 = Property(
            name="GreenMall Shopping Complex",
            type=PropertyType.shopping_complex,
            address="15, Old Mahabalipuram Road, Sholinganallur",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600119",
            total_floors=3,
            description="Premier shopping complex with retail outlets and food court."
        )

        db.add_all([prop1, prop2, prop3])
        db.commit()
        db.refresh(prop1)
        db.refresh(prop2)
        db.refresh(prop3)
        print(f"✅ Created 3 properties")

        # ─── UNITS ───────────────────────────────────────────────────────────────

        units = []

        # Sunrise Residency — 15 apartments (Floors 1–5, 3 units each)
        res_configs = [
            (1, "1A", UnitType.apartment, 850, 18000, 36000),
            (1, "1B", UnitType.apartment, 900, 20000, 40000),
            (1, "1C", UnitType.apartment, 750, 15000, 30000),
            (2, "2A", UnitType.apartment, 850, 18000, 36000),
            (2, "2B", UnitType.apartment, 1100, 25000, 50000),
            (2, "2C", UnitType.apartment, 900, 20000, 40000),
            (3, "3A", UnitType.apartment, 850, 18000, 36000),
            (3, "3B", UnitType.apartment, 900, 20000, 40000),
            (3, "3C", UnitType.apartment, 750, 15000, 30000),
            (4, "4A", UnitType.apartment, 850, 18000, 36000),
            (4, "4B", UnitType.apartment, 1200, 28000, 56000),
            (4, "4C", UnitType.studio, 600, 12000, 24000),
            (5, "5A", UnitType.penthouse, 2000, 55000, 110000),
            (5, "5B", UnitType.apartment, 950, 22000, 44000),
            (5, "5C", UnitType.apartment, 900, 20000, 40000),
        ]
        for floor, num, utype, area, rent, deposit in res_configs:
            u = Unit(
                property_id=prop1.id,
                floor_number=floor,
                unit_number=num,
                unit_type=utype,
                area_sqft=area,
                rent_amount=rent,
                deposit_amount=deposit,
                status=UnitStatus.vacant  # Will update after leases
            )
            units.append(u)
            db.add(u)

        # Nexus Commercial Tower — 10 offices (Floors 1–8)
        comm_configs = [
            (1, "G-01", UnitType.office, 1200, 45000, 90000),
            (1, "G-02", UnitType.office, 800, 32000, 64000),
            (2, "201", UnitType.office, 1500, 60000, 120000),
            (3, "301", UnitType.office, 1500, 60000, 120000),
            (4, "401", UnitType.office, 2000, 80000, 160000),
            (5, "501", UnitType.office, 1500, 60000, 120000),
            (6, "601", UnitType.office, 1200, 48000, 96000),
            (7, "701", UnitType.office, 1000, 40000, 80000),
            (8, "801", UnitType.office, 800, 32000, 64000),
            (8, "802", UnitType.office, 600, 25000, 50000),
        ]
        for floor, num, utype, area, rent, deposit in comm_configs:
            u = Unit(
                property_id=prop2.id,
                floor_number=floor,
                unit_number=num,
                unit_type=utype,
                area_sqft=area,
                rent_amount=rent,
                deposit_amount=deposit,
                status=UnitStatus.vacant
            )
            units.append(u)
            db.add(u)

        # GreenMall — 5 shops (Floors 1–3)
        mall_configs = [
            (1, "S-101", UnitType.shop, 600, 35000, 70000),
            (1, "S-102", UnitType.shop, 800, 45000, 90000),
            (2, "S-201", UnitType.shop, 600, 35000, 70000),
            (2, "S-202", UnitType.shop, 400, 25000, 50000),
            (3, "FC-301", UnitType.shop, 1200, 55000, 110000),
        ]
        for floor, num, utype, area, rent, deposit in mall_configs:
            u = Unit(
                property_id=prop3.id,
                floor_number=floor,
                unit_number=num,
                unit_type=utype,
                area_sqft=area,
                rent_amount=rent,
                deposit_amount=deposit,
                status=UnitStatus.vacant
            )
            units.append(u)
            db.add(u)

        db.commit()
        for u in units:
            db.refresh(u)
        print(f"✅ Created {len(units)} units")

        # ─── TENANTS ─────────────────────────────────────────────────────────────

        tenant_data = [
            # Residential tenants
            ("Rajesh Kumar", "rajesh.kumar@gmail.com", "9841012345", "Sunita Kumar", "9841012346", "Wife", "1234 5678 9012", "ABCDE1234F"),
            ("Priya Lakshmi", "priya.laksmi@gmail.com", "9841023456", "Vikram Lakshmi", "9841023457", "Husband", "2345 6789 0123", "BCDEF2345G"),
            ("Karthik Rajan", "karthik.rajan@yahoo.com", "9841034567", "Meena Rajan", "9841034568", "Mother", "3456 7890 1234", "CDEFG3456H"),
            ("Anitha Selvam", "anitha.selvam@gmail.com", "9841045678", "Suresh Selvam", "9841045679", "Father", "4567 8901 2345", "DEFGH4567I"),
            ("Muthu Krishnan", "muthu.krishnan@gmail.com", "9841056789", "Kavitha Krishnan", "9841056790", "Wife", "5678 9012 3456", "EFGHI5678J"),
            ("Sathya Moorthy", "sathya.moorthy@gmail.com", "9841067890", "Arun Moorthy", "9841067891", "Brother", "6789 0123 4567", "FGHIJ6789K"),
            ("Deepa Venkat", "deepa.venkat@gmail.com", "9841078901", "Suresh Venkat", "9841078902", "Husband", "7890 1234 5678", "GHIJK7890L"),
            ("Ramesh Babu", "ramesh.babu@gmail.com", "9841089012", "Kamala Babu", "9841089013", "Mother", "8901 2345 6789", "HIJKL8901M"),
            ("Nithya Devi", "nithya.devi@gmail.com", "9841090123", "Mohan Devi", "9841090124", "Father", "9012 3456 7890", "IJKLM9012N"),
            ("Suresh Pandian", "suresh.pandian@gmail.com", "9841001234", "Malathi Pandian", "9841001235", "Wife", "0123 4567 8901", "JKLMN0123O"),
            ("Kavitha Narayanan", "kavitha.narayanan@gmail.com", "9841012346", "Rajan Narayanan", "9841012347", "Husband", "1234 5678 9013", "KLMNO1234P"),
            ("Vijay Anand", "vijay.anand@gmail.com", "9841023457", "Revathi Anand", "9841023458", "Wife", "2345 6789 0124", "LMNOP2345Q"),
            # Commercial / Office tenants
            ("Infosys BPO Ltd", "infosys.bpo@infosys.com", "9841034568", "HR Department", "9841034569", "HR", "0000 0000 0000", "MNOPQ3456R"),
            ("TechServe Solutions", "admin@techserve.in", "9841045679", "Vijay Anand", "9841045680", "CEO", "1111 1111 1111", "NOPQR4567S"),
            ("Global Imports Pvt Ltd", "admin@globalimports.in", "9841056790", "Ravi Kumar", "9841056791", "MD", "2222 2222 2222", "OPQRS5678T"),
            ("HealthFirst Clinic", "info@healthfirst.in", "9841067891", "Dr. Priya", "9841067892", "Doctor", "3333 3333 3333", "PQRST6789U"),
            ("EduBright Academy", "admin@edubright.in", "9841078902", "Krishnan", "9841078903", "Principal", "4444 4444 4444", "QRSTU7890V"),
            # Mall tenants
            ("Fashion Hub", "fashion.hub@gmail.com", "9841089013", "Anitha", "9841089014", "Manager", "5555 5555 5555", "RSTUV8901W"),
            ("Spice Garden Restaurant", "spicegarden@gmail.com", "9841090124", "Murugan", "9841090125", "Owner", "6666 6666 6666", "STUVW9012X"),
            ("Mobile World", "mobileworld@gmail.com", "9841001235", "Senthil", "9841001236", "Owner", "7777 7777 7777", "TUVWX0123Y"),
            ("Book Palace", "bookpalace@gmail.com", "9841012347", "Malarvizhi", "9841012348", "Owner", "8888 8888 8888", "UVWXY1234Z"),
            ("FoodCourt Express", "foodcourt@gmail.com", "9841023458", "Dinesh", "9841023459", "Manager", "9999 9999 9999", "VWXYZ2345A"),
        ]

        tenants = []
        for name, email, phone, ec_name, ec_phone, ec_rel, aadhaar, pan in tenant_data:
            t = Tenant(
                name=name,
                email=email,
                phone=phone,
                emergency_contact_name=ec_name,
                emergency_contact_phone=ec_phone,
                emergency_contact_relation=ec_rel,
                aadhaar_number=aadhaar,
                pan_number=pan,
                address="Chennai, Tamil Nadu"
            )
            tenants.append(t)
            db.add(t)

        db.commit()
        for t in tenants:
            db.refresh(t)
        print(f"✅ Created {len(tenants)} tenants")

        # ─── LEASES ──────────────────────────────────────────────────────────────
        # Indices of units (0-indexed from the units list):
        # Residential: 0-14, Commercial: 15-24, Mall: 25-29

        lease_configs = [
            # (unit_idx, tenant_idx, lease_start_offset_days, lease_end_offset_days, renewal_status, rent_due_day, exit_date_offset)
            # Residential occupied (12 units occupied, 3 vacant)
            (0, 0, -365, 0+7, RenewalStatus.active, 1, None),      # Expires in 7 days! (critical)
            (1, 1, -300, 0+15, RenewalStatus.active, 1, None),     # Expires in 15 days
            (2, 2, -180, 0+180, RenewalStatus.active, 5, None),    # 6 months left
            (3, 3, -240, 0+30, RenewalStatus.active, 1, None),     # Expires in 30 days
            (4, 4, -180, 0+180, RenewalStatus.active, 1, None),    # 6 months left
            (5, 5, -90, 0+270, RenewalStatus.active, 10, None),    # 9 months left
            (6, 6, -365, 0+30, RenewalStatus.active, 1, None),     # Expires in 30 days
            (7, 7, -180, 0+180, RenewalStatus.active, 1, None),    # Normal
            (8, 8, -365, -30, RenewalStatus.expired, 1, -30),      # Expired 30 days ago, exited
            # Units 9, 10 (4A, 4B) — VACANT (no lease)
            (11, 9, -365, 0+60, RenewalStatus.active, 1, None),    # 2 months left
            (12, 10, -500, 0+120, RenewalStatus.active, 1, None),  # 4 months left
            # Unit 4C (index 11) — occupied
            # Units 5B, 5C (index 13, 14) — VACANT
            # Commercial
            (15, 12, -730, 0+180, RenewalStatus.active, 1, None),  # Office G-01 Infosys
            (16, 13, -365, 0+30, RenewalStatus.active, 1, None),   # G-02 — expiring in 30 days
            (17, 14, -180, 0+180, RenewalStatus.active, 1, None),  # 201 Global Imports
            (18, 15, -365, 0+90, RenewalStatus.active, 1, None),   # 301 HealthFirst
            (19, 16, -90, 0+270, RenewalStatus.active, 1, None),   # 401 EduBright
            # Units 501, 601, 701 — VACANT commercial
            # Units 801, 802 — VACANT
            # Mall
            (25, 17, -365, 0+180, RenewalStatus.active, 1, None),  # S-101 Fashion Hub
            (26, 18, -365, 0+60, RenewalStatus.active, 1, None),   # S-102 Spice Garden
            (27, 19, -180, 0+3, RenewalStatus.active, 1, None),    # S-201 Mobile World — expires in 3 days!
            (28, 20, -365, 0+120, RenewalStatus.active, 1, None),  # S-202 Book Palace
            (29, 21, -730, 0+360, RenewalStatus.active, 1, None),  # FC-301 FoodCourt
        ]

        leases = []
        occupied_unit_ids = set()

        for unit_idx, tenant_idx, start_offset, end_offset, status, due_day, exit_offset in lease_configs:
            unit = units[unit_idx]
            tenant = tenants[tenant_idx]
            lease_start = today + timedelta(days=start_offset)
            lease_end = today + timedelta(days=end_offset)
            exit_date = today + timedelta(days=exit_offset) if exit_offset is not None else None

            lease = Lease(
                unit_id=unit.id,
                tenant_id=tenant.id,
                lease_start=lease_start,
                lease_end=lease_end,
                renewal_status=status,
                rent_due_day=due_day,
                exit_date=exit_date,
            )
            leases.append(lease)
            db.add(lease)

            if status == RenewalStatus.active:
                unit.status = UnitStatus.occupied
                occupied_unit_ids.add(unit.id)

        db.commit()
        for l in leases:
            db.refresh(l)
        print(f"✅ Created {len(leases)} leases")

        # ─── PAYMENTS ────────────────────────────────────────────────────────────

        payments_created = 0
        for lease in leases:
            unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
            if not unit:
                continue
            rent = float(unit.rent_amount)

            # Generate last 6 months of payment records
            for i in range(6, 0, -1):
                due = today.replace(day=lease.rent_due_day) - timedelta(days=i * 30)
                if due < lease.lease_start:
                    continue

                # Most paid, some overdue
                if i == 1:  # Current month — overdue for some
                    if unit.unit_number in ["1A", "3B", "G-02"]:
                        status = PaymentStatus.overdue
                        paid_date = None
                    else:
                        status = PaymentStatus.paid
                        paid_date = due + timedelta(days=2)
                else:
                    status = PaymentStatus.paid
                    paid_date = due + timedelta(days=3)

                payment = Payment(
                    lease_id=lease.id,
                    amount=rent,
                    due_date=due,
                    paid_date=paid_date,
                    status=status,
                    payment_mode="UPI" if i % 2 == 0 else "Bank Transfer",
                    transaction_ref=f"TXN{lease.id.hex[:8].upper()}{i}"
                )
                db.add(payment)
                payments_created += 1

        db.commit()
        print(f"✅ Created {payments_created} payment records")

        # ─── MAINTENANCE ─────────────────────────────────────────────────────────

        maintenance_data = [
            # (unit_idx, title, category, status, priority, cost, scheduled_offset)
            (0, "Bathroom tap leaking", "Plumbing", MaintenanceStatus.open, MaintenancePriority.high, 2500, today + timedelta(days=2)),
            (1, "AC not cooling", "Electrical", MaintenanceStatus.in_progress, MaintenancePriority.high, 8000, today + timedelta(days=1)),
            (2, "Wall paint peeling", "Civil", MaintenanceStatus.open, MaintenancePriority.low, 15000, today + timedelta(days=5)),
            (4, "Electrical short circuit in kitchen", "Electrical", MaintenanceStatus.open, MaintenancePriority.emergency, 12000, today + timedelta(days=0)),
            (7, "Door lock replacement", "Carpentry", MaintenanceStatus.resolved, MaintenancePriority.medium, 3000, today - timedelta(days=5)),
            (12, "Lift maintenance - Floor 5", "Mechanical", MaintenanceStatus.open, MaintenancePriority.high, 25000, today + timedelta(days=3)),
            (15, "Office A/C service", "Electrical", MaintenanceStatus.in_progress, MaintenancePriority.medium, 15000, today + timedelta(days=1)),
            (17, "Water seepage - ceiling", "Civil", MaintenanceStatus.open, MaintenancePriority.high, 45000, today + timedelta(days=4)),
            (19, "Generator maintenance", "Mechanical", MaintenanceStatus.open, MaintenancePriority.medium, 18000, today + timedelta(days=6)),
            (25, "Shop signage repair", "Civil", MaintenanceStatus.resolved, MaintenancePriority.low, 5000, today - timedelta(days=10)),
            (26, "Kitchen exhaust fan - Spice Garden", "Mechanical", MaintenanceStatus.open, MaintenancePriority.high, 12000, today + timedelta(days=2)),
            (29, "Food court deep cleaning", "Housekeeping", MaintenanceStatus.open, MaintenancePriority.medium, 8000, today + timedelta(days=7)),
        ]

        for unit_idx, title, category, status, priority, cost, sched_date in maintenance_data:
            unit = units[unit_idx]
            m = Maintenance(
                unit_id=unit.id,
                title=title,
                category=category,
                status=status,
                priority=priority,
                cost=cost,
                scheduled_date=sched_date if isinstance(sched_date, date) else sched_date,
                resolved_date=today - timedelta(days=5) if status == MaintenanceStatus.resolved else None,
                vendor_name="Chennai Repairs Pvt Ltd" if cost > 10000 else "Local Vendor",
                vendor_phone="9841099999"
            )
            db.add(m)

        db.commit()
        print(f"✅ Created {len(maintenance_data)} maintenance records")

        # Final summary
        total_units = db.query(Unit).count()
        occupied = db.query(Unit).filter(Unit.status == UnitStatus.occupied).count()
        vacant = db.query(Unit).filter(Unit.status == UnitStatus.vacant).count()

        print("\n" + "="*60)
        print("🏢 SmartProperty AI — Seed Data Summary")
        print("="*60)
        print(f"  Properties : 3")
        print(f"  Total Units: {total_units} (Occupied: {occupied}, Vacant: {vacant})")
        print(f"  Tenants    : {len(tenants)}")
        print(f"  Leases     : {len(leases)}")
        print(f"  Payments   : {payments_created}")
        print(f"  Maintenance: {len(maintenance_data)} records")
        print(f"  Lease Alerts: Units with < 30 days to expiry generated")
        print("="*60)
        print("✅ Seed data loaded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
