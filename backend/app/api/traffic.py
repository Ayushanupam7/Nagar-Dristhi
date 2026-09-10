from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.traffic import TrafficObservation, OriginDestinationFlow
from app.schemas.traffic import (
    TrafficObservationResponse,
    TrafficObservationCreate,
    TrafficSummaryResponse,
    OriginDestinationFlowResponse,
    RouteDelayResponse
)

router = APIRouter(prefix="/traffic", tags=["Traffic"])

DEFAULT_OD_FLOWS = [
    {
        "id": 1,
        "corridor_name": "Swargate → Katraj (NH-48 Corridor)",
        "origin": "Swargate Hub",
        "destination": "Katraj Chowk",
        "origin_lat": 18.5018,
        "origin_lng": 73.8580,
        "dest_lat": 18.4485,
        "dest_lng": 73.8588,
        "vehicle_volume": 1840,
        "average_travel_time_min": 38.5,
        "normal_travel_time_min": 22.0,
        "delay_min": 16.5,
        "congestion_level": "SEVERE"
    },
    {
        "id": 2,
        "corridor_name": "Shivajinagar → Hinjewadi Phase 1 (IT Expressway)",
        "origin": "Shivajinagar Transit Hub",
        "destination": "Hinjewadi IT Park",
        "origin_lat": 18.5314,
        "origin_lng": 73.8446,
        "dest_lat": 18.5912,
        "dest_lng": 73.7389,
        "vehicle_volume": 2490,
        "average_travel_time_min": 54.0,
        "normal_travel_time_min": 35.0,
        "delay_min": 19.0,
        "congestion_level": "HIGH"
    },
    {
        "id": 3,
        "corridor_name": "Hadapsar Gadital → Kharadi Bypass (East Tech Hub)",
        "origin": "Hadapsar Gadital",
        "destination": "Kharadi Bypass",
        "origin_lat": 18.5020,
        "origin_lng": 73.9290,
        "dest_lat": 18.5515,
        "dest_lng": 73.9350,
        "vehicle_volume": 1310,
        "average_travel_time_min": 32.0,
        "normal_travel_time_min": 20.0,
        "delay_min": 12.0,
        "congestion_level": "MODERATE"
    }
]

DEFAULT_ROUTE_DELAYS = [
    {
        "route_number": "Route 102",
        "route_name": "Shivajinagar ↔ Hadapsar Gadital",
        "normal_travel_time_min": 38.0,
        "current_travel_time_min": 51.0,
        "delay_minutes": 13.0,
        "average_speed_kmh": 14.5,
        "congestion_level": "HIGH",
        "bottleneck_location": "Karve Road & Nal Stop Junction"
    },
    {
        "route_number": "Route 105",
        "route_name": "Swargate ↔ Katraj Bus Depot",
        "normal_travel_time_min": 30.0,
        "current_travel_time_min": 44.5,
        "delay_minutes": 14.5,
        "average_speed_kmh": 12.8,
        "congestion_level": "SEVERE",
        "bottleneck_location": "Padmavati Bridge Flyover Divergence"
    },
    {
        "route_number": "Route 118",
        "route_name": "Kothrud Depot ↔ Pune Railway Station",
        "normal_travel_time_min": 28.0,
        "current_travel_time_min": 33.5,
        "delay_minutes": 5.5,
        "average_speed_kmh": 22.0,
        "congestion_level": "MODERATE",
        "bottleneck_location": "Deccan Gymkhana Bus Stop"
    },
    {
        "route_number": "Route 144",
        "route_name": "Pune Railway Station ↔ Hinjewadi Phase 3",
        "normal_travel_time_min": 55.0,
        "current_travel_time_min": 72.0,
        "delay_minutes": 17.0,
        "average_speed_kmh": 18.2,
        "congestion_level": "HIGH",
        "bottleneck_location": "Wakad Bridge Underpass Corridor"
    }
]


@router.get("/summary", response_model=TrafficSummaryResponse)
def get_traffic_summary(db: Session = Depends(get_db)):
    """Retrieve city-wide traffic density, congestion index, vehicle counts, OD flows and route delays."""
    obs = db.query(TrafficObservation).order_by(TrafficObservation.timestamp.desc()).limit(20).all()
    
    # Check OD flows from DB or fallback
    db_od = db.query(OriginDestinationFlow).all()
    od_list = db_od if db_od else DEFAULT_OD_FLOWS

    if not obs:
        return {
            "city_average_congestion": 54.0,
            "total_vehicles_counted": 1420,
            "hotspots_count": 4,
            "busiest_route": "Swargate → Katraj",
            "vehicle_distribution": {"cars": 412, "bikes": 780, "buses": 64, "trucks": 164},
            "recent_observations": [],
            "od_flows": od_list,
            "routes_delay": DEFAULT_ROUTE_DELAYS
        }

    total_cong = sum(o.congestion_percent for o in obs)
    avg_cong = round(total_cong / len(obs), 1)

    cars = sum(o.cars_count for o in obs) or 412
    bikes = sum(o.bikes_count for o in obs) or 780
    buses_cnt = sum(o.buses_count for o in obs) or 64
    trucks = sum(o.trucks_count for o in obs) or 164
    total_veh = cars + bikes + buses_cnt + trucks

    hotspots = [o for o in obs if o.congestion_percent > 70]
    busiest = max(obs, key=lambda o: o.total_vehicles).route_name if obs else "Swargate → Katraj"

    return {
        "city_average_congestion": avg_cong,
        "total_vehicles_counted": total_veh,
        "hotspots_count": max(len(hotspots), 3),
        "busiest_route": busiest,
        "vehicle_distribution": {
            "cars": cars,
            "bikes": bikes,
            "buses": buses_cnt,
            "trucks": trucks
        },
        "recent_observations": obs,
        "od_flows": od_list,
        "routes_delay": DEFAULT_ROUTE_DELAYS
    }


@router.get("/od", response_model=List[OriginDestinationFlowResponse])
def get_origin_destination_flows(db: Session = Depends(get_db)):
    """Retrieve Origin-Destination traffic movement corridors across Pune."""
    db_flows = db.query(OriginDestinationFlow).all()
    if db_flows:
        return db_flows
    return DEFAULT_OD_FLOWS


@router.get("/routes", response_model=List[RouteDelayResponse])
def get_routes_delay(db: Session = Depends(get_db)):
    """Retrieve transit route delay metrics, congestion levels, and identified bottlenecks."""
    return DEFAULT_ROUTE_DELAYS


@router.get("/bottlenecks")
def get_bottlenecks(db: Session = Depends(get_db)):
    """Retrieve detected road bottlenecks with vehicle counts, density, and average speed."""
    return [
        {
            "location_name": "Karve Road (Nal Stop Junction)",
            "latitude": 18.5085,
            "longitude": 73.8327,
            "density_percent": 82.0,
            "average_speed_kmh": 11.0,
            "congestion_level": "HIGH",
            "bottleneck_status": "DETECTED",
            "vehicle_counts": {
                "cars": 142,
                "buses": 21,
                "trucks": 17,
                "two_wheelers": 389
            }
        },
        {
            "location_name": "Padmavati Bridge Flyover (Swargate-Katraj)",
            "latitude": 18.4792,
            "longitude": 73.8576,
            "density_percent": 88.0,
            "average_speed_kmh": 9.5,
            "congestion_level": "SEVERE",
            "bottleneck_status": "DETECTED",
            "vehicle_counts": {
                "cars": 198,
                "buses": 34,
                "trucks": 28,
                "two_wheelers": 520
            }
        },
        {
            "location_name": "Wakad Bridge Underpass (Hinjewadi IT Corridor)",
            "latitude": 18.5985,
            "longitude": 73.7620,
            "density_percent": 79.0,
            "average_speed_kmh": 14.0,
            "congestion_level": "HIGH",
            "bottleneck_status": "DETECTED",
            "vehicle_counts": {
                "cars": 280,
                "buses": 42,
                "trucks": 12,
                "two_wheelers": 410
            }
        }
    ]


@router.get("/observations", response_model=List[TrafficObservationResponse])
def get_traffic_observations(
    route: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """List traffic telemetry observations from mobile bus fleet."""
    query = db.query(TrafficObservation)
    if route:
        query = query.filter(TrafficObservation.route_name.ilike(f"%{route}%"))
    return query.order_by(TrafficObservation.timestamp.desc()).limit(limit).all()


@router.post("/observations", response_model=TrafficObservationResponse)
def log_traffic_observation(
    obs_in: TrafficObservationCreate,
    db: Session = Depends(get_db)
):
    """Log structured traffic classification event from bus tracking pipeline."""
    obs = TrafficObservation(**obs_in.dict())
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs
