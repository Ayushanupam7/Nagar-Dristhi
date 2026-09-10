import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EventBase(BaseModel):
    event_type: str = Field(..., description="POTHOLE, DAMAGED_ROAD, ROAD_SURFACE_DETERIORATION, WATERLOGGING, MISSING_DIVIDER, MISSING_ZEBRA_CROSSING, DAMAGED_SIGNBOARD, OTHER_HAZARD")
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: int = Field(..., ge=1, le=10)
    bus_id: str
    bus_registration_number: Optional[str] = None
    camera_id: Optional[str] = "FRONT_CAMERA"
    camera_position: Optional[str] = "FRONT"
    latitude: float
    longitude: float
    speed_kmh: Optional[float] = 25.0
    heading_deg: Optional[float] = 0.0
    evidence_url: Optional[str] = None


class EventCreate(EventBase):
    timestamp: Optional[datetime.datetime] = None


class EventConfirmationResponse(BaseModel):
    id: int
    bus_id: str
    bus_registration_number: Optional[str] = None
    confidence: float
    severity: int
    latitude: float
    longitude: float
    distance_meters: float
    confirmed_at: datetime.datetime

    class Config:
        from_attributes = True


class EventResponse(EventBase):
    id: int
    timestamp: datetime.datetime
    issue_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True
