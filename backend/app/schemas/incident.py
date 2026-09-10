import datetime
from typing import Optional
from pydantic import BaseModel, Field


class IncidentBase(BaseModel):
    incident_type: str = Field(..., description="HIT_AND_RUN, RASH_DRIVING, ANPR_VIOLATION, PEDESTRIAN_RISK")
    bus_id: str
    bus_registration_number: Optional[str] = None
    camera_id: Optional[str] = "FRONT_CAMERA"
    
    # Hit & Run / ANPR fields
    incident_code: Optional[str] = None
    vehicle_class: Optional[str] = None
    registration_number: Optional[str] = None
    license_plate: Optional[str] = None
    plate_confidence: Optional[float] = None
    ocr_confidence: Optional[float] = None
    detection_confidence: Optional[float] = 0.91
    tracking_duration: Optional[float] = 12.4
    
    # Pedestrian Risk fields
    pedestrian_scenario: Optional[str] = None
    pedestrian_count: Optional[int] = 0
    vehicle_proximity_m: Optional[float] = 18.0
    vehicle_speed_kmh: Optional[float] = 42.0
    risk_score: Optional[int] = 89
    risk_level: str = "HIGH"
    
    description: Optional[str] = None
    latitude: float
    longitude: float
    location_name: Optional[str] = "Pune Municipal Ward"
    evidence_url: Optional[str] = None
    is_demo_mode: bool = True
    status: str = "LOGGED"
    alert_status: str = "ALERT_GENERATED"


class IncidentCreate(IncidentBase):
    pass


class IncidentAlertRequest(BaseModel):
    action_by: Optional[str] = "Command Center Officer"
    alert_notes: Optional[str] = "Dispatched emergency alert to Pune Traffic Police Division."


class IncidentResponse(IncidentBase):
    id: int
    alert_sent_at: Optional[datetime.datetime] = None
    timestamp: datetime.datetime

    class Config:
        from_attributes = True
