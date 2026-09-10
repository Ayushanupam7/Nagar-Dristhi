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
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Run migrations for any new columns
    run_migrations()
    # Seed initial demo dataset if empty
    seed_database()
    logger.info("Database schema verified, migrated, and seeded.")
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


@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "city": settings.CITY_NAME,
        "ai_mode": settings.AI_MODE,
        "verification_rules": {
            "distance_threshold_meters": settings.DISTANCE_THRESHOLD_METERS,
            "min_independent_buses": settings.MIN_INDEPENDENT_BUSES,
            "time_window_hours": settings.TIME_WINDOW_HOURS
        }
    }
