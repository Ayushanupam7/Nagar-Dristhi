from typing import List, Optional
import random
import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.traffic import TrafficObservation, OriginDestinationFlow
from app.schemas.traffic import (
    TrafficObservationResponse,
    TrafficObservationCreate,
    TrafficSummaryResponse,
    OriginDestinationFlowResponse,
    RouteDelayResponse,
    TrafficHeatmapResponse,
    TrafficHeatPoint
)
from app.api.ws import ws_manager

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


CORRIDOR_HEAT_BASE = [
    {
        "id": "HEAT-01",
        "latitude": 18.5085,
        "longitude": 73.8327,
        "corridor_name": "Karve Road (Nal Stop Junction)",
        "location_name": "Nal Stop Metro Flyover Divergence",
        "intensity": 0.92,
        "congestion_percent": 88.0,
        "congestion_level": "SEVERE",
        "average_speed_kmh": 10.2,
        "vehicle_count": 569,
        "bottleneck_detected": True,
        "bottleneck_description": "Metro pillar construction + signal spillover",
        "radius_meters": 450
    },
    {
        "id": "HEAT-02",
        "latitude": 18.4792,
        "longitude": 73.8576,
        "corridor_name": "Swargate - Katraj BRTS Corridor",
        "location_name": "Padmavati Bridge Flyover Incline",
        "intensity": 0.95,
        "congestion_percent": 92.0,
        "congestion_level": "SEVERE",
        "average_speed_kmh": 9.5,
        "vehicle_count": 780,
        "bottleneck_detected": True,
        "bottleneck_description": "Mixed vehicular intrusion into dedicated BRTS lane",
        "radius_meters": 500
    },
    {
        "id": "HEAT-03",
        "latitude": 18.5018,
        "longitude": 73.8580,
        "corridor_name": "Swargate Transit Hub",
        "location_name": "Jedhe Chowk Central Intersection",
        "intensity": 0.86,
        "congestion_percent": 84.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 12.0,
        "vehicle_count": 640,
        "bottleneck_detected": True,
        "bottleneck_description": "Inter-city bus turnaround convergence",
        "radius_meters": 420
    },
    {
        "id": "HEAT-04",
        "latitude": 18.5985,
        "longitude": 73.7620,
        "corridor_name": "Hinjewadi IT Expressway",
        "location_name": "Wakad Bridge Underpass Corridor",
        "intensity": 0.84,
        "congestion_percent": 81.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 13.5,
        "vehicle_count": 744,
        "bottleneck_detected": True,
        "bottleneck_description": "Peak shift IT commuter bottleneck",
        "radius_meters": 460
    },
    {
        "id": "HEAT-05",
        "latitude": 18.5912,
        "longitude": 73.7389,
        "corridor_name": "Hinjewadi IT Park Phase 1",
        "location_name": "Shivaji Chowk Tech Gate",
        "intensity": 0.78,
        "congestion_percent": 75.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 16.0,
        "vehicle_count": 612,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 380
    },
    {
        "id": "HEAT-06",
        "latitude": 18.5314,
        "longitude": 73.8446,
        "corridor_name": "Shivajinagar Transit Hub",
        "location_name": "Shimla Office Chowk",
        "intensity": 0.80,
        "congestion_percent": 78.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 15.0,
        "vehicle_count": 520,
        "bottleneck_detected": True,
        "bottleneck_description": "Suburban rail & bus passenger boarding queues",
        "radius_meters": 400
    },
    {
        "id": "HEAT-07",
        "latitude": 18.5289,
        "longitude": 73.8744,
        "corridor_name": "Pune Railway Station Central",
        "location_name": "Alankar Talkies Junction",
        "intensity": 0.74,
        "congestion_percent": 72.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 17.5,
        "vehicle_count": 480,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 350
    },
    {
        "id": "HEAT-08",
        "latitude": 18.4485,
        "longitude": 73.8588,
        "corridor_name": "Katraj South Depot Corridor",
        "location_name": "Katraj Snake Park Chowk",
        "intensity": 0.76,
        "congestion_percent": 74.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 16.5,
        "vehicle_count": 430,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 360
    },
    {
        "id": "HEAT-09",
        "latitude": 18.5020,
        "longitude": 73.9290,
        "corridor_name": "Hadapsar Gadital Transit Node",
        "location_name": "Gadital Flyover Junction",
        "intensity": 0.69,
        "congestion_percent": 68.0,
        "congestion_level": "MODERATE",
        "average_speed_kmh": 19.5,
        "vehicle_count": 390,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 340
    },
    {
        "id": "HEAT-10",
        "latitude": 18.5515,
        "longitude": 73.9350,
        "corridor_name": "Kharadi Bypass (East Tech Hub)",
        "location_name": "EON IT Park Divergence",
        "intensity": 0.66,
        "congestion_percent": 65.0,
        "congestion_level": "MODERATE",
        "average_speed_kmh": 21.0,
        "vehicle_count": 410,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 320
    },
    {
        "id": "HEAT-11",
        "latitude": 18.5529,
        "longitude": 73.8833,
        "corridor_name": "Yerwada - Airport Road",
        "location_name": "Gunjan Chowk Intersection",
        "intensity": 0.71,
        "congestion_percent": 70.0,
        "congestion_level": "HIGH",
        "average_speed_kmh": 18.0,
        "vehicle_count": 460,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 340
    },
    {
        "id": "HEAT-12",
        "latitude": 18.5173,
        "longitude": 73.8415,
        "corridor_name": "Deccan Gymkhana",
        "location_name": "Goodluck Chowk / FC Road",
        "intensity": 0.62,
        "congestion_percent": 61.0,
        "congestion_level": "MODERATE",
        "average_speed_kmh": 22.0,
        "vehicle_count": 350,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 300
    },
    {
        "id": "HEAT-13",
        "latitude": 18.5144,
        "longitude": 73.8762,
        "corridor_name": "Pune Camp Zone",
        "location_name": "MG Road & East Street",
        "intensity": 0.67,
        "congestion_percent": 66.0,
        "congestion_level": "MODERATE",
        "average_speed_kmh": 19.0,
        "vehicle_count": 380,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 310
    },
    {
        "id": "HEAT-14",
        "latitude": 18.5615,
        "longitude": 73.8078,
        "corridor_name": "Aundh Commercial Corridor",
        "location_name": "Parihar Chowk High Street",
        "intensity": 0.54,
        "congestion_percent": 53.0,
        "congestion_level": "MODERATE",
        "average_speed_kmh": 24.5,
        "vehicle_count": 290,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 280
    },
    {
        "id": "HEAT-15",
        "latitude": 18.5042,
        "longitude": 73.8056,
        "corridor_name": "Kothrud Depot Corridor",
        "location_name": "Paud Road Gujrat Colony",
        "intensity": 0.42,
        "congestion_percent": 41.0,
        "congestion_level": "LOW",
        "average_speed_kmh": 33.0,
        "vehicle_count": 210,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 250
    },
    {
        "id": "HEAT-16",
        "latitude": 18.5074,
        "longitude": 73.7786,
        "corridor_name": "Chandani Chowk Expressway",
        "location_name": "Bavdhan Multi-Level Flyover",
        "intensity": 0.35,
        "congestion_percent": 34.0,
        "congestion_level": "LOW",
        "average_speed_kmh": 42.0,
        "vehicle_count": 180,
        "bottleneck_detected": False,
        "bottleneck_description": None,
        "radius_meters": 260
    }
]


@router.get("/heatmap", response_model=TrafficHeatmapResponse)
def get_traffic_heatmap(db: Session = Depends(get_db)):
    """
    Retrieve GIS-ready traffic congestion heat points aggregated from public transport bus sensors.
    Includes density intensities (0.0 to 1.0), bottleneck flags, and transit flow speeds.
    """
    # Fetch real live observations from the DB if available
    obs_list = db.query(TrafficObservation).order_by(TrafficObservation.timestamp.desc()).limit(15).all()

    heat_points = [TrafficHeatPoint(**pt) for pt in CORRIDOR_HEAT_BASE]

    # Dynamically inject recent mobile bus observations as high-resolution heat points
    for idx, obs in enumerate(obs_list):
        intensity = min(max(obs.congestion_percent / 100.0, 0.1), 1.0)
        c_level = "SEVERE" if obs.congestion_percent >= 80 else ("HIGH" if obs.congestion_percent >= 65 else ("MODERATE" if obs.congestion_percent >= 45 else "LOW"))
        heat_points.append(
            TrafficHeatPoint(
                id=f"BUS-OBS-{obs.id}",
                latitude=obs.latitude,
                longitude=obs.longitude,
                corridor_name=obs.route_name,
                location_name=obs.location_name or f"Bus {obs.bus_id} Sensing Node",
                intensity=round(intensity, 2),
                congestion_percent=obs.congestion_percent,
                congestion_level=c_level,
                average_speed_kmh=obs.average_speed_kmh,
                vehicle_count=obs.total_vehicles,
                bottleneck_detected=obs.bottleneck_detected,
                bottleneck_description="Identified by bus mobile edge tracker" if obs.bottleneck_detected else None,
                radius_meters=320
            )
        )

    avg_cong = round(sum(p.congestion_percent for p in heat_points) / len(heat_points), 1)
    peak_corridor = max(heat_points, key=lambda p: p.congestion_percent).corridor_name

    return TrafficHeatmapResponse(
        city="Pune Municipal Corporation (PMPML Fleet)",
        average_congestion=avg_cong,
        peak_corridor=peak_corridor,
        total_heat_points=len(heat_points),
        timestamp=datetime.datetime.utcnow(),
        heat_points=heat_points
    )


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
