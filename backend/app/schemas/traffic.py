import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel


class TrafficObservationBase(BaseModel):
    bus_id: str
    bus_registration_number: Optional[str] = None
    route_name: str
    latitude: float
    longitude: float
    location_name: Optional[str] = "Pune Road Corridor"
    cars_count: int = 0
    bikes_count: int = 0
    buses_count: int = 0
    trucks_count: int = 0
    other_count: int = 0
    total_vehicles: int = 0
    traffic_density: str = "MEDIUM"
    traffic_density_percent: float = 45.0
    congestion_percent: float = 45.0
    average_speed_kmh: float = 24.0
    baseline_speed_kmh: float = 40.0
    normal_travel_time_min: float = 30.0
    current_travel_time_min: float = 38.5
    estimated_delay_minutes: float = 8.5
    bottleneck_detected: bool = False


class TrafficObservationCreate(TrafficObservationBase):
    pass


class TrafficObservationResponse(TrafficObservationBase):
    id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class OriginDestinationFlowResponse(BaseModel):
    id: int
    corridor_name: str
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_volume: int
    average_travel_time_min: float
    normal_travel_time_min: float
    delay_min: float
    congestion_level: str

    class Config:
        from_attributes = True


class RouteDelayResponse(BaseModel):
    route_number: str
    route_name: str
    normal_travel_time_min: float
    current_travel_time_min: float
    delay_minutes: float
    average_speed_kmh: float
    congestion_level: str
    bottleneck_location: Optional[str] = None


class TrafficSummaryResponse(BaseModel):
    city_average_congestion: float
    total_vehicles_counted: int
    hotspots_count: int
    busiest_route: str
    vehicle_distribution: Dict[str, int]
    recent_observations: List[TrafficObservationResponse]
    od_flows: Optional[List[OriginDestinationFlowResponse]] = []
    routes_delay: Optional[List[RouteDelayResponse]] = []


class TrafficHeatPoint(BaseModel):
    id: str
    latitude: float
    longitude: float
    corridor_name: str
    location_name: str
    intensity: float  # 0.0 to 1.0 (normalized for heatmap gradient)
    congestion_percent: float
    congestion_level: str  # SEVERE, HIGH, MODERATE, LOW
    average_speed_kmh: float
    vehicle_count: int
    bottleneck_detected: bool
    bottleneck_description: Optional[str] = None
    radius_meters: int = 300


class TrafficHeatmapResponse(BaseModel):
    city: str
    average_congestion: float
    peak_corridor: str
    total_heat_points: int
    timestamp: datetime.datetime
    heat_points: List[TrafficHeatPoint]

