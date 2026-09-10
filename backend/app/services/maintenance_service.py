import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.issue import Issue, IssueStatusHistory
from app.schemas.issue import IssueAssignRequest, IssueRecheckRequest


class MaintenanceService:
    def __init__(self, db: Session):
        self.db = db

    def assign_issue(self, issue_id: int, assign_req: IssueAssignRequest, officer_name: str = "Admin") -> Issue:
        issue = self.db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")
        
        now = datetime.datetime.utcnow()
        old_status = issue.status
        issue.status = "ASSIGNED"
        issue.assigned_contractor = assign_req.assigned_contractor
        issue.assigned_officer = assign_req.assigned_officer or officer_name
        issue.assigned_at = now
        issue.notes = assign_req.notes or issue.notes

        history = IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_status,
            to_status="ASSIGNED",
            action_by=officer_name,
            comment=f"Assigned to contractor '{assign_req.assigned_contractor}'. Notes: {assign_req.notes or 'Standard repair order'}",
            created_at=now
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(issue)
        return issue

    def mark_repaired(self, issue_id: int, action_by: str = "Contractor Officer", comment: Optional[str] = None) -> Issue:
        issue = self.db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")

        now = datetime.datetime.utcnow()
        old_status = issue.status
        issue.status = "REPAIRED"
        issue.repaired_at = now
        issue.after_evidence_url = "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=600&auto=format&fit=crop"

        history = IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_status,
            to_status="REPAIRED",
            action_by=action_by,
            comment=comment or "Road repair completed by contractor. Pending mobile AI fleet recheck.",
            created_at=now
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(issue)
        return issue

    def perform_recheck(self, issue_id: int, recheck_req: IssueRecheckRequest) -> Issue:
        """
        Differentiator Feature:
        Simulated or live bus observation rechecks the repaired location.
        If observed severity <= 2/10, automatically marks issue as RESOLVED.
        """
        issue = self.db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")

        now = datetime.datetime.utcnow()
        old_status = issue.status
        issue.rechecked_at = now
        issue.recheck_bus_id = recheck_req.bus_id
        issue.recheck_severity = recheck_req.observed_severity

        if recheck_req.observed_severity <= 2:
            issue.status = "RESOLVED"
            issue.resolved_at = now
            history_comment = (
                f"Fleet Bus {recheck_req.bus_id} verified repair. "
                f"Defect severity dropped from {issue.severity}/10 to {recheck_req.observed_severity}/10. "
                f"Issue successfully resolved."
            )
            to_status = "RESOLVED"
        else:
            issue.status = "RECHECKED"
            history_comment = (
                f"Fleet Bus {recheck_req.bus_id} rechecked location. "
                f"Severity measured at {recheck_req.observed_severity}/10. Repair incomplete."
            )
            to_status = "RECHECKED"

        history = IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_status,
            to_status=to_status,
            action_by=f"AI Fleet Recheck ({recheck_req.bus_id})",
            comment=history_comment,
            created_at=now
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(issue)
        return issue
