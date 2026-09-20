import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.bus import Bus
from app.models.event import Event
from app.schemas.bus import BusResponse, BusCreate, BusUpdate
from app.ai.detector import RoadDefectDetector

router = APIRouter(prefix="/buses", tags=["Buses"])


@router.get("", response_model=List[BusResponse])
def get_buses(
    status: Optional[str] = Query(None, description="ACTIVE, IDLE, MAINTENANCE"),
    route: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve all municipal transit buses in the fleet."""
    query = db.query(Bus)
    if status:
        query = query.filter(Bus.status == status.upper())
    if route:
        query = query.filter(Bus.route_name.ilike(f"%{route}%"))
    return query.order_by(Bus.bus_id.asc()).all()


@router.get("/{bus_id}")
def get_bus_detail(bus_id: str, db: Session = Depends(get_db)):
    """Retrieve bus profile, route info, and simulated live camera HUD detections."""
    bus = db.query(Bus).filter(Bus.bus_id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found")
    
    # Recent detections by this bus
    recent_events = db.query(Event).filter(
        Event.bus_id == bus_id
    ).order_by(Event.timestamp.desc()).limit(5).all()

    # Generate realistic simulated detection HUD overlays
    hud_detections = [
        {"class": "CAR", "confidence": 0.94, "bbox": [140, 260, 220, 340], "track_id": 104},
        {"class": "MOTORCYCLE", "confidence": 0.89, "bbox": [280, 290, 330, 360], "track_id": 105},
        {"class": "POTHOLE", "confidence": 0.86, "bbox": [180, 370, 270, 430], "track_id": None},
    ]

    return {
        "bus": bus,
        "recent_events": recent_events,
        "hud_detections": hud_detections,
        "camera_feed_url": "/pune_bus_dashcam.jpg"
    }


@router.patch("/{bus_id}", response_model=BusResponse)
def update_bus(bus_id: str, bus_update: BusUpdate, db: Session = Depends(get_db)):
    """Update bus GPS telemetry and status."""
    bus = db.query(Bus).filter(Bus.bus_id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found")
    
    update_data = bus_update.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(bus, field, val)
    
    db.commit()
    db.refresh(bus)
    return bus


@router.post("", response_model=BusResponse)
def create_bus(bus_in: BusCreate, db: Session = Depends(get_db)):
    """Register a new transit bus into the fleet."""
    if db.query(Bus).filter(Bus.bus_id == bus_in.bus_id).first():
        raise HTTPException(status_code=400, detail="Bus ID already registered")
    
    bus = Bus(**bus_in.dict())
    db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus


@router.post("/{bus_id}/upload-footage")
async def upload_bus_footage(
    bus_id: str,
    file: UploadFile = File(...),
    camera_id: str = Form("FRONT_ROAD"),
    defect_type: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload transit dashcam video or image footage for a specific bus.
    Saves the footage and runs edge detection simulation / analysis.
    """
    bus = db.query(Bus).filter(Bus.bus_id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found")

    # Validate file type
    content_type = file.content_type or ""
    filename = file.filename or "footage"
    ext = os.path.splitext(filename)[1].lower()
    
    is_video = content_type.startswith("video") or ext in [".mp4", ".webm", ".mov", ".ogg", ".mkv"]
    is_image = content_type.startswith("image") or ext in [".jpg", ".jpeg", ".png", ".webp"]

    if not (is_video or is_image):
        raise HTTPException(
            status_code=400,
            detail="Unsupported media format. Please upload an MP4, WebM, MOV video or JPG/PNG image."
        )

    # Prepare storage directory
    static_uploads = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
    os.makedirs(static_uploads, exist_ok=True)

    unique_filename = f"{bus_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(static_uploads, unique_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    media_url = f"/static/uploads/{unique_filename}"

    # Run genuine computer vision surface & defect analysis on the uploaded footage
    detector = RoadDefectDetector()
    analysis = detector.analyze_frame(dest_path, camera_id=camera_id)

    return {
        "status": "SUCCESS",
        "bus_id": bus_id,
        "camera_id": camera_id,
        "filename": filename,
        "media_type": "video" if is_video else "image",
        "url": media_url,
        "file_size": os.path.getsize(dest_path),
        "analysis": analysis,
        "is_road_surface": analysis.get("is_road_surface", True),
        "surface_type": analysis.get("surface_type", "ROADWAY"),
        "surface_label": analysis.get("surface_label", "Roadway"),
        "asphalt_confidence": analysis.get("asphalt_confidence", 0.9),
        "edge_status": analysis.get("status", "SUCCESS"),
        "reason": analysis.get("reason", "Analysis complete"),
        "detections": analysis.get("detections", [])
    }
