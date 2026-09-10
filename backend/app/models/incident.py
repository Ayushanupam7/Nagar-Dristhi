import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database.connection import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(30), unique=True, index=True, nullable=True)  # INC-2041
    incident_type = Column(String(50), nullable=False, index=True)  # HIT_AND_RUN, RASH_DRIVING, ANPR_VIOLATION, PEDESTRIAN_RISK
    bus_id = Column(String(30), nullable=False, index=True)  # Internal Bus ID
    bus_registration_number = Column(String(30), nullable=True, index=True)  # MH 12 Q 4012 / MH 19 6996
    camera_id = Column(String(30), default="FRONT_CAMERA")
    
    # Offending Vehicle & ANPR details (ByteTrack tracking & OCR)
    vehicle_class = Column(String(30), nullable=True)  # SUV, SEDAN, MOTORCYCLE, TRUCK
    registration_number = Column(String(30), nullable=True, index=True)  # MH 19 6996
    license_plate = Column(String(30), nullable=True, index=True)  # Alias for backward compatibility
    plate_confidence = Column(Float, nullable=True)  # 0.94
    ocr_confidence = Column(Float, nullable=True)    # Alias for backward compatibility
    detection_confidence = Column(Float, default=0.91)  # YOLO detection confidence
    tracking_duration = Column(Float, default=12.4)     # ByteTrack duration in seconds
    
    # Pedestrian safety details (School children crossing, proximity, vehicle speed)
    pedestrian_scenario = Column(String(50), nullable=True)  # SCHOOL_CHILDREN_CROSSING, CARRIAGEWAY_CROSSING
    pedestrian_count = Column(Integer, default=0)
    vehicle_proximity_m = Column(Float, default=18.0)  # Distance in meters
    vehicle_speed_kmh = Column(Float, default=42.0)    # Vehicle speed at detection
    risk_score = Column(Integer, default=89)           # 0 to 100
    risk_level = Column(String(20), default="HIGH")    # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(String(255), nullable=True)
    
    # Location & Evidence
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(150), default="Pune Municipal Ward")
    evidence_url = Column(Text, nullable=True)
    
    # Status & Command Alert persistence
    is_demo_mode = Column(Boolean, default=True)  # Explicit tag: DEMO MODE
    status = Column(String(20), default="LOGGED")  # LOGGED, NOTIFIED, ACTIONED
    alert_status = Column(String(30), default="ALERT_GENERATED")  # ALERT_GENERATED, SECURE_ALERT_SENT, ACKNOWLEDGED
    alert_sent_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
