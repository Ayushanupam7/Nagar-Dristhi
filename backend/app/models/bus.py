import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database.connection import Base


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(String(30), unique=True, index=True, nullable=False)  # BUS-102
    reg_number = Column(String(30), nullable=True)  # MH 12 Q 4012
    route_id = Column(String(30), nullable=True)
    route_name = Column(String(100), nullable=False)  # Swargate -> Katraj
    status = Column(String(20), default="ACTIVE", index=True)  # ACTIVE, IDLE, MAINTENANCE
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    speed_kmh = Column(Float, default=32.0)
    heading_deg = Column(Float, default=180.0)
    camera_status = Column(String(20), default="ONLINE")  # ONLINE, DEGRADED, OFFLINE
    ai_mode = Column(String(30), default="SIMULATION")  # SIMULATION, EDGE_YOLO
    last_event_type = Column(String(50), nullable=True)
    last_event_time = Column(DateTime, nullable=True)
    detections_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
