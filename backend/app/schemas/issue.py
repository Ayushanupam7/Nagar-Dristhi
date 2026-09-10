import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.event import EventConfirmationResponse


class PriorityBreakdown(BaseModel):
    score: float
    level: str  # LOW, MEDIUM, HIGH, CRITICAL
    factors: Dict[str, float]  # confidence, severity, traffic, safety, verification


class IssueStatusHistoryResponse(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    action_by: str
    comment: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class IssueBase(BaseModel):
    issue_code: str
    issue_type: str
    latitude: float
    longitude: float
    location_name: str
    ward_name: str
    first_bus_id: str
    confirmations_count: int
    combined_confidence: float
    severity: int
    traffic_level: str
    safety_risk: str
    priority_score: float
    priority_level: str
    status: str
    assigned_contractor: Optional[str] = None
    assigned_officer: Optional[str] = None
    before_evidence_url: Optional[str] = None
    after_evidence_url: Optional[str] = None
    recheck_severity: Optional[int] = None
    recheck_bus_id: Optional[str] = None
    notes: Optional[str] = None


class IssueResponse(IssueBase):
    id: int
    priority_factors: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None
    assigned_at: Optional[datetime.datetime] = None
    repaired_at: Optional[datetime.datetime] = None
    rechecked_at: Optional[datetime.datetime] = None
    resolved_at: Optional[datetime.datetime] = None
    confirmations: List[EventConfirmationResponse] = []
    history: List[IssueStatusHistoryResponse] = []

    class Config:
        from_attributes = True


class IssueUpdateStatus(BaseModel):
    status: str = Field(..., description="DETECTED, VERIFIED, PRIORITIZED, ASSIGNED, REPAIRED, RECHECKED, RESOLVED")
    action_by: Optional[str] = "Authority Officer"
    comment: Optional[str] = None


class IssueAssignRequest(BaseModel):
    assigned_contractor: str
    assigned_officer: Optional[str] = "Zone 4 Engineer"
    notes: Optional[str] = None


class IssueRecheckRequest(BaseModel):
    bus_id: str = "BUS-304"
    observed_severity: int = Field(..., ge=1, le=10, description="Severity detected during recheck pass (1 indicates resolved)")
    evidence_url: Optional[str] = None
    notes: Optional[str] = "AI Mobile Verification pass confirmed road patch completed."
