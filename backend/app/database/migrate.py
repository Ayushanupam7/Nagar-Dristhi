"""
Nagar Drishti - Database Schema Migrator
Ensures new columns for SIH 26124 requirements exist on PostgreSQL/Supabase and SQLite.
"""
from sqlalchemy import text
from app.database.connection import engine, Base
from app.models import (
    User, Bus, Event, EventConfirmation, Issue, IssueStatusHistory,
    TrafficObservation, OriginDestinationFlow, Incident
)

COLUMNS_TO_ADD = [
    # Table: events
    ("events", "bus_registration_number", "VARCHAR(30)"),
    ("events", "camera_id", "VARCHAR(30) DEFAULT 'FRONT_CAMERA'"),
    ("events", "camera_position", "VARCHAR(30) DEFAULT 'FRONT'"),

    # Table: event_confirmations
    ("event_confirmations", "bus_registration_number", "VARCHAR(30)"),
    ("event_confirmations", "camera_id", "VARCHAR(30) DEFAULT 'FRONT_CAMERA'"),

    # Table: incidents
    ("incidents", "incident_code", "VARCHAR(30)"),
    ("incidents", "bus_registration_number", "VARCHAR(30)"),
    ("incidents", "camera_id", "VARCHAR(30) DEFAULT 'FRONT_CAMERA'"),
    ("incidents", "vehicle_class", "VARCHAR(30)"),
    ("incidents", "registration_number", "VARCHAR(30)"),
    ("incidents", "plate_confidence", "FLOAT"),
    ("incidents", "detection_confidence", "FLOAT DEFAULT 0.91"),
    ("incidents", "tracking_duration", "FLOAT DEFAULT 12.4"),
    ("incidents", "pedestrian_scenario", "VARCHAR(50)"),
    ("incidents", "vehicle_proximity_m", "FLOAT DEFAULT 18.0"),
    ("incidents", "vehicle_speed_kmh", "FLOAT DEFAULT 42.0"),
    ("incidents", "risk_score", "INTEGER DEFAULT 89"),
    ("incidents", "location_name", "VARCHAR(150) DEFAULT 'Pune Municipal Ward'"),
    ("incidents", "alert_status", "VARCHAR(30) DEFAULT 'ALERT_GENERATED'"),
    ("incidents", "alert_sent_at", "TIMESTAMP"),

    # Table: traffic_observations
    ("traffic_observations", "bus_registration_number", "VARCHAR(30)"),
    ("traffic_observations", "location_name", "VARCHAR(150) DEFAULT 'Pune Road Corridor'"),
    ("traffic_observations", "other_count", "INTEGER DEFAULT 0"),
    ("traffic_observations", "traffic_density_percent", "FLOAT DEFAULT 45.0"),
    ("traffic_observations", "normal_travel_time_min", "FLOAT DEFAULT 30.0"),
    ("traffic_observations", "current_travel_time_min", "FLOAT DEFAULT 38.5"),
    ("traffic_observations", "bottleneck_detected", "BOOLEAN DEFAULT FALSE"),
]


def run_migrations():
    """Apply schema extensions and create any missing tables."""
    print("Running Nagar Drishti schema migrations...")
    # 1. Create tables if they do not exist (e.g. od_flows)
    Base.metadata.create_all(bind=engine)

    # 2. Alter existing tables if running PostgreSQL
    is_postgres = "postgresql" in str(engine.url)

    with engine.begin() as conn:
        for table, column, col_type in COLUMNS_TO_ADD:
            try:
                if is_postgres:
                    sql = f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type};"
                else:
                    # SQLite ADD COLUMN
                    sql = f"ALTER TABLE {table} ADD COLUMN {column} {col_type};"
                conn.execute(text(sql))
            except Exception as e:
                # Column might already exist or SQLite syntax limitation
                pass

        # Also backfill bus_registration_number on events and incidents
        try:
            if is_postgres:
                conn.execute(text("""
                    UPDATE events e
                    SET bus_registration_number = b.reg_number
                    FROM buses b
                    WHERE e.bus_id = b.bus_id AND (e.bus_registration_number IS NULL OR e.bus_registration_number = '');
                """))
                conn.execute(text("""
                    UPDATE incidents i
                    SET bus_registration_number = b.reg_number
                    FROM buses b
                    WHERE i.bus_id = b.bus_id AND (i.bus_registration_number IS NULL OR i.bus_registration_number = '');
                """))
        except Exception:
            pass

    print("Schema migrations complete!")


if __name__ == "__main__":
    run_migrations()
