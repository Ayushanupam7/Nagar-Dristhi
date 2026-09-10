import os
import sys

# Ensure backend directory in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal, Base, engine
from app.database.seed import seed_database
from app.models.bus import Bus
from app.models.issue import Issue
from app.models.event import Event
from app.services.verification_service import VerificationService
from app.services.priority_service import calculate_priority_score
from app.schemas.issue import IssueAssignRequest, IssueRecheckRequest
from app.services.maintenance_service import MaintenanceService


def run_all_tests():
    print("========================================")
    print("RUNNING NAGAR DRISHTI BACKEND VERIFICATION")
    print("========================================")

    # Setup database
    Base.metadata.create_all(bind=engine)
    seed_database()
    db = SessionLocal()

    try:
        # TEST 1: Database Seed Verification
        buses_count = db.query(Bus).count()
        issues_count = db.query(Issue).count()
        events_count = db.query(Event).count()
        verified_count = db.query(Issue).filter(Issue.status.in_(["VERIFIED", "PRIORITIZED", "ASSIGNED", "REPAIRED", "RESOLVED"])).count()
        critical_count = db.query(Issue).filter(Issue.priority_level == "CRITICAL").count()

        print(f"[TEST 1] Seed Check: Buses={buses_count}, Issues={issues_count}, Events={events_count}, Verified={verified_count}, Critical={critical_count}")
        assert buses_count >= 20, f"Expected >= 20 buses, got {buses_count}"
        assert events_count >= 50, f"Expected >= 50 events, got {events_count}"
        assert verified_count >= 10, f"Expected >= 10 verified issues, got {verified_count}"
        assert critical_count >= 5, f"Expected >= 5 critical issues, got {critical_count}"
        print("  -> PASSED: Seed counts satisfy hackathon requirements.")

        # TEST 2: Multi-Bus Verification Logic
        print("\n[TEST 2] Multi-Bus Verification Engine Test...")
        verif_service = VerificationService(db)

        # 2a. First detection by BUS-901
        test_lat, test_lng = 18.5555, 73.8888
        evt1 = Event(
            event_type="POTHOLE",
            confidence=0.76,
            severity=8,
            bus_id="BUS-901",
            latitude=test_lat,
            longitude=test_lng,
            speed_kmh=30.0
        )
        db.add(evt1)
        db.commit()
        issue1, is_new1 = verif_service.process_incoming_event(evt1)
        assert is_new1 is True, "First event should create a new issue"
        assert issue1.status == "DETECTED", f"Initial status should be DETECTED, got {issue1.status}"
        assert issue1.confirmations_count == 1, "Initial confirmation count should be 1"
        print("  -> 2a Passed: First bus detection created Issue in DETECTED status.")

        # 2b. Same bus passes again: should NOT increment independent confirmations
        evt2 = Event(
            event_type="POTHOLE",
            confidence=0.79,
            severity=8,
            bus_id="BUS-901",  # SAME BUS
            latitude=test_lat + 0.00005,
            longitude=test_lng + 0.00005,
            speed_kmh=32.0
        )
        db.add(evt2)
        db.commit()
        issue2, is_new2 = verif_service.process_incoming_event(evt2)
        assert is_new2 is False, "Same location should merge into existing issue"
        assert issue2.confirmations_count == 1, f"Same bus should not increment independent count! Got {issue2.confirmations_count}"
        print("  -> 2b Passed: Deduplication verified: Same bus does not increase independent confirmation count.")

        # 2c. Second independent bus (BUS-902) confirms within 15 meters
        evt3 = Event(
            event_type="POTHOLE",
            confidence=0.88,
            severity=8,
            bus_id="BUS-902",  # DISTINCT BUS
            latitude=test_lat + 0.0001,
            longitude=test_lng + 0.0001,
            speed_kmh=28.0
        )
        db.add(evt3)
        db.commit()
        issue3, is_new3 = verif_service.process_incoming_event(evt3)
        assert issue3.confirmations_count == 2, f"Expected 2 confirmations, got {issue3.confirmations_count}"
        assert issue3.status == "VERIFIED", f"Expected VERIFIED status, got {issue3.status}"
        assert issue3.combined_confidence > 0.88, f"Combined confidence should increase! Got {issue3.combined_confidence}"
        print(f"  -> 2c Passed: Distinct bus confirmation upgraded status to VERIFIED (Combined confidence: {issue3.combined_confidence * 100:.1f}%).")

        # TEST 3: Priority Scoring Algorithm Test
        print("\n[TEST 3] Priority Scoring Algorithm Test...")
        score, level, factors = calculate_priority_score(
            confidence=0.95,
            severity=9,
            traffic_level="HIGH",
            safety_risk="CRITICAL",
            confirmations_count=3
        )
        print(f"  -> Score: {score}/100, Level: {level}, Factors: {factors}")
        assert 80 <= score <= 100, f"Expected critical score >= 80, got {score}"
        assert level == "CRITICAL", f"Expected CRITICAL, got {level}"
        assert "confidence" in factors and "severity" in factors and "traffic" in factors and "safety" in factors and "verification" in factors
        print("  -> PASSED: Priority scoring is transparent and fully decomposed.")

        # TEST 4: Authority Action & Recheck Lifecycle Test
        print("\n[TEST 4] Authority Maintenance Lifecycle & Recheck Test...")
        maint_service = MaintenanceService(db)
        # Assign
        assign_req = IssueAssignRequest(assigned_contractor="Smart Roads Infra", notes="Urgent patch")
        assigned_issue = maint_service.assign_issue(issue3.id, assign_req, officer_name="Authority Admin")
        assert assigned_issue.status == "ASSIGNED", f"Expected ASSIGNED, got {assigned_issue.status}"
        
        # Mark Repaired
        repaired_issue = maint_service.mark_repaired(issue3.id, action_by="Contractor Lead")
        assert repaired_issue.status == "REPAIRED", f"Expected REPAIRED, got {repaired_issue.status}"

        # Recheck with low severity (1/10) -> Should automatically resolve!
        recheck_req = IssueRecheckRequest(bus_id="BUS-903", observed_severity=1)
        resolved_issue = maint_service.perform_recheck(issue3.id, recheck_req)
        assert resolved_issue.status == "RESOLVED", f"Expected RESOLVED, got {resolved_issue.status}"
        assert resolved_issue.recheck_severity == 1
        print("  -> PASSED: Recheck system validated repair and transitioned status to RESOLVED.")

        # TEST 5: FastAPI TestClient REST API endpoints
        print("\n[TEST 5] Testing FastAPI REST Endpoints via TestClient...")
        client = TestClient(app)

        r_health = client.get("/api/health")
        assert r_health.status_code == 200, f"Health check failed: {r_health.status_code}"
        assert r_health.json()["status"] == "ONLINE"

        r_buses = client.get("/api/buses")
        assert r_buses.status_code == 200
        assert len(r_buses.json()) >= 20

        r_summary = client.get("/api/analytics/summary")
        assert r_summary.status_code == 200
        data = r_summary.json()
        assert data["active_buses"] > 0
        assert data["total_issues"] > 0

        r_issues = client.get("/api/issues")
        assert r_issues.status_code == 200
        assert len(r_issues.json()) > 0

        r_traffic = client.get("/api/traffic/summary")
        assert r_traffic.status_code == 200

        print("  -> PASSED: All core REST APIs operational with status 200 OK.")

        # TEST 6: Hit & Run / Rash Driving ByteTrack + ANPR and Secure Alert Persistence
        print("\n[TEST 6] Testing Hit & Run ByteTrack ANPR Tracking & Secure Alert Persistence...")
        r_hr = client.post("/api/incidents/simulate-hit-and-run")
        assert r_hr.status_code == 200, f"Hit and run simulation failed: {r_hr.status_code}"
        hr_data = r_hr.json()
        assert hr_data["incident_type"] == "HIT_AND_RUN"
        assert hr_data["registration_number"] == "MH 19 6996"
        assert hr_data["plate_confidence"] >= 0.90
        assert hr_data["alert_status"] == "SECURE_ALERT_SENT"
        print(f"  -> Offending Vehicle Tracked: {hr_data['registration_number']} (Plate Conf: {hr_data['plate_confidence']*100}%, Alert: {hr_data['alert_status']})")

        # Test secure command alert persistence endpoint
        r_alert = client.post(f"/api/incidents/{hr_data['id']}/alert", json={"alert_notes": "Emergency Police Alert Dispatched"})
        assert r_alert.status_code == 200
        assert r_alert.json()["alert_status"] == "SECURE_ALERT_SENT"
        assert r_alert.json()["status"] == "ACTIONED"
        print("  -> PASSED: Hit & Run incident state persisted in database with secure alert.")

        # TEST 7: Origin-Destination Analytics & Route Delays & Pedestrian Safety
        print("\n[TEST 7] Testing OD Flows, Route Delays, and School Children Crossing Safety...")
        r_od = client.get("/api/traffic/od")
        assert r_od.status_code == 200
        assert len(r_od.json()) >= 3
        corridor_ascii = r_od.json()[0]['corridor_name'].encode('ascii', 'replace').decode('ascii')
        print(f"  -> OD Corridors Verified: {len(r_od.json())} major flows (e.g. {corridor_ascii})")

        r_routes = client.get("/api/traffic/routes")
        assert r_routes.status_code == 200
        assert len(r_routes.json()) >= 4
        print(f"  -> Route Delays Verified: {len(r_routes.json())} monitored routes (e.g. {r_routes.json()[0]['route_number']}: delay +{r_routes.json()[0]['delay_minutes']} min)")

        r_ped = client.post("/api/incidents/simulate-school-crossing")
        assert r_ped.status_code == 200
        assert r_ped.json()["pedestrian_scenario"] == "SCHOOL_CHILDREN_CROSSING"
        assert r_ped.json()["risk_score"] == 89
        print(f"  -> Pedestrian Safety Verified: School Children Crossing scenario (Risk: {r_ped.json()['risk_score']}/100, Speed: {r_ped.json()['vehicle_speed_kmh']} km/h)")
        print("  -> PASSED: OD analytics, route delays, and pedestrian risk fully operational.")

        print("\n========================================")
        print("ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! (7/7)")
        print("========================================")

    finally:
        db.close()


if __name__ == "__main__":
    run_all_tests()
