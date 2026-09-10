import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database.connection import Base


class TrafficObservation(Base):
    __tablename__ = "traffic_observations"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(String(30), nullable=False, index=True)
    bus_registration_number = Column(String(30), nullable=True, index=True)
    route_name = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(150), default="Pune Central Road")
    
    # Vehicle classification counts
    cars_count = Column(Integer, default=0)
    bikes_count = Column(Integer, default=0)
    buses_count = Column(Integer, default=0)
    trucks_count = Column(Integer, default=0)
    other_count = Column(Integer, default=0)
    total_vehicles = Column(Integer, default=0)
    
    # Metrics
    traffic_density = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, SEVERE
    traffic_density_percent = Column(Float, default=45.0)  # 0 to 100%
    congestion_percent = Column(Float, default=45.0)       # 0 to 100%
    average_speed_kmh = Column(Float, default=24.0)
    baseline_speed_kmh = Column(Float, default=40.0)
    
    # Route delay analytics
    normal_travel_time_min = Column(Float, default=30.0)
    current_travel_time_min = Column(Float, default=38.5)
    estimated_delay_minutes = Column(Float, default=8.5)
    bottleneck_detected = Column(Boolean, default=False)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class OriginDestinationFlow(Base):
    __tablename__ = "od_flows"

    id = Column(Integer, primary_key=True, index=True)
    corridor_name = Column(String(100), nullable=False, index=True)  # Swargate → Katraj
    origin = Column(String(80), nullable=False)                      # Swargate
    destination = Column(String(80), nullable=False)                 # Katraj
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    
    vehicle_volume = Column(Integer, default=1420)
    average_travel_time_min = Column(Float, default=38.0)
    normal_travel_time_min = Column(Float, default=25.0)
    delay_min = Column(Float, default=13.0)
    congestion_level = Column(String(20), default="HIGH")  # LOW, MODERATE, HIGH, SEVERE
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
