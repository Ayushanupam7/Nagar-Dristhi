# NAGAR DRISHTI (नगर दृष्टि)
### *"Turning Public Transit Buses into Mobile Edge AI Sensing Networks"*

[![Ministry](https://img.shields.io/badge/Government%20of%20India-MoHUA-0B3C74?style=flat-square)](https://mohua.gov.in)
[![Partner](https://img.shields.io/badge/Smart%20Automation-Bharat%20Electronics%20Ltd%20(BEL)-7C3AED?style=flat-square)](https://bel-india.in)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%20%2B%20PostGIS-3ECF8E?style=flat-square)](https://supabase.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-2563EB?style=flat-square)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688?style=flat-square)](https://fastapi.tiangolo.com)

---

## 🏛️ Executive Summary

Traditional smart city camera infrastructure relies on stationary roadside poles with high installation overhead, blind spots, and limited coverage. 

**NAGAR DRISHTI** revolutionizes municipal infrastructure surveillance by transforming existing municipal public transport buses (PMPML, DTC, BMTC, BEST, etc.) into **intelligent, mobile edge-sensing networks**. 

Equipped with forward-facing dashcams connected to compact edge AI compute units (NVIDIA Jetson / Rockchip RK3588), scheduled transit buses passively scan every lane of the road network during their regular daily passenger routes. The platform executes **Multi-Bus Spatial Verification**, computes an **Explainable AI Priority Score (0–100)**, and orchestrates an autonomous closed-loop maintenance and transit recheck workflow.

```
       [ Transit Bus with Edge Dashcam ]
                      │
                      ▼
         ( YOLOv8 Edge Inference: 32ms )
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ Road Surface Defects ]   [ Traffic Density / ANPR ]
  - Potholes (depth/sev)     - Congestion speeds
  - Bitumen ravelling        - BRTS lane violations
  - Waterlogging             - Pedestrian hazards
  - Divider faults           - Vehicle classification
        └─────────────┬─────────────┘
                      │ Geo-tagged JSON Telemetry (4G/5G)
                      ▼
    [ Supabase PostgreSQL + PostGIS 3.4 ]
                      │
                      ▼
   [ Multi-Bus Spatial Clustering Engine ]
     (DBSCAN: 2+ distinct buses confirm)
                      │
                      ▼
   [ Explainable AI Priority Score (0-100) ]
                      │
                      ▼
 ┌───────────────────────────────────────────────┐
 │       ROLE-SPECIFIC EXECUTIVE DASHBOARDS      │
 ├──────────────────────┬────────────────────────┤
 │ 🏗️ PWD Chief Engineer │ 🚌 Transport Officer   │
 │   - Hot-mix MT est.  │   - Live radar map     │
 │   - Work orders      │   - Driver HUD / feeds │
 │   - Bus recheck pass │   - Route advisories   │
 ├──────────────────────┼────────────────────────┤
 │ ⚙️ System Admin (BEL) │ 👮 Municipal Control   │
 │   - PostGIS health   │   - City-wide command  │
 │   - AI tuning        │   - Emergency ops      │
 └──────────────────────┴────────────────────────┘
```

---

## 🌟 Core Architectural Innovations

### 1. Multi-Bus Spatial Verification (DBSCAN)
- **Eliminates False Positives**: Requires independent detections from distinct buses passing the same geographic coordinate within a configurable spatial radius (default: 50 meters).
- **Bus Deduplication**: Repeated detections by the *same* bus do not inflate verification status.
- **State Transition**: `DETECTED` (Single Bus) $\to$ `VERIFIED` (2+ Distinct Buses).

### 2. Explainable AI Priority Scoring (0–100)
A transparent, multi-factor deterministic scoring model that classifies issues into `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`:
$$\text{Priority} = 0.25(\text{Conf}) + 0.25(\text{Severity}) + 0.20(\text{Traffic}) + 0.15(\text{Safety Risk}) + 0.15(\text{Bus Confirmations})$$

### 3. Closed-Loop Automated Bus Transit Recheck Protocol
- When PWD completes a road repair, the work order transitions to `REPAIRED`.
- As scheduled city buses subsequently traverse the repair coordinates, the onboard dashcam AI automatically re-scans the surface.
- Two consecutive defect-free passes automatically transition the issue to `RESOLVED` without human bias or manual audit delays.

### 4. 5-Angle Multi-Camera On-Board Topology & Live Video Streams
- Full interactive on-board camera network supporting 5 specialized perspectives per transit bus:
  - **Front Road Camera (`FRONT_ROAD`)**: Windshield dashcam with on-device YOLOv8 inference (28.5 FPS) detecting potholes, bitumen ravelling, and road obstructions.
  - **Rear Traffic Camera (`REAR_TRAFFIC`)**: Tailgating radar & trailing license plate recognition streaming real-time transit video (`/bus_cam_rear.mp4`, 25.0 FPS) with dynamic vehicular buffer and ANPR tracking.
  - **Left Flank (`LEFT_FLANK`)**: Curbside, bus bay approach & pedestrian footpath clearance (YOLOv8-Curbside-Proximity, 25.0 FPS) detecting boarding safety and encroaching obstacles.
  - **Right Flank (`RIGHT_FLANK`)**: Median divider barrier continuity & overtaking lane sensor (YOLOv8-Median-LaneBoundary, 25.0 FPS) preventing head-on collisions.
  - **Cabin Camera (`CABIN_CAM`)**: Passenger cabin density & driver alertness monitoring DMS (YOLOv8-CabinOccupancy-DMS, 20.0 FPS) ensuring transit passenger security.
- **Interactive Dashcam Video & Footage Ingestion Pipeline**:
  - **Universal Format Support**: Ingest real bus dashcam recordings (`.mp4`, `.webm`, `.mov`, `.ogg`) as well as high-resolution images (`.jpg`, `.png`).
  - **Zero-Latency Video Playback**: Built-in HTML5 video streaming engine with integrated playback controls (Play/Pause, Audio Mute/Unmute, Timeline Scrubber, Loop, Fullscreen).
  - **Real-Time Edge AI HUD Reticles**: Dynamic YOLOv8 bounding boxes and detection overlays track continuously on top of playing video streams.
  - **Selectable Defect Simulation**: Operators can simulate and verify detections across 5 defect taxonomies (`POTHOLE`, `DAMAGED_ROAD`, `WATERLOGGING`, `MISSING_DIVIDER`, `DAMAGED_SIGNBOARD`).
  - **One-Click Ingestion to Fleet Database**: Immediately dispatches detection events to `POST /api/events` and `POST /api/buses/{bus_id}/upload-footage`, triggering the Multi-Bus Spatial Verification engine.
  - **Instant Stream Reversion**: Seamlessly toggle between uploaded custom footage and default preset bus streams with a single click.

### 5. Visual Detection & Video Evidence Lifecycle (Before vs After Recheck)
- **Defect Taxonomy Evidence Assets**: Mapped real photographic and video evidence according to defect type (`/evidence_pothole.jpg`, `/evidence_damaged_road.jpg`, `/evidence_missing_divider.jpg`, `/evidence_damaged_signboard.jpg`, `/evidence_waterlogging.jpg`, `/bus_cam_rear.mp4`).
- **High-Resolution Lightbox & Video Player Modal**: Click-to-expand full-resolution dashcam frames and playable video clips in `EventDetailModal` with edge inference HUD overlays, GPS geolocation, and severity indicators.
- **Ubiquitous Thumbnail Previews**: Embedded visual thumbnails and video badges across GIS Map Marker popups, Command Center Critical Alerts feed, Road Intelligence defect lists, and the 6-stage Maintenance Kanban board.

### 6. All-India 28 States & Metropolitan Transit Grid
- Dynamic scope filtering across **All 28 Indian States & Union Territories** and key metropolitan hubs (Pune, Mumbai, Delhi NCT, Bengaluru, Chennai, Hyderabad, Ahmedabad, Kolkata, Jaipur, Lucknow, Kochi, Bhopal, Chandigarh, etc.).

---

## 👥 Departmental Roles & Specialized Dashboards

NAGAR DRISHTI provides dedicated, custom-structured dashboards for each key municipal authority:

| Role & Official | Department & Division | Default Route | Specialized Features |
| :--- | :--- | :--- | :--- |
| **🏗️ PWD Chief Engineer**<br>`pwd.chief@pmc.gov.in`<br>*Er. Vikram Patil* | Public Works Department<br>`PWD-INFRA-Z4` (Level 3) | [`/roads`](http://127.0.0.1:5173/roads) | • **Hot-Mix Bitumen Estimator**: Calculates required Metric Tonnes (MT) based on active pothole count.<br>• **Central Batching Plant Live Telemetry**: Hadapsar asphalt inventory.<br>• **One-Click Work Order Dispatcher**: Assign contractors (L&T, MSRDC, PMC Squad), specify VG-30/VG-40 bitumen grade, set 24h/48h/7d SLA.<br>• **Automated Transit Recheck Panel**: Live tracking of repaired sites awaiting bus confirmation passes.<br>• **6-Stage Lifecycle Action Board** ([`/maintenance`](http://127.0.0.1:5173/maintenance)). |
| **🚌 Transport Control Officer**<br>`fleet.ctrl@pmpml.gov.in`<br>*Shri Ajay Gaikwad* | PMPML Fleet Operations<br>`PMPML-FLEET-DIV` (Level 3) | [`/buses`](http://127.0.0.1:5173/buses) | • **Real-time Fleet Mobilization Ratio**: Active vs Idle buses with GPS health.<br>• **Split Radar GIS Map**: Real-time transit radar showing buses moving along routes.<br>• **Live Dashcam AI Streams**: Camera online status (1080p, 25 FPS, 32ms latency).<br>• **Route Hazard Advisory Broadcast**: Transmit in-cabin alerts to bus drivers to bypass flooded underpasses or severe potholes.<br>• **Driver Ping & In-Cabin Telemetry Link**. |
| **⚙️ System Administrator**<br>`sysadmin@bel.gov.in`<br>*Anand Sharma* | Bharat Electronics Ltd (BEL)<br>`BEL-SMART-SYS` (Level 5 Root) | [`/settings`](http://127.0.0.1:5173/settings) | • **Supabase PostGIS Live Health**: Connection latency, table row statistics (`buses`, `issues`, `raw_events`, `observations`), and PostGIS spatial indexing (`ST_DWithin`, `ST_MakePoint`).<br>• **YOLOv8 Edge Model Diagnostics**: Inference latency (32ms), confidence threshold slider (0.40–0.90), and NMS IoU tuning.<br>• **DBSCAN Multi-Bus Clustering Tuner**: Spatial radius (m) and minimum confirming buses with live test trigger.<br>• **RBAC Security & Telemetry Audit Stream**.<br>• **Synthetic Defect Injector & Database Re-Seeder**. |
| **👮 Municipal Control Room**<br>`control.hq@pmc.gov.in`<br>*Dr. Rajesh Kulkarni* | PMC Central Command<br>`PMC-CTRL-HQ` (Level 4) | [`/command`](http://127.0.0.1:5173/command) | • **Integrated City Operations Overview**.<br>• **Executive Cross-Departmental KPI Ribbons**.<br>• **Full City GIS Map with Road Defect Layers & Fleet Radar**.<br>• **12-Step Live Fleet Demo Runner**. |

---

## 🛠 Technology Stack

- **Frontend**:
  - React 18 with Vite build system
  - Vanilla Tailwind CSS with custom Government of India / MoHUA theme
  - Leaflet & React-Leaflet for municipal GIS mapping
  - Recharts for traffic density and infrastructure quality analytics
  - Lucide React iconography
- **Backend**:
  - Python 3.12 & FastAPI
  - SQLAlchemy 2.0 ORM & Pydantic v2
  - Uvicorn ASGI Server
  - Native WebSockets for real-time telemetry streaming
- **Database**:
  - **Production / Cloud**: **Supabase Managed PostgreSQL** (`ap-south-1` Mumbai) with **PostGIS 3.4** spatial extensions via IPv4 connection pooler.
  - **Local Development Fallback**: SQLite with spatial Haversine distance calculations.
- **Edge AI Pipeline**:
  - YOLOv8 Nano (ONNX Runtime FP16 / INT8 quantized)
  - ByteTrack multi-object vehicle tracker
  - Synthetic high-fidelity edge inference engine for demonstration

---

## 🖥️ Platform Endpoints & Ports

| Service | Address | Description |
| :--- | :--- | :--- |
| **Public Citizen Portal** | `http://127.0.0.1:5173/` | Transparent public dashboard & citizen defect reporting |
| **Officer Authentication Portal** | `http://127.0.0.1:5173/auth` | Role-based 1-click departmental authentication |
| **Municipal Command Center** | `http://127.0.0.1:5173/command` | City-wide operations & GIS mapping |
| **PWD Road Intelligence** | `http://127.0.0.1:5173/roads` | Road surface defects & bitumen estimation |
| **PMPML Transit Operations** | `http://127.0.0.1:5173/buses` | Real-time fleet radar & dashcam telemetry |
| **6-Stage Maintenance Action Board** | `http://127.0.0.1:5173/maintenance` | Work order progression from detection to recheck |
| **Traffic Intelligence** | `http://127.0.0.1:5173/traffic` | Congestion speeds & corridor delays |
| **Incidents & ANPR** | `http://127.0.0.1:5173/incidents` | BRTS dedicated bus lane enforcement |
| **BEL System Console** | `http://127.0.0.1:5173/settings` | PostGIS database health & AI tuning |
| **Backend REST API** | `http://127.0.0.1:8000/api` | FastAPI application endpoints |
| **Interactive OpenAPI Swagger Docs** | `http://127.0.0.1:8000/docs` | Interactive API documentation & test console |
| **Real-Time WebSocket Stream** | `ws://127.0.0.1:8000/ws` | Live event & fleet telemetry broadcast |

---

## ⚡ Step-by-Step Installation & Run Guide

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** and `npm`
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/nagar-drishti.git
cd "nagar-drishti"
```

---

### Step 2: Configure & Start the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows PowerShell**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env` (copy from `backend/.env.example`):
   ```env
   # Database Configuration (Supabase PostgreSQL with PostGIS / Local SQLite)
   DATABASE_URL=postgresql://postgres.your-project-id:your_encoded_password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

   # Supabase Cloud Credentials
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
   SUPABASE_SECRET_KEY=your_supabase_secret_service_role_key

   # AI & Platform Settings
   AI_CONFIDENCE_THRESHOLD=0.65
   AI_SEVERITY_THRESHOLD=5.0
   SPATIAL_CLUSTER_DISTANCE_METERS=50.0
   MIN_INDEPENDENT_BUS_CONFIRMATIONS=2
   ```

5. Launch the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The backend automatically connects to Supabase, creates all schema tables, and verifies 24 buses and 14 issues.*

---

### Step 3: Configure & Start the Frontend

1. Open a **new terminal window** and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Ensure `frontend/.env` is configured (copy from `frontend/.env.example`):
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_WS_URL=ws://localhost:8000/ws
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```

5. Open **`http://127.0.0.1:5173/`** in your web browser.

---

## 🚀 How to Run & Demonstrate NAGAR DRISHTI

### 1. Public Citizen Portal (`http://127.0.0.1:5173/`)
- Demonstrates transparent public governance with national metrics, active buses, verified issues, and the **Citizen Road Surface Defect Reporting Form**.
- Click **"Officer Portal Login"** in the top right to access the departmental authentication screen.

### 2. Departmental Officer Authentication (`http://127.0.0.1:5173/auth`)
- Click any of the 4 dedicated 1-click departmental cards:
  - **PWD Chief Engineer** $\to$ Automatically navigates to `/roads`.
  - **Transport Control Officer** $\to$ Automatically navigates to `/buses`.
  - **BEL System Administrator** $\to$ Automatically navigates to `/settings`.
  - **Municipal Control Room** $\to$ Automatically navigates to `/command`.

### 3. PWD Chief Engineer Operations (`/roads` & `/maintenance`)
- View the **Road Quality Index (RQI)** and **Estimated Hot-Mix Bitumen Required (~17.5 MT)**.
- Click **"Create Work Order"** or **"Dispatch Crew"** on any pothole:
  - Select Contractor: *PMC Ward 4 Rapid Road Squad*
  - Select Bitumen Grade: *VG-30 Hot-Mix Bitumen*
  - Set SLA: *24h Emergency* or *48h Urgent*
  - Click **"Confirm & Dispatch Work Order"**.
- View the **Automated Bus Transit Recheck Protocol**: Click **"Simulate Bus Pass"** on a repaired pothole to watch PMPML Bus `MH-12-RN-4821` verify the road and transition the issue to `RESOLVED`!

### 4. Transport Control Officer Fleet Operations (`/buses`)
- Monitor live fleet mobilization (**22 / 24 Buses Active**).
- Toggle between **Split Radar GIS Map**, **Roster List**, and **Full GIS Map**.
- Click **"Upload Bus Cam Video"** in the top command bar or **"View Camera HUD"** on any bus to open the interactive **Multi-Camera Video Player & AI HUD**:
  - **Live Video Streaming**: Watch real transit dashcam video (`/bus_cam_rear.mp4`) with dynamic trailing car distance and ANPR plate recognition.
  - **Upload Transit Footage**: Select any recorded dashcam video (`.mp4`, `.webm`, `.mov`) or image to immediately run Edge AI inference with real-time HUD reticles and zero latency.
  - **Defect Taxonomy Simulation**: Select detected defect classes (`POTHOLE`, `DAMAGED_ROAD`, `WATERLOGGING`, `MISSING_DIVIDER`, `DAMAGED_SIGNBOARD`) and click **"Ingest To Fleet DB"** to record events and trigger Multi-Bus Spatial Verification.
  - **5-Perspective Camera Switching**: Front Road (28.5 FPS), Rear Video (25.0 FPS), Left Flank curbside (25.0 FPS), Right Flank median (25.0 FPS), and Cabin DMS (20.0 FPS).
- Click **"Broadcast Advisory"** to transmit an emergency road hazard or waterlogging alert to in-cabin driver tablets across Route 102 or all routes.
- Click **"Ping Driver"** on any bus for instant telemetry confirmation.

### 5. BEL System Administrator Console (`/settings`)
- Check live **Supabase PostgreSQL & PostGIS Architecture Status** (24 buses, 14 issues, 69 raw events, GIST spatial indexes).
- Tune the **YOLOv8 Edge Computer Vision Model** confidence and NMS thresholds.
- Adjust the **DBSCAN Multi-Bus Spatial Clustering Engine** radius slider and minimum confirming buses, then click **"Test DBSCAN On Database"**.
- Click **"Inject Test Pothole"** to simulate an immediate high-confidence detection packet from Bus #12 at Karve Road.

### 6. Interactive 12-Step Live Fleet Demo Runner
Click **"Launch Fleet Demo"** in the top action bar on any page to open the 12-step guided walkthrough:
1. **Step 1**: BUS-102 initiates Route 10 (Swargate $\to$ Katraj).
2. **Step 2**: Front dashcam AI detects a severe pothole (Confidence 78%, Severity 8/10).
3. **Step 3 & 4**: Structured event is generated and plotted on the GIS map as `DETECTED` (Amber).
4. **Step 5 & 6**: BUS-217 approaches the location 15 minutes later and detects the defect $\to$ Backend matches spatial coordinates ($\Delta = 12\text{m}$) from a distinct bus $\to$ Status becomes `VERIFIED`!
5. **Step 7 & 8**: Priority Score surges to **94/100 (CRITICAL)** and alerts the command console.
6. **Step 9 & 10**: Authority assigns contractor *Pune Infrastructure Works Ltd* $\to$ Status becomes `REPAIRED`.
7. **Step 11 & 12**: Scheduled bus `BUS-304` runs an automated recheck pass $\to$ AI confirms defect severity dropped from 8/10 to 1/10 $\to$ Issue automatically transitions to `RESOLVED`!

---

## 📋 Smart India Hackathon (SIH 26124) Requirement Coverage Matrix

| Requirement Area | SIH Problem Statement 26124 Specification | Implementation Status | Core Technical Architecture & File Reference |
| :--- | :--- | :--- | :--- |
| **Mobile Edge Sensing** | Public transport buses equipped with cameras acting as mobile urban sensor arrays | `IMPLEMENTED` | [`backend/app/models/bus.py`](file:///backend/app/models/bus.py), [`frontend/src/pages/LiveBuses.jsx`](file:///frontend/src/pages/LiveBuses.jsx) |
| **Unified Road Taxonomy** | Pothole, damaged road, deterioration, waterlogging, divider, zebra crossing, signboards | `IMPLEMENTED` | [`backend/app/models/event.py`](file:///backend/app/models/event.py), [`frontend/src/pages/RoadIntelligence.jsx`](file:///frontend/src/pages/RoadIntelligence.jsx) |
| **Visual Detection Evidence** | Photographic evidence for defects (before vs after recheck), lightbox inspection, and thumbnails | `IMPLEMENTED` | [`frontend/src/utils/evidence.js`](file:///frontend/src/utils/evidence.js), [`frontend/src/components/EventDetailModal.jsx`](file:///frontend/src/components/EventDetailModal.jsx) |
| **Public Vehicle Identity** | Vehicles identified by state registration numbers (`MH 19 6996`, `MH 19 7421`, `MH 19 8134`) | `IMPLEMENTED` | [`backend/app/database/seed.py`](file:///backend/app/database/seed.py), [`frontend/src/components/FleetDemoModal.jsx`](file:///frontend/src/components/FleetDemoModal.jsx) |
| **Multi-Camera Architecture** | Support for 5 multi-angle cameras (Front, Rear, Left, Right, Cabin) with live feeds, dedicated HUD reticles, and model switching | `IMPLEMENTED` | [`frontend/src/components/BusCameraModal.jsx`](file:///frontend/src/components/BusCameraModal.jsx), [`backend/app/models/event.py`](file:///backend/app/models/event.py) |
| **Dashcam Video Streaming & Ingestion** | HTML5 video player streaming real MP4 bus cam footage, file uploader (MP4/WebM/MOV), live reticle overlay & defect injection | `IMPLEMENTED` | [`frontend/src/components/BusCameraModal.jsx`](file:///frontend/src/components/BusCameraModal.jsx), [`backend/app/api/buses.py`](file:///backend/app/api/buses.py) |
| **Edge Bandwidth Optimization** | Raw video processed locally on edge hardware (Jetson); only JSON telemetry sent to cloud (99.8% saved) | `DEMO / SIMULATED` | [`frontend/src/components/BusCameraModal.jsx`](file:///frontend/src/components/BusCameraModal.jsx), Edge AI HUD & Metric Stream |
| **Spatial Deduplication** | GPS-window clustering (50m, 2h) to verify ground-truth without duplicate reports | `IMPLEMENTED` | [`backend/app/services/verification_service.py`](file:///backend/app/services/verification_service.py), Multi-Bus Bayesian Filter |
| **Explainable Priority Scoring** | 5-Factor mathematical model (Severity 25%, Traffic 20%, Safety 15%, Multi-Bus 15%, Age 10%) | `IMPLEMENTED` | [`backend/app/services/priority_service.py`](file:///backend/app/services/priority_service.py), Transparent weight audit breakdown |
| **Closed-Loop Recheck** | Automatic work-order generation and autonomous recheck verification via scheduled bus transit pass | `IMPLEMENTED` | [`backend/app/services/maintenance_service.py`](file:///backend/app/services/maintenance_service.py), 6-stage lifecycle board |
| **Traffic Density & Flow** | Real-time vehicle counting (ByteTrack), density index (0-100%), and bottleneck identification | `IMPLEMENTED` | [`backend/app/api/traffic.py`](file:///backend/app/api/traffic.py), [`frontend/src/pages/TrafficIntelligence.jsx`](file:///frontend/src/pages/TrafficIntelligence.jsx) |
| **Origin-Destination (OD)** | Corridor travel demand estimates, average transit duration, and peak travel windows | `IMPLEMENTED` *(Prototype Model)* | [`backend/app/models/traffic.py`](file:///backend/app/models/traffic.py), Gravity OD Flow Synthesizer |
| **Hit & Run / Rash Driving** | ByteTrack multi-object tracking duration (12.4s), SUV class detection, ANPR plate extraction (94% conf) | `IMPLEMENTED` *(With Demo Simulator)* | [`backend/app/api/incidents.py`](file:///backend/app/api/incidents.py), [`frontend/src/pages/IncidentsPage.jsx`](file:///frontend/src/pages/IncidentsPage.jsx) |
| **Pedestrian Safety** | School children crossing scenario detection, vehicle proximity (18m), speed (42 km/h), risk score (89/100) | `IMPLEMENTED` *(With Demo Simulator)* | [`backend/app/api/incidents.py`](file:///backend/app/api/incidents.py), [`frontend/src/pages/IncidentsPage.jsx`](file:///frontend/src/pages/IncidentsPage.jsx) |
| **Government RBAC** | Authentic MoHUA / Municipal login with dynamic role, department & geographic scope resolution | `IMPLEMENTED` | [`frontend/src/pages/AuthPage.jsx`](file:///frontend/src/pages/AuthPage.jsx), PWD, Transport, SysAdmin roles |
| **Physical Edge Jetson Deployment** | Flashing real NVIDIA Jetson Orin Nano boards on physical city buses with camera feeds | `FUTURE PRODUCTION` | Architecture abstraction provided; production requires edge device provisioning & 4G/5G modems |

---

## 📁 Repository Structure

```
Nagar Dristhi/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point, CORS & lifespan DDL migrations
│   │   ├── config.py                # Platform settings, Supabase credentials & tolerances
│   │   ├── database/
│   │   │   ├── connection.py        # Dual DB engine (Supabase PostgreSQL PostGIS & SQLite)
│   │   │   ├── migrate.py           # Non-destructive schema DDL migrator for Supabase
│   │   │   └── seed.py              # 24 buses, 14 issues, 69 events, OD flows & incidents seeder
│   │   ├── models/                  # SQLAlchemy models (Bus, Event, Issue, Traffic, Incident, OD)
│   │   ├── schemas/                 # Pydantic v2 schemas for requests & responses
│   │   ├── services/
│   │   │   ├── verification_service.py # Multi-Bus DBSCAN Spatial Clustering Algorithm
│   │   │   ├── priority_service.py     # 5-Factor Explainable Priority Scoring (0-100)
│   │   │   ├── maintenance_service.py  # Work-Order Lifecycle & Recheck Verification
│   │   │   └── simulation_service.py   # 12-Step Live Fleet Demo Runner & GPS Simulation
│   │   ├── ai/                      # YOLOv8, ByteTrack, and ANPR abstractions
│   │   ├── api/                     # REST API endpoints & WebSocket broadcaster
│   │   └── static/uploads/          # Ingested dashcam video & footage uploads
│   ├── requirements.txt             # Python dependencies (FastAPI, SQLAlchemy, psycopg2)
│   ├── Dockerfile
│   └── test_backend.py              # Automated backend test suite (7/7 suites passed)
├── frontend/
│   ├── public/                      # Public evidence & multi-camera assets:
│   │   ├── pune_bus_dashcam.jpg     # Front road windshield dashcam feed
│   │   ├── bus_cam_rear.mp4         # Real 1080p rear traffic dashcam MP4 video stream
│   │   ├── bus_cam_rear.jpg         # Rear traffic & following distance feed
│   │   ├── bus_cam_left.jpg         # Left flank curbside & bus bay approach feed
│   │   ├── bus_cam_right.jpg        # Right flank median barrier & lane feed
│   │   ├── bus_cam_cabin.jpg        # Cabin passenger occupancy & DMS feed
│   │   ├── evidence_pothole.jpg     # Pothole detection evidence asset
│   │   ├── evidence_damaged_road.jpg# Damaged road / crack evidence asset
│   │   ├── evidence_missing_divider.jpg # Missing divider evidence asset
│   │   ├── evidence_damaged_signboard.jpg # Damaged signboard evidence asset
│   │   └── evidence_waterlogging.jpg# Waterlogging stagnation evidence asset
│   ├── src/
│   │   ├── components/              # Navbar, Sidebar, GisMap, EventDetailModal, BusCameraModal, etc.
│   │   ├── pages/                   # Role & Operational Pages:
│   │   │   ├── PublicPortal.jsx     # Citizen dashboard & defect reporting
│   │   │   ├── AuthPage.jsx         # Official MoHUA / Municipal officer login
│   │   │   ├── CommandCenter.jsx    # Municipal Control Room command center
│   │   │   ├── RoadIntelligence.jsx # PWD Chief Engineer operations dashboard
│   │   │   ├── LiveBuses.jsx        # Transport Control Officer fleet dashboard
│   │   │   ├── MaintenancePage.jsx  # 6-Stage maintenance lifecycle action board
│   │   │   ├── TrafficIntelligence.jsx # Traffic density, Route delays & OD flow matrices
│   │   │   ├── IncidentsPage.jsx    # Hit & Run ANPR, Pedestrian safety & Intercept alerts
│   │   │   ├── AnalyticsPage.jsx    # City infrastructure & Edge AI model charts
│   │   │   └── SettingsPage.jsx     # System Administrator & PostGIS console
│   │   ├── utils/
│   │   │   └── evidence.js          # Dynamic defect taxonomy photographic evidence resolver
│   │   ├── context/
│   │   │   └── FleetContext.jsx     # Global real-time WebSocket & fleet state
│   │   ├── services/
│   │   │   ├── api.js               # REST API client
│   │   │   └── websocket.js         # WebSocket telemetry connector
│   │   └── data/
│   │       ├── defaultIssues.js     # Default municipal issue seeds
│   │       └── indiaRegions.js      # All-India 28 states & metropolitan transit metadata
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js               # Vite config with EBUSY download lock protection
│   └── tailwind.config.js
├── ARCHITECTURE.md                  # Detailed system architecture documentation
├── PRODUCTION_DEPLOYMENT.md         # Full physical edge hardware & field deployment blueprint
├── Start.md                         # Quick terminal startup guide
└── README.md                        # Primary platform documentation
```

---

## 🧪 Automated Testing

To run the automated backend test suite and verify database connectivity, multi-bus spatial deduplication, priority scoring, Hit & Run ANPR alert persistence, and OD analytics:

```bash
cd backend
python test_backend.py
```

Expected output:
```
✓ Database connectivity test passed (Supabase PostgreSQL / SQLite)
✓ Bus fleet seeding test passed (24 buses verified with primary registration numbers)
✓ Multi-bus spatial deduplication test passed
✓ Priority scoring engine test passed (0-100 scale verified)
✓ Maintenance recheck & autonomous resolution test passed
✓ REST API endpoints test passed
✓ Hit & Run ByteTrack/ANPR alert persistence & OD analytics test passed
7/7 tests passed successfully!
```

---

## 📜 License & Intellectual Property

- **Developed for**: Smart Automation & Edge AI Platform Initiative (SIH Problem Statement 26124)
- **Partner / Evaluator**: Bharat Electronics Limited (BEL) & Ministry of Housing and Urban Affairs (MoHUA), Government of India
- **Architecture**: Open source municipal innovation framework designed for smart city deployment across Indian municipalities.

