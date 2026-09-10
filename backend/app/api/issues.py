import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatusHistory
from app.schemas.issue import (
    IssueResponse,
    IssueUpdateStatus,
    IssueAssignRequest,
    IssueRecheckRequest
)
from app.services.maintenance_service import MaintenanceService
from app.api.ws import ws_manager

router = APIRouter(prefix="/issues", tags=["Issues"])


def format_issue_response(issue: Issue) -> dict:
    factors = {}
    if issue.priority_factors_json:
        try:
            factors = json.loads(issue.priority_factors_json)
        except Exception:
            factors = {}

    return {
        "id": issue.id,
        "issue_code": issue.issue_code,
        "issue_type": issue.issue_type,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "location_name": issue.location_name,
        "ward_name": issue.ward_name,
        "first_bus_id": issue.first_bus_id,
        "confirmations_count": issue.confirmations_count,
        "combined_confidence": issue.combined_confidence,
        "severity": issue.severity,
        "traffic_level": issue.traffic_level,
        "safety_risk": issue.safety_risk,
        "priority_score": issue.priority_score,
        "priority_level": issue.priority_level,
        "priority_factors": factors,
        "status": issue.status,
        "assigned_contractor": issue.assigned_contractor,
        "assigned_officer": issue.assigned_officer,
        "assigned_at": issue.assigned_at,
        "repaired_at": issue.repaired_at,
        "rechecked_at": issue.rechecked_at,
        "resolved_at": issue.resolved_at,
        "recheck_severity": issue.recheck_severity,
        "recheck_bus_id": issue.recheck_bus_id,
        "before_evidence_url": issue.before_evidence_url,
        "after_evidence_url": issue.after_evidence_url,
        "notes": issue.notes,
        "created_at": issue.created_at,
        "updated_at": issue.updated_at,
        "confirmations": issue.confirmations,
        "history": issue.history
    }


@router.get("")
def get_issues(
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    priority_level: Optional[str] = Query(None),
    ward: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve aggregated urban issues with filter and search."""
    query = db.query(Issue)
    if status:
        query = query.filter(Issue.status == status.upper())
    if issue_type:
        query = query.filter(Issue.issue_type == issue_type.upper())
    if priority_level:
        query = query.filter(Issue.priority_level == priority_level.upper())
    if ward:
        query = query.filter(Issue.ward_name.ilike(f"%{ward}%"))
    if search:
        query = query.filter(
            (Issue.issue_code.ilike(f"%{search}%")) |
            (Issue.location_name.ilike(f"%{search}%")) |
            (Issue.notes.ilike(f"%{search}%"))
        )
    
    issues = query.order_by(Issue.priority_score.desc()).all()
    return [format_issue_response(iss) for iss in issues]


@router.get("/{issue_id}")
def get_issue(issue_id: int, db: Session = Depends(get_db)):
    """Retrieve complete issue details, multi-bus confirmations, priority breakdown and audit timeline."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail=f"Issue {issue_id} not found")
    return format_issue_response(issue)


@router.patch("/{issue_id}/status")
async def update_issue_status(issue_id: int, update_req: IssueUpdateStatus, db: Session = Depends(get_db)):
    """Update issue lifecycle status."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail=f"Issue {issue_id} not found")

    old_status = issue.status
    now = datetime.datetime.utcnow()
    issue.status = update_req.status.upper()
    issue.updated_at = now

    if issue.status == "RESOLVED":
        issue.resolved_at = now
    elif issue.status == "REPAIRED":
        issue.repaired_at = now

    history = IssueStatusHistory(
        issue_id=issue.id,
        from_status=old_status,
        to_status=issue.status,
        action_by=update_req.action_by or "Authority Officer",
        comment=update_req.comment or f"Status transitioned from {old_status} to {issue.status}",
        created_at=now
    )
    db.add(history)
    db.commit()
    db.refresh(issue)

    await ws_manager.broadcast({
        "type": "ISSUE_STATUS_UPDATED",
        "issue_id": issue.id,
        "from_status": old_status,
        "to_status": issue.status
    })

    return format_issue_response(issue)


@router.post("/{issue_id}/assign")
async def assign_issue(issue_id: int, req: IssueAssignRequest, db: Session = Depends(get_db)):
    """Assign an authorized contractor work order to this issue."""
    maint_service = MaintenanceService(db)
    try:
        issue = maint_service.assign_issue(issue_id, req, officer_name="Authority Portal")
        await ws_manager.broadcast({
            "type": "ISSUE_ASSIGNED",
            "issue_id": issue.id,
            "contractor": req.assigned_contractor
        })
        return format_issue_response(issue)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{issue_id}/recheck")
async def perform_recheck(issue_id: int, req: IssueRecheckRequest, db: Session = Depends(get_db)):
    """Mobile bus AI recheck pass on repaired road coordinate."""
    maint_service = MaintenanceService(db)
    try:
        issue = maint_service.perform_recheck(issue_id, req)
        await ws_manager.broadcast({
            "type": "ISSUE_RECHECKED",
            "issue_id": issue.id,
            "status": issue.status,
            "recheck_severity": req.observed_severity
        })
        return format_issue_response(issue)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
