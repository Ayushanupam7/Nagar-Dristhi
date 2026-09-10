import datetime
from typing import Optional
from pydantic import BaseModel


class BusBase(BaseModel):
    bus_id: str
    reg_number: Optional[str] = None
    route_id: Optional[str] = None
    route_name: str
    status: str = "ACTIVE"
    latitude: float
    longitude: float
    speed_kmh: float = 30.0
    heading_deg: float = 180.0
    camera_status: str = "ONLINE"
    ai_mode: str = "SIMULATION"


class BusCreate(BusBase):
    pass


class BusUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    speed_kmh: Optional[float] = None
    heading_deg: Optional[float] = None
    status: Optional[str] = None
    camera_status: Optional[str] = None
    last_event_type: Optional[str] = None
    detections_count: Optional[int] = None


class BusResponse(BusBase):
    id: int
    last_event_type: Optional[str] = None
    last_event_time: Optional[datetime.datetime] = None
    detections_count: int = 0
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True
