import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import Base, engine
from app.database.seed import seed_database
from app.api.auth import router as auth_router
from app.api.buses import router as buses_router
from app.api.events import router as events_router
from app.api.issues import router as issues_router
from app.api.traffic import router as traffic_router
from app.api.incidents import router as incidents_router
from app.api.analytics import router as analytics_router
from app.api.simulation import router as simulation_router
from app.api.ws import router as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NagarDrishti")


from app.database.migrate import run_migrations


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing NAGAR DRISHTI Central Command Server...")
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        # Run migrations for any new columns
        run_migrations()
        # Seed initial demo dataset if empty
        seed_database()
        logger.info("Database schema verified, migrated, and seeded.")
    except Exception as e:
        logger.error(f"Database initialization warning (will retry on incoming requests): {e}")
    yield
    logger.info("Shutting down NAGAR DRISHTI Server.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(buses_router, prefix=settings.API_V1_PREFIX)
app.include_router(events_router, prefix=settings.API_V1_PREFIX)
app.include_router(issues_router, prefix=settings.API_V1_PREFIX)
app.include_router(traffic_router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)

# Mount Static Files for Footage Uploads
import os
from fastapi.staticfiles import StaticFiles

static_dir = os.path.join(os.path.dirname(__file__), "static")
uploads_dir = os.path.join(static_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


import time
from sqlalchemy import text
from app.database.connection import SessionLocal
from app.models import Bus, Event, Issue, Incident, TrafficObservation, User


@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "city": settings.CITY_NAME,
        "ai_mode": settings.AI_MODE,
        "database": "SUPABASE_POSTGRESQL",
        "verification_rules": {
            "distance_threshold_meters": settings.DISTANCE_THRESHOLD_METERS,
            "min_independent_buses": settings.MIN_INDEPENDENT_BUSES,
            "time_window_hours": settings.TIME_WINDOW_HOURS
        }
    }


@app.get("/api/health/supabase")
def supabase_health_check():
    start_time = time.time()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start_time) * 1000, 1)

        db = SessionLocal()
        counts = {
            "buses": db.query(Bus).count(),
            "events": db.query(Event).count(),
            "issues": db.query(Issue).count(),
            "incidents": db.query(Incident).count(),
            "traffic_observations": db.query(TrafficObservation).count(),
            "users": db.query(User).count(),
        }
        db.close()

        return {
            "status": "CONNECTED",
            "database_engine": "PostgreSQL (PostGIS 3.4)",
            "provider": "Supabase Managed Cloud",
            "region": "ap-south-1 (Mumbai)",
            "host": "aws-0-ap-south-1.pooler.supabase.com",
            "port": 5432,
            "latency_ms": latency_ms,
            "ssl": "require",
            "table_counts": counts,
            "sih_compliance": {
                "mobile_sensing_units": "5-Camera Sensor Array (Front, Rear, Curbside, Median, Cabin)",
                "ai_defect_taxonomy": [
                    "POTHOLE",
                    "DAMAGED_ROAD",
                    "MISSING_DIVIDER",
                    "MISSING_ZEBRA_CROSSING",
                    "DAMAGED_SIGNBOARD",
                    "TRAFFIC_CONGESTION",
                    "UNSAFE_DRIVING"
                ],
                "spatial_verification": "DBSCAN Multi-Bus Deduplication (50m / 48h)",
                "work_orders": "Automated Municipal PWD Assignment & SLA Tracking"
            }
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "provider": "Supabase Managed Cloud",
            "error": str(e),
            "latency_ms": round((time.time() - start_time) * 1000, 1)
        }
