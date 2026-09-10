import json
import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.models.event import Event, EventConfirmation
from app.models.issue import Issue, IssueStatusHistory
from app.database.connection import haversine_distance_meters
from app.services.priority_service import calculate_priority_score


class VerificationService:
    def __init__(self, db: Session):
        self.db = db

    def process_incoming_event(self, event: Event) -> Tuple[Issue, bool]:
        """
        Process an incoming raw event and apply Multi-Bus Verification logic.
        Returns (issue, is_new_issue_created).
        """
        # 1. Search for active matching issues of same type within active time window
        time_cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=settings.TIME_WINDOW_HOURS)
        
        # Don't merge into RESOLVED or RECHECKED issues unless reopening
        active_issues = self.db.query(Issue).filter(
            Issue.issue_type == event.event_type,
            Issue.status.in_(["DETECTED", "VERIFIED", "PRIORITIZED", "ASSIGNED", "REPAIRED"]),
            Issue.updated_at >= time_cutoff
        ).all()

        matched_issue: Optional[Issue] = None
        closest_distance = float("inf")

        for issue in active_issues:
            dist = haversine_distance_meters(event.latitude, event.longitude, issue.latitude, issue.longitude)
            if dist <= settings.DISTANCE_THRESHOLD_METERS and dist < closest_distance:
                closest_distance = dist
                matched_issue = issue

        now = datetime.datetime.utcnow()

        if matched_issue:
            # Check existing bus confirmations for this issue
            existing_bus_ids = {conf.bus_id for conf in matched_issue.confirmations}
            
            # Associate event to this issue
            event.issue_id = matched_issue.id
            event.status = "MERGED"

            is_independent_bus = event.bus_id not in existing_bus_ids

            if is_independent_bus:
                # Add confirmation from this new independent bus
                confirmation = EventConfirmation(
                    issue_id=matched_issue.id,
                    event_id=event.id,
                    bus_id=event.bus_id,
                    confidence=event.confidence,
                    severity=event.severity,
                    latitude=event.latitude,
                    longitude=event.longitude,
                    distance_meters=round(closest_distance, 1),
                    confirmed_at=now
                )
                self.db.add(confirmation)
                self.db.flush()

                # Refresh confirmations count
                new_conf_count = len(existing_bus_ids) + 1
                matched_issue.confirmations_count = new_conf_count

                # Update combined confidence using probabilistic ensemble:
                # C_new = 1 - (1 - C_old) * (1 - C_event)
                old_conf = matched_issue.combined_confidence
                merged_conf = 1.0 - ((1.0 - old_conf) * (1.0 - event.confidence))
                matched_issue.combined_confidence = round(min(merged_conf, 0.99), 3)

                # Severity: max or weighted average
                matched_issue.severity = max(matched_issue.severity, event.severity)

                # Check if threshold reached for VERIFIED status
                if new_conf_count >= settings.MIN_INDEPENDENT_BUSES and matched_issue.status == "DETECTED":
                    matched_issue.status = "VERIFIED"
                    history_entry = IssueStatusHistory(
                        issue_id=matched_issue.id,
                        from_status="DETECTED",
                        to_status="VERIFIED",
                        action_by="AI Verification Engine",
                        comment=f"Multi-Bus Confirmation achieved by {new_conf_count} independent buses ({matched_issue.first_bus_id}, {event.bus_id}).",
                        created_at=now
                    )
                    self.db.add(history_entry)

                # Recalculate priority score with updated confirmations & confidence
                score, level, factors = calculate_priority_score(
                    confidence=matched_issue.combined_confidence,
                    severity=matched_issue.severity,
                    traffic_level=matched_issue.traffic_level,
                    safety_risk=matched_issue.safety_risk,
                    confirmations_count=matched_issue.confirmations_count
                )
                matched_issue.priority_score = score
                matched_issue.priority_level = level
                matched_issue.priority_factors_json = json.dumps(factors)
                matched_issue.updated_at = now
                self.db.commit()
                self.db.refresh(matched_issue)
                return matched_issue, False
            else:
                # Same bus detected it again on return trip: update timestamp, but don't increment independent bus count
                matched_issue.updated_at = now
                self.db.commit()
                self.db.refresh(matched_issue)
                return matched_issue, False

        else:
            # Create NEW consolidated Issue
            issue_count = self.db.query(Issue).count() + 1
            code_prefix = {
                "POTHOLE": "ND-POT",
                "WATERLOGGING": "ND-WTR",
                "DAMAGED_ROAD": "ND-ROD",
                "MISSING_DIVIDER": "ND-DIV",
                "DAMAGED_SIGNBOARD": "ND-SGN",
                "TRAFFIC_CONGESTION": "ND-TRF"
            }.get(event.event_type, "ND-ISS")

            issue_code = f"{code_prefix}-{1000 + issue_count}"

            # Calculate initial priority score for single detection
            score, level, factors = calculate_priority_score(
                confidence=event.confidence,
                severity=event.severity,
                traffic_level="HIGH",
                safety_risk="HIGH" if event.severity >= 7 else "MEDIUM",
                confirmations_count=1
            )

            default_evidence = {
                "POTHOLE": "/evidence_pothole.jpg",
                "DAMAGED_ROAD": "/evidence_damaged_road.jpg",
                "MISSING_DIVIDER": "/evidence_missing_divider.jpg",
                "DAMAGED_SIGNBOARD": "/evidence_damaged_signboard.jpg",
                "WATERLOGGING": "/evidence_waterlogging.jpg",
            }.get(event.event_type, "/evidence_pothole.jpg")

            new_issue = Issue(
                issue_code=issue_code,
                issue_type=event.event_type,
                latitude=event.latitude,
                longitude=event.longitude,
                location_name=f"Corridor near Lat {event.latitude:.4f}, Lng {event.longitude:.4f}",
                ward_name="Pune Municipal Corporation Ward",
                first_bus_id=event.bus_id,
                confirmations_count=1,
                combined_confidence=event.confidence,
                severity=event.severity,
                traffic_level="HIGH",
                safety_risk="HIGH" if event.severity >= 7 else "MEDIUM",
                priority_score=score,
                priority_level=level,
                priority_factors_json=json.dumps(factors),
                status="DETECTED",
                before_evidence_url=event.evidence_url or default_evidence,
                created_at=now,
                updated_at=now
            )
            self.db.add(new_issue)
            self.db.flush()

            # Add first bus confirmation
            first_conf = EventConfirmation(
                issue_id=new_issue.id,
                event_id=event.id,
                bus_id=event.bus_id,
                confidence=event.confidence,
                severity=event.severity,
                latitude=event.latitude,
                longitude=event.longitude,
                distance_meters=0.0,
                confirmed_at=now
            )
            self.db.add(first_conf)

            # Record initial history
            init_history = IssueStatusHistory(
                issue_id=new_issue.id,
                from_status=None,
                to_status="DETECTED",
                action_by=f"Fleet Camera ({event.bus_id})",
                comment=f"Initial detection logged with confidence {round(event.confidence * 100)}% and severity {event.severity}/10.",
                created_at=now
            )
            self.db.add(init_history)

            event.issue_id = new_issue.id
            event.status = "MERGED"

            self.db.commit()
            self.db.refresh(new_issue)
            return new_issue, True
