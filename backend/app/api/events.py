import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.event import Event
from app.models.bus import Bus
from app.schemas.event import EventResponse, EventCreate
from app.services.verification_service import VerificationService
from app.api.ws import ws_manager

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
def get_events(
    event_type: Optional[str] = Query(None),
    bus_id: Optional[str] = Query(None),
    severity_min: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Retrieve raw and aggregated geo-tagged events from the bus fleet."""
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.event_type == event_type.upper())
    if bus_id:
        query = query.filter(Event.bus_id == bus_id)
    if severity_min:
        query = query.filter(Event.severity >= severity_min)
    return query.order_by(Event.timestamp.desc()).offset(offset).limit(limit).all()


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Retrieve details for an individual detection event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return event


@router.post("", response_model=EventResponse)
async def create_event(
    event_in: EventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Ingest a new geo-tagged event from an Edge AI bus camera.
    Triggers the Multi-Bus Verification Engine.
    """
    # Create raw event
    now = event_in.timestamp or datetime.datetime.utcnow()
    event = Event(
        event_type=event_in.event_type,
        confidence=event_in.confidence,
        severity=event_in.severity,
        bus_id=event_in.bus_id,
        bus_registration_number=event_in.bus_registration_number,
        camera_id=event_in.camera_id or "FRONT_CAMERA",
        camera_position=event_in.camera_position or "FRONT",
        latitude=event_in.latitude,
        longitude=event_in.longitude,
        speed_kmh=event_in.speed_kmh or 25.0,
        heading_deg=event_in.heading_deg or 0.0,
        evidence_url=event_in.evidence_url or "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
        timestamp=now,
        status="RAW"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Update bus detection count
    bus = db.query(Bus).filter(Bus.bus_id == event.bus_id).first()
    if bus:
        bus.last_event_type = event.event_type
        bus.last_event_time = now
        bus.detections_count += 1
        db.commit()

    # Run Multi-Bus Verification Engine
    verif_service = VerificationService(db)
    issue, is_new_issue = verif_service.process_incoming_event(event)

    # Broadcast real-time update via WebSocket
    ws_payload = {
        "type": "NEW_EVENT",
        "event_id": event.id,
        "event_type": event.event_type,
        "bus_id": event.bus_id,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "severity": event.severity,
        "issue_id": issue.id,
        "issue_status": issue.status,
        "confirmations": issue.confirmations_count,
        "priority_score": issue.priority_score
    }
    background_tasks.add_task(ws_manager.broadcast, ws_payload)

    db.refresh(event)
    return event
