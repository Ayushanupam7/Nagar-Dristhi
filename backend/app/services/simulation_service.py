import random
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.bus import Bus
from app.models.event import Event
from app.models.issue import Issue
from app.models.traffic import TrafficObservation
from app.models.incident import Incident
from app.services.verification_service import VerificationService
from app.services.maintenance_service import MaintenanceService
from app.schemas.issue import IssueAssignRequest, IssueRecheckRequest


class SimulationService:
    def __init__(self, db: Session):
        self.db = db
        self.verification_service = VerificationService(db)
        self.maintenance_service = MaintenanceService(db)

    def advance_fleet_locations(self) -> List[Dict[str, Any]]:
        """Simulate realistic fleet movement along bus routes."""
        buses = self.db.query(Bus).filter(Bus.status == "ACTIVE").all()
        updated = []
        for bus in buses:
            d_lat = (random.random() - 0.5) * 0.0008
            d_lng = (random.random() - 0.5) * 0.0008
            bus.latitude = round(bus.latitude + d_lat, 6)
            bus.longitude = round(bus.longitude + d_lng, 6)
            bus.speed_kmh = round(max(15.0, min(55.0, bus.speed_kmh + (random.random() - 0.5) * 4)), 1)
            bus.updated_at = datetime.datetime.utcnow()
            updated.append({
                "bus_id": bus.bus_id,
                "reg_number": bus.reg_number,
                "latitude": bus.latitude,
                "longitude": bus.longitude,
                "speed_kmh": bus.speed_kmh
            })
        self.db.commit()
        return updated

    def trigger_sih_step(self, step: int) -> Dict[str, Any]:
        """Execute one of the 12 SIH presentation demo steps using public bus registration numbers."""
        now = datetime.datetime.utcnow()
        TARGET_LAT = 18.4982
        TARGET_LNG = 73.8564

        if step == 1:
            bus = self.db.query(Bus).filter(Bus.reg_number == "MH 19 6996").first() or self.db.query(Bus).first()
            if bus:
                bus.status = "ACTIVE"
                bus.speed_kmh = 36.0
                bus.latitude = TARGET_LAT - 0.005
                bus.longitude = TARGET_LNG - 0.005
                self.db.commit()
            return {
                "step": 1,
                "title": "Fleet Bus Dispatched",
                "description": "Bus MH 19 6996 starts route (Swargate → Katraj) with Edge AI Dashcam ONLINE.",
                "bus_id": bus.bus_id if bus else "BUS-101",
                "bus_registration": "MH 19 6996",
                "status": "IN_TRANSIT"
            }

        elif step == 2:
            # Bus MH 19 6996 detects initial defect
            event = Event(
                event_type="POTHOLE",
                confidence=0.78,
                severity=8,
                bus_id="BUS-101",
                bus_registration_number="MH 19 6996",
                camera_id="FRONT_CAMERA",
                latitude=TARGET_LAT,
                longitude=TARGET_LNG,
                speed_kmh=34.0,
                evidence_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
                timestamp=now
            )
            self.db.add(event)
            self.db.flush()
            issue, is_new = self.verification_service.process_incoming_event(event)

            bus = self.db.query(Bus).filter(Bus.reg_number == "MH 19 6996").first()
            if bus:
                bus.last_event_type = "POTHOLE"
                bus.last_event_time = now
                bus.detections_count += 1
                self.db.commit()

            return {
                "step": 2,
                "title": "Initial Pothole Detected",
                "description": "Bus MH 19 6996 Edge AI detector identifies severe pothole (Confidence 78%, Severity 8/10).",
                "bus_id": "BUS-101",
                "bus_registration": "MH 19 6996",
                "event_id": event.id,
                "issue_id": issue.id,
                "status": issue.status,
                "priority_score": issue.priority_score
            }

        elif step == 3:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            return {
                "step": 3,
                "title": "Geo-Tagged Event Generated",
                "description": "GPS coordinates (18.4982, 73.8564) + timestamp + confidence (0.78) + severity (8/10) attached to MH 19 6996.",
                "issue_id": issue.id if issue else None,
                "bus_registration": "MH 19 6996",
                "status": issue.status if issue else "DETECTED"
            }

        elif step == 4:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            return {
                "step": 4,
                "title": "Rendered on GIS Command Center",
                "description": "Orange alert marker plotted on Leaflet GIS map with coordinates (18.4982, 73.8564).",
                "issue_id": issue.id if issue else None,
                "status": "MAPPED"
            }

        elif step == 5:
            # Second bus arrives
            bus = self.db.query(Bus).filter(Bus.reg_number == "MH 19 7421").first()
            if bus:
                bus.latitude = TARGET_LAT + 0.0001
                bus.longitude = TARGET_LNG + 0.0001
                bus.speed_kmh = 28.0
                self.db.commit()
            return {
                "step": 5,
                "title": "Second Bus Approaches Location",
                "description": "Second bus MH 19 7421 on intersecting route approaches within 12 meters of target coordinates.",
                "bus_id": "BUS-102",
                "bus_registration": "MH 19 7421",
                "status": "APPROACHING"
            }

        elif step == 6:
            # MH 19 7421 confirms the same pothole!
            event = Event(
                event_type="POTHOLE",
                confidence=0.89,
                severity=8,
                bus_id="BUS-102",
                bus_registration_number="MH 19 7421",
                camera_id="FRONT_CAMERA",
                latitude=TARGET_LAT + 0.0001,
                longitude=TARGET_LNG + 0.0001,
                speed_kmh=29.0,
                evidence_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
                timestamp=now
            )
            self.db.add(event)
            self.db.flush()
            issue, is_new = self.verification_service.process_incoming_event(event)

            return {
                "step": 6,
                "title": "Multi-Bus Spatial Verification Triggered",
                "description": f"Backend matched independent observation from distinct bus MH 19 7421. Verified by {issue.confirmations_count} distinct buses!",
                "bus_id": "BUS-102",
                "bus_registration": "MH 19 7421",
                "event_id": event.id,
                "issue_id": issue.id,
                "status": issue.status,
                "confirmations": issue.confirmations_count,
                "combined_confidence": issue.combined_confidence
            }

        elif step == 7:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            return {
                "step": 7,
                "title": "AI Priority Score Surges",
                "description": f"Priority Score upgraded to {issue.priority_score}/100 ({issue.priority_level}) due to verified multi-bus confirmation.",
                "issue_id": issue.id if issue else None,
                "priority_score": issue.priority_score if issue else 94.0,
                "status": "PRIORITIZED"
            }

        elif step == 8:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            return {
                "step": 8,
                "title": "Critical Command Center Alert",
                "description": "PWD Chief Engineer receives verified issue alert with automated bitumen requirement estimation.",
                "issue_id": issue.id if issue else None,
                "status": "ALERTED"
            }

        elif step == 9:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            if issue:
                req = IssueAssignRequest(
                    assigned_contractor="Pune Infrastructure Works Ltd",
                    assigned_officer="Chief Municipal Engineer (Zone 4)",
                    notes="Urgent hot-mix asphalt patching required due to high transit density."
                )
                self.maintenance_service.assign_issue(issue.id, req, officer_name="Authority Console")
            return {
                "step": 9,
                "title": "Work Order Assigned",
                "description": "PWD assigns contractor 'Pune Infrastructure Works Ltd' with 48h Urgent SLA.",
                "issue_id": issue.id if issue else None,
                "contractor": "Pune Infrastructure Works Ltd",
                "status": "ASSIGNED"
            }

        elif step == 10:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            if issue:
                self.maintenance_service.mark_repaired(issue.id, action_by="Contractor Lead", comment="Asphalt patch completed. Curing complete.")
            return {
                "step": 10,
                "title": "Road Marked Repaired",
                "description": "Contractor marks repair complete. Status becomes REPAIRED awaiting transit fleet recheck.",
                "issue_id": issue.id if issue else None,
                "status": "REPAIRED"
            }

        elif step == 11:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            if issue:
                recheck_req = IssueRecheckRequest(
                    bus_id="BUS-103",
                    observed_severity=1,
                    notes="Automated dashcam recheck pass confirmed smooth asphalt."
                )
                self.maintenance_service.perform_recheck(issue.id, recheck_req)
            return {
                "step": 11,
                "title": "Mobile AI Recheck Pass by Bus MH 19 8134",
                "description": "Scheduled transit bus MH 19 8134 traverses location. AI scans surface: defect severity dropped from 8/10 to 1/10!",
                "bus_id": "BUS-103",
                "bus_registration": "MH 19 8134",
                "issue_id": issue.id if issue else None,
                "status": "RECHECKED"
            }

        elif step == 12:
            issue = self.db.query(Issue).filter(Issue.issue_type == "POTHOLE").order_by(Issue.id.desc()).first()
            return {
                "step": 12,
                "title": "Issue Successfully RESOLVED",
                "description": "Autonomous resolution complete with photographic Before/After evidence and zero manual bias.",
                "issue_id": issue.id if issue else None,
                "status": "RESOLVED"
            }

        return {"step": step, "status": "UNKNOWN"}
