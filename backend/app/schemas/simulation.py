from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class SimulationEventTrigger(BaseModel):
    event_type: str = "POTHOLE"
    bus_id: str = "BUS-102"
    latitude: Optional[float] = 18.5018
    longitude: Optional[float] = 73.8580
    confidence: float = 0.82
    severity: int = 8
    route_name: Optional[str] = "Swargate → Katraj"


class SihDemoStepResponse(BaseModel):
    step: int
    title: str
    description: str
    bus_id: Optional[str] = None
    event_id: Optional[int] = None
    issue_id: Optional[int] = None
    status: str
    priority_score: Optional[float] = None
    details: Dict[str, Any] = {}
