import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_code = Column(String(30), unique=True, index=True, nullable=False)  # ND-POT-1837
    issue_type = Column(String(50), nullable=False, index=True)  # POTHOLE, WATERLOGGING, etc.
    
    # Location
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location_name = Column(String(200), default="Pune Municipal Ward")
    ward_name = Column(String(100), default="Central Zone")
    
    # Verification & Aggregation
    first_bus_id = Column(String(30), nullable=False)
    confirmations_count = Column(Integer, default=1)  # distinct independent buses
    combined_confidence = Column(Float, default=0.75)
    severity = Column(Integer, default=5)  # 1 to 10
    
    # Priority Calculation (0 to 100)
    traffic_level = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, EXTREME
    safety_risk = Column(String(20), default="HIGH")    # LOW, MEDIUM, HIGH, CRITICAL
    priority_score = Column(Float, default=50.0, index=True)
    priority_level = Column(String(20), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    priority_factors_json = Column(Text, nullable=True)  # JSON string of breakdown weights
    
    # Authority Action Lifecycle
    # DETECTED -> VERIFIED -> PRIORITIZED -> ASSIGNED -> REPAIRED -> RECHECKED -> RESOLVED
    status = Column(String(30), default="DETECTED", index=True)
    
    assigned_contractor = Column(String(150), nullable=True)
    assigned_officer = Column(String(100), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    repaired_at = Column(DateTime, nullable=True)
    rechecked_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Recheck observation data
    recheck_severity = Column(Integer, nullable=True)  # Should drop to <= 2
    recheck_bus_id = Column(String(30), nullable=True)
    
    # Visual Evidence
    before_evidence_url = Column(Text, nullable=True)
    after_evidence_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    events = relationship("Event", back_populates="issue")
    confirmations = relationship("EventConfirmation", back_populates="issue", cascade="all, delete-orphan")
    history = relationship("IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan")


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    action_by = Column(String(100), default="System")
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    issue = relationship("Issue", back_populates="history")
