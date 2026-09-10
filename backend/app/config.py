import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "NAGAR DRISHTI"
    TAGLINE: str = "Turning Public Buses into Mobile AI Sensors"
    API_V1_PREFIX: str = "/api"
    
    # Environment & Database
    # Default to SQLite for zero-setup local dev; switches seamlessly to PostgreSQL/PostGIS in Docker
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nagar_drishti.db")
    
    # Security / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih26124-nagar-drishti-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for hackathon ease
    
    # Supabase Integration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # Multi-Bus Verification Config
    DISTANCE_THRESHOLD_METERS: float = 50.0  # observations within 50m merged
    TIME_WINDOW_HOURS: float = 48.0          # match within 48-hour active window
    MIN_INDEPENDENT_BUSES: int = 2           # minimum distinct bus IDs for VERIFIED
    
    # Priority Score Weightings (sum to 100)
    WEIGHT_CONFIDENCE: float = 25.0
    WEIGHT_SEVERITY: float = 25.0
    WEIGHT_TRAFFIC: float = 20.0
    WEIGHT_SAFETY: float = 15.0
    WEIGHT_CONFIRMATIONS: float = 15.0
    
    # AI Engine
    AI_MODE: str = os.getenv("AI_MODE", "SIMULATION")  # "SIMULATION" or "YOLO"
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "models/road_defect.pt")
    
    # City Context
    CITY_NAME: str = "Pune Metropolitan Region"
    DEFAULT_LAT: float = 18.5204
    DEFAULT_LNG: float = 73.8567

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()
