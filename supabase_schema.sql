-- ==============================================================================
-- NAGAR DRISHTI: AI-Powered Mobile Urban Sensing Platform
-- SIH 26124 - Complete Supabase PostgreSQL + PostGIS Schema
-- Project Reference: jwujsbienesyshaeiceg (Mumbai, ap-south-1)
-- ==============================================================================

-- 1. Enable Required Cloud Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- Table 1: USERS (Municipal Administrators, PWD Authorities, Fleet Operators)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'OPERATOR',
    department VARCHAR(100) NOT NULL DEFAULT 'PMPML Operations',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- Table 2: BUSES (Mobile Urban Sensing Units equipped with 5-Camera Arrays)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buses (
    id SERIAL PRIMARY KEY,
    bus_id VARCHAR(30) UNIQUE NOT NULL,
    reg_number VARCHAR(30) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    depot VARCHAR(50) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    speed_kmh FLOAT NOT NULL DEFAULT 0.0,
    heading_deg FLOAT NOT NULL DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    camera_health JSONB,
    sensors_active JSONB,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buses_bus_id ON buses(bus_id);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);

-- ------------------------------------------------------------------------------
-- Table 3: EVENTS (Raw Edge AI Detections from Bus Cameras)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(36) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    bus_id VARCHAR(30) NOT NULL,
    bus_registration_number VARCHAR(30),
    camera_id VARCHAR(30) DEFAULT 'FRONT_CAMERA',
    camera_position VARCHAR(30) DEFAULT 'FRONT',
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    severity INTEGER NOT NULL,
    speed_kmh FLOAT NOT NULL DEFAULT 0.0,
    heading_deg FLOAT NOT NULL DEFAULT 0.0,
    evidence_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    issue_id INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_bus_id ON events(bus_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_is_verified ON events(is_verified);

-- ------------------------------------------------------------------------------
-- Table 4: ISSUES (Consolidated, Multi-Bus Spatially Verified Road Defects)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    issue_code VARCHAR(30) UNIQUE NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    address VARCHAR(255),
    ward VARCHAR(50) DEFAULT 'Pune Central',
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    priority_score FLOAT NOT NULL DEFAULT 50.0,
    average_severity FLOAT NOT NULL,
    detection_count INTEGER NOT NULL DEFAULT 1,
    unique_bus_count INTEGER NOT NULL DEFAULT 1,
    first_bus VARCHAR(30) NOT NULL,
    confirming_buses JSONB,
    evidence_urls JSONB,
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_to VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_issues_issue_code ON issues(issue_code);
CREATE INDEX IF NOT EXISTS idx_issues_issue_type ON issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority_score DESC);

-- ------------------------------------------------------------------------------
-- Table 5: EVENT_CONFIRMATIONS (Multi-Bus Correlation Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_confirmations (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    bus_id VARCHAR(30) NOT NULL,
    bus_registration_number VARCHAR(30),
    camera_id VARCHAR(30) DEFAULT 'FRONT_CAMERA',
    distance_meters FLOAT NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_confirmations_issue_id ON event_confirmations(issue_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_bus_id ON event_confirmations(bus_id);

-- ------------------------------------------------------------------------------
-- Table 6: ISSUE_STATUS_HISTORY (Municipal Work-Order Lifecycle & SLA Audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issue_status_history (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    changed_by VARCHAR(50) NOT NULL DEFAULT 'Edge Multi-Bus Engine',
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_issue_id ON issue_status_history(issue_id);

-- ------------------------------------------------------------------------------
-- Table 7: TRAFFIC_OBSERVATIONS (Corridor Congestion & Speed Telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS traffic_observations (
    id SERIAL PRIMARY KEY,
    bus_id VARCHAR(30) NOT NULL,
    bus_registration_number VARCHAR(30),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    location_name VARCHAR(150) DEFAULT 'Pune Road Corridor',
    vehicle_count INTEGER NOT NULL DEFAULT 0,
    two_wheeler_count INTEGER NOT NULL DEFAULT 0,
    car_count INTEGER NOT NULL DEFAULT 0,
    bus_truck_count INTEGER NOT NULL DEFAULT 0,
    other_count INTEGER NOT NULL DEFAULT 0,
    average_speed_kmh FLOAT NOT NULL DEFAULT 30.0,
    congestion_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    traffic_density_percent FLOAT DEFAULT 45.0,
    normal_travel_time_min FLOAT DEFAULT 30.0,
    current_travel_time_min FLOAT DEFAULT 38.5,
    bottleneck_detected BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traffic_congestion ON traffic_observations(congestion_level);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_observations(timestamp);

-- ------------------------------------------------------------------------------
-- Table 8: INCIDENTS (Safety & Traffic Violations: Rash Driving, Hit & Run, ANPR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    incident_code VARCHAR(30) UNIQUE,
    incident_type VARCHAR(50) NOT NULL,
    bus_id VARCHAR(30) NOT NULL,
    bus_registration_number VARCHAR(30),
    camera_id VARCHAR(30) DEFAULT 'FRONT_CAMERA',
    vehicle_class VARCHAR(30),
    registration_number VARCHAR(30),
    license_plate VARCHAR(30),
    plate_confidence FLOAT,
    ocr_confidence FLOAT,
    detection_confidence FLOAT DEFAULT 0.91,
    tracking_duration FLOAT DEFAULT 12.4,
    pedestrian_scenario VARCHAR(50),
    pedestrian_count INTEGER DEFAULT 0,
    vehicle_proximity_m FLOAT DEFAULT 18.0,
    vehicle_speed_kmh FLOAT DEFAULT 42.0,
    risk_score INTEGER DEFAULT 89,
    risk_level VARCHAR(20) DEFAULT 'HIGH',
    description VARCHAR(255),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    location_name VARCHAR(150) DEFAULT 'Pune Municipal Ward',
    evidence_url TEXT,
    is_demo_mode BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'LOGGED',
    alert_status VARCHAR(30) DEFAULT 'ALERT_GENERATED',
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_plate ON incidents(registration_number);
CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp);

-- ------------------------------------------------------------------------------
-- Table 9: ORIGIN_DESTINATION_FLOWS (Transit OD Commuter Analytics)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS origin_destination_flows (
    id SERIAL PRIMARY KEY,
    origin_zone VARCHAR(100) NOT NULL,
    destination_zone VARCHAR(100) NOT NULL,
    transit_mode VARCHAR(50) DEFAULT 'BUS_RAPID_TRANSIT',
    passenger_volume INTEGER DEFAULT 450,
    avg_travel_time_min FLOAT DEFAULT 28.5,
    congestion_delay_min FLOAT DEFAULT 6.2,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Schema Initialization Completed.
-- ==============================================================================
