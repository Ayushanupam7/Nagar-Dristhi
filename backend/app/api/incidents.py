import random
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse, IncidentCreate, IncidentAlertRequest
from app.api.ws import ws_manager

router = APIRouter(prefix="/incidents", tags=["Incidents & ANPR"])


@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    incident_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Retrieve ANPR license plate detections, hit & run tracking, and pedestrian safety alerts."""
    query = db.query(Incident)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type.upper())
    if status:
        query = query.filter(Incident.status == status.upper())
    return query.order_by(Incident.timestamp.desc()).limit(limit).all()


@router.post("", response_model=IncidentResponse)
async def create_incident(inc_in: IncidentCreate, db: Session = Depends(get_db)):
    """Log an ANPR, Hit & Run, or pedestrian safety event."""
    inc_data = inc_in.dict()
    if not inc_data.get("incident_code"):
        inc_data["incident_code"] = f"INC-{random.randint(2000, 9999)}"
    if inc_data.get("license_plate") and not inc_data.get("registration_number"):
        inc_data["registration_number"] = inc_data["license_plate"]
    
    inc = Incident(**inc_data)
    db.add(inc)
    db.commit()
    db.refresh(inc)

    await ws_manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "incident_type": inc.incident_type,
        "registration_number": inc.registration_number or inc.license_plate,
        "risk_level": inc.risk_level,
        "alert_status": inc.alert_status
    })
    return inc


# ---------------------------------------------------------
# Static Simulation Endpoints (Declared before /{incident_id})
# ---------------------------------------------------------

@router.post("/simulate-hit-and-run", response_model=IncidentResponse)
async def simulate_hit_and_run(db: Session = Depends(get_db)):
    """
    Simulate ByteTrack tracking -> ANPR extraction -> Secure Command Alert.
    Offending vehicle MH 19 6996 tracked for 12.4 seconds with 94% plate confidence.
    """
    code = f"INC-{random.randint(2040, 2099)}"
    plate = "MH 19 6996"
    inc = Incident(
        incident_code=code,
        incident_type="HIT_AND_RUN",
        bus_id="BUS-102",
        bus_registration_number="MH 19 6996",
        camera_id="FRONT_CAMERA",
        vehicle_class="SUV",
        registration_number=plate,
        license_plate=plate,
        plate_confidence=0.94,
        ocr_confidence=0.94,
        detection_confidence=0.91,
        tracking_duration=12.4,
        risk_level="CRITICAL",
        description="Offending black SUV collided with two-wheeler on Karve Road and accelerated through junction without stopping.",
        latitude=18.5082,
        longitude=73.8329,
        location_name="Karve Road near Nal Stop Junction",
        evidence_url="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop",
        is_demo_mode=True,
        status="ACTIONED",
        alert_status="SECURE_ALERT_SENT",
        alert_sent_at=datetime.datetime.utcnow(),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    await ws_manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "incident_type": "HIT_AND_RUN",
        "registration_number": plate,
        "risk_level": "CRITICAL",
        "alert_status": "SECURE_ALERT_SENT"
    })
    return inc


@router.post("/simulate-anpr", response_model=IncidentResponse)
async def simulate_anpr_detection(db: Session = Depends(get_db)):
    """Trigger a controlled demo ANPR violation (BRTS dedicated bus lane intrusion)."""
    plates = ["MH 19 7421", "MH 14 DE 4567", "MH 12 QX 8899", "MH 02 BG 3412"]
    plate = random.choice(plates)
    code = f"INC-{random.randint(3000, 3999)}"
    inc = Incident(
        incident_code=code,
        incident_type="ANPR_VIOLATION",
        bus_id="BUS-105",
        bus_registration_number="MH 19 7421",
        camera_id="FRONT_CAMERA",
        vehicle_class="MOTORCYCLE",
        registration_number=plate,
        license_plate=plate,
        plate_confidence=round(random.uniform(0.92, 0.98), 2),
        ocr_confidence=round(random.uniform(0.92, 0.98), 2),
        detection_confidence=0.95,
        tracking_duration=8.2,
        risk_level="HIGH",
        description=f"Motorcycle ({plate}) detected illegally navigating BRTS dedicated transit lane.",
        latitude=18.4990 + (random.random() - 0.5) * 0.01,
        longitude=73.8568 + (random.random() - 0.5) * 0.01,
        location_name="Swargate BRTS Dedicated Corridor",
        evidence_url="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop",
        is_demo_mode=True,
        status="LOGGED",
        alert_status="ALERT_GENERATED",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    await ws_manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "incident_type": "ANPR_VIOLATION",
        "registration_number": inc.registration_number,
        "risk_level": "HIGH",
        "alert_status": "ALERT_GENERATED"
    })
    return inc


@router.post("/simulate-school-crossing", response_model=IncidentResponse)
@router.post("/simulate-pedestrian", response_model=IncidentResponse)
async def simulate_pedestrian_risk(db: Session = Depends(get_db)):
    """
    Trigger School Children Crossing scenario.
    Vehicle speed 42 km/h, distance 18m, risk score 89/100 (HIGH).
    """
    code = f"PED-{random.randint(4000, 4999)}"
    inc = Incident(
        incident_code=code,
        incident_type="PEDESTRIAN_RISK",
        bus_id="BUS-110",
        bus_registration_number="MH 19 8134",
        camera_id="FRONT_CAMERA",
        pedestrian_scenario="SCHOOL_CHILDREN_CROSSING",
        pedestrian_count=4,
        vehicle_proximity_m=18.0,
        vehicle_speed_kmh=42.0,
        risk_score=89,
        risk_level="CRITICAL",
        description="School children crossing roadway near St. Vincent School without active crossing guard. Vehicle approaching at 42 km/h within 18 meters.",
        latitude=18.5144,
        longitude=73.8762,
        location_name="Camp School Zone near St. Vincent High School",
        evidence_url="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop",
        is_demo_mode=True,
        status="LOGGED",
        alert_status="ALERT_GENERATED",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    await ws_manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "incident_type": "PEDESTRIAN_RISK",
        "pedestrian_scenario": "SCHOOL_CHILDREN_CROSSING",
        "risk_score": 89,
        "risk_level": "CRITICAL",
        "alert_status": "ALERT_GENERATED"
    })
    return inc


# ---------------------------------------------------------
# Dynamic Parameterized Endpoints
# ---------------------------------------------------------

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Retrieve details and evidence for a specific incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.post("/{incident_id}/alert", response_model=IncidentResponse)
async def dispatch_secure_alert(
    incident_id: int,
    alert_req: IncidentAlertRequest = None,
    db: Session = Depends(get_db)
):
    """Dispatch a secure, encrypted alert to Police / Command system and persist alert state."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.alert_status = "SECURE_ALERT_SENT"
    inc.alert_sent_at = datetime.datetime.utcnow()
    inc.status = "ACTIONED"
    db.commit()
    db.refresh(inc)

    await ws_manager.broadcast({
        "type": "INCIDENT_ALERT_DISPATCHED",
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "alert_status": inc.alert_status,
        "registration_number": inc.registration_number or inc.license_plate,
        "timestamp": inc.alert_sent_at.isoformat()
    })
    return inc
