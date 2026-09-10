import datetime
import random
import json
from app.database.connection import SessionLocal, Base, engine
from app.models.user import User
from app.models.bus import Bus
from app.models.event import Event, EventConfirmation
from app.models.issue import Issue, IssueStatusHistory
from app.models.traffic import TrafficObservation
from app.models.incident import Incident
from app.services.priority_service import calculate_priority_score
from app.api.auth import get_password_hash


def hash_password(password: str) -> str:
    return get_password_hash(password)


def seed_database():
    """Seed comprehensive realistic demonstration data for Pune Metropolitan Region."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping initial seed.")
            return

        print("Seeding NAGAR DRISHTI prototype database...")

        # 1. Seed Users
        users = [
            User(
                username="admin",
                email="admin@nagardrishti.gov.in",
                hashed_password=hash_password("admin123"),
                full_name="Municipal Commissioner",
                role="ADMIN",
                department="PMC Urban Intelligence Cell"
            ),
            User(
                username="authority",
                email="authority@nagardrishti.gov.in",
                hashed_password=hash_password("password123"),
                full_name="Chief Executive Engineer",
                role="AUTHORITY",
                department="Road Maintenance & Safety Division"
            ),
            User(
                username="operator",
                email="operator@nagardrishti.gov.in",
                hashed_password=hash_password("operator123"),
                full_name="Transit Command Operator",
                role="OPERATOR",
                department="PMPML Fleet Operations"
            ),
        ]
        db.add_all(users)
        db.commit()

        # 2. Seed 24 Buses across Pune Metropolitan Routes
        pune_routes = [
            ("Swargate → Katraj", 18.4982, 73.8564),
            ("Shivajinagar → Hinjawadi Phase 1", 18.5912, 73.7389),
            ("Deccan Gymkhana → Kothrud Depot", 18.5074, 73.8077),
            ("Hadapsar → Pune Railway Station", 18.5126, 73.9015),
            ("Pune Station → Nigdi BRTS", 18.6529, 73.7804),
            ("Katraj → Viman Nagar", 18.5679, 73.9143),
            ("Kothrud → Pune Station", 18.5196, 73.8370),
            ("Swargate → Hadapsar", 18.5020, 73.8790),
        ]

        buses = []
        # Pre-designated SIH Demo registrations
        sih_registrations = {
            1: "MH 19 6996",  # Primary Demo Bus (Swargate -> Katraj)
            2: "MH 19 7421",  # Secondary Multi-Bus Confirmation Bus
            3: "MH 19 8134",  # Autonomous Recheck Pass Bus
        }

        for i in range(1, 25):
            bus_num = 100 + i
            bus_id = f"BUS-{bus_num}"
            reg_num = sih_registrations.get(i, f"MH 12 Q {3000 + i * 17}")
            route_name, base_lat, base_lng = pune_routes[(i - 1) % len(pune_routes)]
            # Add small offset along the route
            lat = base_lat + (random.random() - 0.5) * 0.02
            lng = base_lng + (random.random() - 0.5) * 0.02
            speed = round(random.uniform(22.0, 48.0), 1)
            
            bus = Bus(
                bus_id=bus_id,
                reg_number=reg_num,
                route_id=f"RT-{10 + (i % 8)}",
                route_name=route_name,
                status="ACTIVE" if i <= 22 else "IDLE",
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                speed_kmh=speed,
                heading_deg=round(random.uniform(0, 360), 1),
                camera_status="ONLINE" if i != 18 else "DEGRADED",
                ai_mode="EDGE_YOLO" if i % 2 == 0 else "SIMULATION",
                detections_count=random.randint(5, 38)
            )
            buses.append(bus)

        db.add_all(buses)
        db.commit()

        # 3. Seed 14 Issues (including 5 Critical and 10 Verified)
        issue_definitions = [
            # CRITICAL VERIFIED ISSUES
            {
                "code": "ND-POT-1837", "type": "POTHOLE", "lat": 18.4982, "lng": 73.8564,
                "loc": "Swargate-Katraj Highway near Padmavati Chowk", "ward": "Zone 4 - Dhankawadi",
                "first_bus": "BUS-102", "confirming_buses": ["BUS-102", "BUS-217", "BUS-108"],
                "conf": 0.96, "sev": 9, "traf": "HIGH", "risk": "CRITICAL", "status": "VERIFIED",
                "notes": "Deep crater on middle lane of transit corridor. High rollover risk for two-wheelers."
            },
            {
                "code": "ND-WTR-1838", "type": "WATERLOGGING", "lat": 18.5912, "lng": 73.7389,
                "loc": "Hinjawadi IT Park Shivaji Chowk underpass", "ward": "PCMC Zone B",
                "first_bus": "BUS-105", "confirming_buses": ["BUS-105", "BUS-113", "BUS-121"],
                "conf": 0.94, "sev": 8, "traf": "EXTREME", "risk": "CRITICAL", "status": "ASSIGNED",
                "assigned_to": "PMC Monsoon Drainage Team", "notes": "35cm water stagnation causing 4km gridlock."
            },
            {
                "code": "ND-ROD-1839", "type": "DAMAGED_ROAD", "lat": 18.5126, "lng": 73.9015,
                "loc": "Hadapsar Gadital Flyover approach", "ward": "Zone 3 - Hadapsar",
                "first_bus": "BUS-104", "confirming_buses": ["BUS-104", "BUS-112", "BUS-120"],
                "conf": 0.93, "sev": 8, "traf": "HIGH", "risk": "HIGH", "status": "VERIFIED",
                "notes": "Bitumen layer washed away revealing loose gravel over 50-meter stretch."
            },
            {
                "code": "ND-DIV-1840", "type": "MISSING_DIVIDER", "lat": 18.6529, "lng": 73.7804,
                "loc": "Old Mumbai-Pune Highway near Nigdi Octroi Naka", "ward": "PCMC Zone A",
                "first_bus": "BUS-106", "confirming_buses": ["BUS-106", "BUS-114"],
                "conf": 0.91, "sev": 9, "traf": "HIGH", "risk": "CRITICAL", "status": "PRIORITIZED",
                "notes": "Broken concrete barrier creating head-on collision danger on high-speed curve."
            },
            {
                "code": "ND-POT-1841", "type": "POTHOLE", "lat": 18.5074, "lng": 73.8077,
                "loc": "Paud Road near Ideal Colony Kothrud", "ward": "Zone 2 - Kothrud",
                "first_bus": "BUS-103", "confirming_buses": ["BUS-103", "BUS-111"],
                "conf": 0.89, "sev": 8, "traf": "HIGH", "risk": "HIGH", "status": "VERIFIED",
                "notes": "Multiple clustered potholes causing abrupt braking during peak hours."
            },
            # HIGH / MEDIUM VERIFIED ISSUES
            {
                "code": "ND-SGN-1842", "type": "DAMAGED_SIGNBOARD", "lat": 18.5679, "lng": 73.9143,
                "loc": "Ahmednagar Road near Phoenix Viman Nagar", "ward": "Zone 1 - Nagar Road",
                "first_bus": "BUS-107", "confirming_buses": ["BUS-107", "BUS-115"],
                "conf": 0.88, "sev": 6, "traf": "HIGH", "risk": "MEDIUM", "status": "VERIFIED",
                "notes": "Overhead gantry directional board bent by storm, obstructing bus vision."
            },
            {
                "code": "ND-POT-1843", "type": "POTHOLE", "lat": 18.5204, "lng": 73.8567,
                "loc": "Deccan Gymkhana near Sambhaji Bridge", "ward": "Zone 5 - Shivajinagar",
                "first_bus": "BUS-101", "confirming_buses": ["BUS-101", "BUS-109"],
                "conf": 0.87, "sev": 6, "traf": "HIGH", "risk": "MEDIUM", "status": "ASSIGNED",
                "assigned_to": "Metro Road Restoration Agency", "notes": "Pothole near bus stop entry bay."
            },
            {
                "code": "ND-ROD-1844", "type": "DAMAGED_ROAD", "lat": 18.5312, "lng": 73.8445,
                "loc": "FC Road near Goodluck Chowk", "ward": "Zone 5 - Shivajinagar",
                "first_bus": "BUS-110", "confirming_buses": ["BUS-110", "BUS-118"],
                "conf": 0.86, "sev": 5, "traf": "MEDIUM", "risk": "LOW", "status": "VERIFIED",
                "notes": "Uneven trench settlement from utility cable laying."
            },
            {
                "code": "ND-POT-1845", "type": "POTHOLE", "lat": 18.4682, "lng": 73.8610,
                "loc": "Bibvewadi Kondhwa Road near Market Yard", "ward": "Zone 4 - Bibvewadi",
                "first_bus": "BUS-116", "confirming_buses": ["BUS-116", "BUS-124"],
                "conf": 0.85, "sev": 6, "traf": "HIGH", "risk": "MEDIUM", "status": "VERIFIED",
                "notes": "Edge defect on curve."
            },
            {
                "code": "ND-WTR-1846", "type": "WATERLOGGING", "lat": 18.5230, "lng": 73.8780,
                "loc": "Pune Station BRTS terminal approach", "ward": "Zone 3 - Dhole Patil",
                "first_bus": "BUS-117", "confirming_buses": ["BUS-117", "BUS-104"],
                "conf": 0.90, "sev": 7, "traf": "HIGH", "risk": "HIGH", "status": "VERIFIED",
                "notes": "Drain choke up causing pedestrian difficulty at crossing."
            },
            # RECHECKED & RESOLVED ISSUES (Demonstrates Recheck Cycle)
            {
                "code": "ND-POT-1830", "type": "POTHOLE", "lat": 18.5140, "lng": 73.8420,
                "loc": "JM Road near Balgandharva Rangmandir", "ward": "Zone 5 - Shivajinagar",
                "first_bus": "BUS-101", "confirming_buses": ["BUS-101", "BUS-103", "BUS-110"],
                "conf": 0.95, "sev": 8, "traf": "HIGH", "risk": "HIGH", "status": "RESOLVED",
                "recheck_sev": 1, "recheck_bus": "BUS-115",
                "notes": "Repaired with micro-surfacing. Mobile AI recheck verified severity dropped from 8/10 to 1/10."
            },
            {
                "code": "ND-POT-1831", "type": "POTHOLE", "lat": 18.4870, "lng": 73.8620,
                "loc": "Satara Road near City Pride Theatre", "ward": "Zone 4 - Dhankawadi",
                "first_bus": "BUS-102", "confirming_buses": ["BUS-102", "BUS-108"],
                "conf": 0.91, "sev": 7, "traf": "HIGH", "risk": "HIGH", "status": "REPAIRED",
                "notes": "Cold mix asphalt applied by contractor. Awaiting scheduled recheck pass."
            },
            # UNVERIFIED DETECTED ISSUES (Awaiting 2nd bus confirmation)
            {
                "code": "ND-POT-1847", "type": "POTHOLE", "lat": 18.5410, "lng": 73.8290,
                "loc": "Senapati Bapat Road near Symbiosis", "ward": "Zone 5 - Shivajinagar",
                "first_bus": "BUS-119", "confirming_buses": ["BUS-119"],
                "conf": 0.74, "sev": 6, "traf": "MEDIUM", "risk": "MEDIUM", "status": "DETECTED",
                "notes": "Single bus pass detection. Awaiting independent multi-bus confirmation."
            },
            {
                "code": "ND-DIV-1848", "type": "MISSING_DIVIDER", "lat": 18.5830, "lng": 73.7640,
                "loc": "Wakad Bridge connector", "ward": "PCMC Zone B",
                "first_bus": "BUS-122", "confirming_buses": ["BUS-122"],
                "conf": 0.76, "sev": 7, "traf": "HIGH", "risk": "HIGH", "status": "DETECTED",
                "notes": "Newly detected gap in median strip. Single observation."
            }
        ]

        now = datetime.datetime.utcnow()
        raw_events = []

        for item in issue_definitions:
            score, level, factors = calculate_priority_score(
                confidence=item["conf"],
                severity=item["sev"],
                traffic_level=item["traf"],
                safety_risk=item["risk"],
                confirmations_count=len(item["confirming_buses"])
            )

            issue = Issue(
                issue_code=item["code"],
                issue_type=item["type"],
                latitude=item["lat"],
                longitude=item["lng"],
                location_name=item["loc"],
                ward_name=item["ward"],
                first_bus_id=item["first_bus"],
                confirmations_count=len(item["confirming_buses"]),
                combined_confidence=item["conf"],
                severity=item["sev"],
                traffic_level=item["traf"],
                safety_risk=item["risk"],
                priority_score=score,
                priority_level=level,
                priority_factors_json=json.dumps(factors),
                status=item["status"],
                assigned_contractor=item.get("assigned_to"),
                assigned_officer="Zone Maintenance Engineer" if item.get("assigned_to") else None,
                assigned_at=now - datetime.timedelta(hours=4) if item.get("assigned_to") else None,
                repaired_at=now - datetime.timedelta(hours=2) if item["status"] in ["REPAIRED", "RESOLVED"] else None,
                resolved_at=now - datetime.timedelta(hours=1) if item["status"] == "RESOLVED" else None,
                rechecked_at=now - datetime.timedelta(hours=1) if item["status"] == "RESOLVED" else None,
                recheck_severity=item.get("recheck_sev"),
                recheck_bus_id=item.get("recheck_bus"),
                before_evidence_url={
                    "MISSING_DIVIDER": "/evidence_missing_divider.jpg",
                    "DAMAGED_ROAD": "/evidence_damaged_road.jpg",
                    "WATERLOGGING": "/evidence_waterlogging.jpg",
                    "DAMAGED_SIGNBOARD": "/evidence_damaged_signboard.jpg",
                    "POTHOLE": "/evidence_pothole.jpg",
                }.get(item["type"], "/evidence_pothole.jpg"),
                after_evidence_url="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=600&auto=format&fit=crop" if item["status"] in ["REPAIRED", "RESOLVED"] else None,
                notes=item["notes"],
                created_at=now - datetime.timedelta(hours=random.randint(6, 48)),
                updated_at=now - datetime.timedelta(minutes=random.randint(10, 180))
            )
            db.add(issue)
            db.flush()

            # Add confirmation history
            for bus_id in item["confirming_buses"]:
                conf = EventConfirmation(
                    issue_id=issue.id,
                    bus_id=bus_id,
                    confidence=round(item["conf"] - random.uniform(0.01, 0.05), 2),
                    severity=item["sev"],
                    latitude=item["lat"] + (random.random() - 0.5) * 0.0002,
                    longitude=item["lng"] + (random.random() - 0.5) * 0.0002,
                    distance_meters=round(random.uniform(2.0, 18.0), 1),
                    confirmed_at=now - datetime.timedelta(hours=random.randint(2, 24))
                )
                db.add(conf)

                # Add a corresponding raw event
                evt = Event(
                    event_type=item["type"],
                    confidence=conf.confidence,
                    severity=conf.severity,
                    bus_id=bus_id,
                    latitude=conf.latitude,
                    longitude=conf.longitude,
                    speed_kmh=round(random.uniform(20.0, 45.0), 1),
                    evidence_url=issue.before_evidence_url,
                    timestamp=conf.confirmed_at,
                    issue_id=issue.id,
                    status="MERGED"
                )
                raw_events.append(evt)

            # Add status history
            hist = IssueStatusHistory(
                issue_id=issue.id,
                from_status=None,
                to_status="DETECTED",
                action_by=f"Fleet Camera ({item['first_bus']})",
                comment=f"Initial detection with severity {item['sev']}/10.",
                created_at=issue.created_at
            )
            db.add(hist)

            if len(item["confirming_buses"]) >= 2:
                hist_ver = IssueStatusHistory(
                    issue_id=issue.id,
                    from_status="DETECTED",
                    to_status="VERIFIED",
                    action_by="AI Verification Engine",
                    comment=f"Multi-Bus Confirmation achieved by {len(item['confirming_buses'])} independent buses.",
                    created_at=issue.created_at + datetime.timedelta(minutes=45)
                )
                db.add(hist_ver)

        db.add_all(raw_events)
        db.commit()

        # 4. Seed additional raw events across the city to exceed 50+ events
        extra_events = []
        for i in range(1, 40):
            bus_num = 100 + (i % 24) + 1
            route_name, base_lat, base_lng = pune_routes[i % len(pune_routes)]
            evt_type = random.choice(["POTHOLE", "DAMAGED_ROAD", "WATERLOGGING", "MISSING_DIVIDER", "DAMAGED_SIGNBOARD", "TRAFFIC_CONGESTION"])
            extra_events.append(Event(
                event_type=evt_type,
                confidence=round(random.uniform(0.68, 0.94), 2),
                severity=random.randint(3, 9),
                bus_id=f"BUS-{bus_num}",
                latitude=round(base_lat + (random.random() - 0.5) * 0.04, 6),
                longitude=round(base_lng + (random.random() - 0.5) * 0.04, 6),
                speed_kmh=round(random.uniform(18.0, 50.0), 1),
                evidence_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
                timestamp=now - datetime.timedelta(hours=random.randint(1, 36)),
                status="RAW"
            ))
        db.add_all(extra_events)
        db.commit()

        # 5. Seed Traffic Observations
        traffic_data = []
        for i, (route_name, base_lat, base_lng) in enumerate(pune_routes):
            cars = random.randint(25, 80)
            bikes = random.randint(40, 120)
            buses_c = random.randint(4, 15)
            trucks = random.randint(3, 12)
            total = cars + bikes + buses_c + trucks
            congestion = min(96.0, round(total * 0.45 + random.uniform(5, 15), 1))
            density = "SEVERE" if congestion > 75 else ("HIGH" if congestion > 55 else "MEDIUM")
            avg_spd = round(max(10.0, 45.0 - (congestion * 0.35)), 1)
            
            traffic_data.append(TrafficObservation(
                bus_id=f"BUS-{101 + i}",
                route_name=route_name,
                latitude=round(base_lat, 6),
                longitude=round(base_lng, 6),
                cars_count=cars,
                bikes_count=bikes,
                buses_count=buses_c,
                trucks_count=trucks,
                total_vehicles=total,
                traffic_density=density,
                congestion_percent=congestion,
                average_speed_kmh=avg_spd,
                baseline_speed_kmh=42.0,
                estimated_delay_minutes=round((42.0 / avg_spd - 1.0) * 12.0, 1),
                timestamp=now - datetime.timedelta(minutes=random.randint(5, 60))
            ))
        db.add_all(traffic_data)
        db.commit()

        # 6. Seed Incidents (Hit & Run, ANPR, and Pedestrian Safety)
        incidents = [
            Incident(
                incident_code="INC-2041",
                incident_type="HIT_AND_RUN",
                bus_id="BUS-101",
                bus_registration_number="MH 19 6996",
                camera_id="FRONT_CAMERA",
                vehicle_class="SUV",
                registration_number="MH 19 6996",
                license_plate="MH 19 6996",
                plate_confidence=0.94,
                ocr_confidence=0.94,
                detection_confidence=0.91,
                tracking_duration=12.4,
                risk_level="CRITICAL",
                description="Offending black SUV collided with two-wheeler on Karve Road and accelerated through junction without stopping.",
                latitude=18.5082,
                longitude=73.8329,
                location_name="Karve Road near Nal Stop Junction",
                evidence_url="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop",
                is_demo_mode=True,
                status="ACTIONED",
                alert_status="SECURE_ALERT_SENT",
                alert_sent_at=now - datetime.timedelta(minutes=15),
                timestamp=now - datetime.timedelta(minutes=18)
            ),
            Incident(
                incident_code="PED-4011",
                incident_type="PEDESTRIAN_RISK",
                bus_id="BUS-103",
                bus_registration_number="MH 19 8134",
                camera_id="FRONT_CAMERA",
                pedestrian_scenario="SCHOOL_CHILDREN_CROSSING",
                pedestrian_count=4,
                vehicle_proximity_m=18.0,
                vehicle_speed_kmh=42.0,
                risk_score=89,
                risk_level="CRITICAL",
                description="School children crossing roadway near St. Vincent School without active crossing guard. Vehicle approaching at 42 km/h within 18 meters.",
                latitude=18.5144,
                longitude=73.8762,
                location_name="Camp School Zone near St. Vincent High School",
                evidence_url="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop",
                is_demo_mode=True,
                status="LOGGED",
                alert_status="ALERT_GENERATED",
                timestamp=now - datetime.timedelta(minutes=45)
            ),
            Incident(
                incident_code="INC-3022",
                incident_type="ANPR_VIOLATION",
                bus_id="BUS-102",
                bus_registration_number="MH 19 7421",
                camera_id="FRONT_CAMERA",
                vehicle_class="MOTORCYCLE",
                registration_number="MH 14 DE 5678",
                license_plate="MH 14 DE 5678",
                plate_confidence=0.96,
                ocr_confidence=0.96,
                detection_confidence=0.93,
                tracking_duration=9.1,
                risk_level="HIGH",
                description="Motorcycle illegally navigating Swargate BRTS dedicated corridor during peak transit hours.",
                latitude=18.4990,
                longitude=73.8568,
                location_name="Swargate Dedicated BRTS Corridor",
                evidence_url="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop",
                is_demo_mode=True,
                status="LOGGED",
                alert_status="ALERT_GENERATED",
                timestamp=now - datetime.timedelta(hours=1)
            ),
        ]
        db.add_all(incidents)
        db.commit()

        # 7. Seed Origin-Destination (OD) Flows
        od_flows = [
            OriginDestinationFlow(
                corridor_name="Swargate → Katraj (NH-48 Corridor)",
                origin="Swargate Hub",
                destination="Katraj Chowk",
                origin_lat=18.5018,
                origin_lng=73.8580,
                dest_lat=18.4485,
                dest_lng=73.8588,
                vehicle_volume=1840,
                average_travel_time_min=38.5,
                normal_travel_time_min=22.0,
                delay_min=16.5,
                congestion_level="SEVERE"
            ),
            OriginDestinationFlow(
                corridor_name="Shivajinagar → Hinjewadi Phase 1 (IT Expressway)",
                origin="Shivajinagar Transit Hub",
                destination="Hinjewadi IT Park",
                origin_lat=18.5314,
                origin_lng=73.8446,
                dest_lat=18.5912,
                dest_lng=73.7389,
                vehicle_volume=2490,
                average_travel_time_min=54.0,
                normal_travel_time_min=35.0,
                delay_min=19.0,
                congestion_level="HIGH"
            ),
            OriginDestinationFlow(
                corridor_name="Hadapsar Gadital → Kharadi Bypass (East Tech Hub)",
                origin="Hadapsar Gadital",
                destination="Kharadi Bypass",
                origin_lat=18.5020,
                origin_lng=73.9290,
                dest_lat=18.5515,
                dest_lng=73.9350,
                vehicle_volume=1310,
                average_travel_time_min=32.0,
                normal_travel_time_min=20.0,
                delay_min=12.0,
                congestion_level="MODERATE"
            ),
        ]
        db.add_all(od_flows)
        db.commit()

        print("Database seeded successfully with 24 buses, 50+ events, 14 issues, incidents, and OD flows!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
