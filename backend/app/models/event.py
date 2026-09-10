import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base

# Unified Road Defect Taxonomy for SIH PS 26124
ROAD_DEFECT_TYPES = [
    "POTHOLE",
    "DAMAGED_ROAD",
    "ROAD_SURFACE_DETERIORATION",
    "WATERLOGGING",
    "MISSING_DIVIDER",
    "MISSING_ZEBRA_CROSSING",
    "DAMAGED_SIGNBOARD",
    "OTHER_HAZARD"
]


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # POTHOLE, DAMAGED_ROAD, WATERLOGGING, etc.
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0 (e.g. 0.94)
    severity = Column(Integer, nullable=False)  # 1 to 10
    bus_id = Column(String(30), nullable=False, index=True)  # Internal identifier
    bus_registration_number = Column(String(30), nullable=True, index=True)  # Public identifier (e.g. MH 19 6996)
    camera_id = Column(String(30), default="FRONT_CAMERA")  # FRONT_CAMERA, REAR_CAMERA, etc.
    camera_position = Column(String(30), default="FRONT")
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    speed_kmh = Column(Float, default=28.0)
    heading_deg = Column(Float, default=0.0)
    evidence_url = Column(Text, nullable=True)  # Frame snapshot / video reference
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    dedup_hash = Column(String(64), nullable=True, index=True)
    
    # Associated issue (if merged)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), default="DETECTED")  # DETECTED, MERGED, RECHECK, VERIFIED
    
    issue = relationship("Issue", back_populates="events")


class EventConfirmation(Base):
    """Tracks each distinct bus confirmation of an aggregated issue."""
    __tablename__ = "event_confirmations"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    bus_id = Column(String(30), nullable=False, index=True)
    bus_registration_number = Column(String(30), nullable=True, index=True)
    camera_id = Column(String(30), default="FRONT_CAMERA")
    confidence = Column(Float, nullable=False)
    severity = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance_meters = Column(Float, default=0.0)
    confirmed_at = Column(DateTime, default=datetime.datetime.utcnow)

    issue = relationship("Issue", back_populates="confirmations")
