# NAGAR DRISHTI (नगर दृष्टि)
## Production Deployment & Field Implementation Blueprint

> **System**: AI-Powered Mobile Urban Sensing Platform using Public Transport Fleet  
> **Target Deployments**: Municipal Corporations (PMC, BMC, BBMP, MCD) & State Road Transport Undertakings (PMPML, BEST, BMTC, DTC)  
> **Technology Evaluation Partner**: Bharat Electronics Limited (BEL) & Ministry of Housing and Urban Affairs (MoHUA)  

---

## 📑 Table of Contents
1. [Architecture Overview & Data Lifecycle](#1-architecture-overview--data-lifecycle)
2. [Physical On-Board Hardware Bill of Materials (BOM)](#2-physical-on-board-hardware-bill-of-materials-bom)
3. [Vehicle Electrical Integration & Ignition Circuit](#3-vehicle-electrical-integration--ignition-circuit)
4. [Multi-Camera Positioning & Sensor Topology](#4-multi-camera-positioning--sensor-topology)
5. [Edge AI Software Stack & Container Pipeline](#5-edge-ai-software-stack--container-pipeline)
6. [Offline-First Store & Forward Telemetry](#6-offline-first-store--forward-telemetry)
7. [Cloud & Supabase Production Infrastructure](#7-cloud--supabase-production-infrastructure)
8. [Data Privacy, Face/Plate Redaction & Legal Compliance](#8-data-privacy-faceplate-redaction--legal-compliance)
9. [Fleet Device Management & Over-The-Air (OTA) Updates](#9-fleet-device-management--over-the-air-ota-updates)
10. [Step-by-Step Production Rollout Phases](#10-step-by-step-production-rollout-phases)

---

## 1. Architecture Overview & Data Lifecycle

In production, the platform operates as a **decentralized edge compute mesh** connected to a **centralized PostGIS cloud core**. Raw video streams are processed on-device inside each bus; only structured, geo-tagged JSON telemetry and compressed evidence crops are transmitted over 4G/5G networks.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ON-BOARD BUS SENSOR MESH                               │
│                                                                                        │
│   5× IP67 Cameras ──MIPI/USB3──► [ NVIDIA Jetson / NPU Box ] ◄── Dual GNSS GPS Antenna │
│                                         │                                              │
│                                 TensorRT YOLOv8 (28 FPS)                               │
│                                         │                                              │
│                               [ Defect Filter > 70% ]                                  │
│                                         │                                              │
│                                   Snapshot Crop                                        │
│                                (40 KB WebP + JSON)                                     │
└─────────────────────────────────────────┼──────────────────────────────────────────────┘
                                          │ Encrypted HTTPS / TLS 1.3
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD INFRASTRUCTURE (MUMBAI)                             │
│                                                                                        │
│                      [ Cloudflare CDN & NGINX Reverse Proxy ]                          │
│                                         │                                              │
│                        [ FastAPI Scalable Worker Pool ]                                │
│                                         │                                              │
│         ┌───────────────────────────────┴──────────────────────────────┐               │
│         ▼                                                              ▼               │
│  [ Supabase Storage ]                                        [ Supabase PostGIS DB ]   │
│  - Bucket: 'evidence-snapshots'                              - Multi-Bus Verification  │
│  - Public Signed URLs                                        - 5-Factor Priority (0-100)
│                                                              - Realtime WebSocket Hub  │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         MUNICIPAL OPERATIONS & FIELD ACTION                            │
│                                                                                        │
│   [ PWD Chief Engineer ] ──► Dispatch Hot-Mix Work Order ──► Contractor Repairs Pothole│
│                                                                        │               │
│   [ Autonomous Recheck ] ◄── Routine Bus Transit Scan (Sev ≤ 2/10) ◄───┘               │
│            │                                                                           │
│            ▼                                                                           │
│   [ Closed-Loop Resolution ]                                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Physical On-Board Hardware Bill of Materials (BOM)

The hardware package installed in each bus is designed for harsh automotive operating environments (vibration, heat, dust, and electrical spikes):

| Component | Recommended Specification | Enterprise Vendor / Model | Est. Unit Cost (INR) |
| :--- | :--- | :--- | :--- |
| **Edge AI Accelerator** | 20–40 TOPS INT8, 8GB/16GB LPDDR5, -25°C to 80°C operating temp | NVIDIA Jetson Orin Nano (8GB) / Orin NX or Advantech MIC-710AIX | ₹35,000 – ₹55,000 |
| **Front Road Camera** | 1080p@30FPS, Sony STARVIS 2 IMX678 sensor, 120° FOV, IP67 waterproof, WDR > 120dB | E-Con Systems / Leopard Imaging USB3/GMSL2 Automotive Cam | ₹8,000 – ₹12,000 |
| **Auxiliary Cameras (4×)** | 1080p wide-angle IP67 dome/bullet cams (Rear, Left Flank, Right Flank, Cabin) | E-Con Systems / Hikvision Mobile IP67 Series | ₹16,000 (₹4,000 × 4) |
| **GNSS / GPS Receiver** | Dual-frequency L1/L5 GNSS with Dead Reckoning (DR) for tunnels & urban flyover shadows | U-blox ZED-F9P or NEO-M9N Module | ₹6,000 – ₹9,000 |
| **Cellular Gateway** | Industrial 4G/5G Cat-4/Cat-12 cellular router with Dual-SIM auto-failover | Quectel RG500Q / Teltonika RUT955 | ₹12,000 – ₹18,000 |
| **Automotive Power Unit** | 9V–36V DC input, transient spike suppression (ISO 7637-2), ignition sense & timed shutdown | M4-ATX or MeanWell Automotive DCDC Regulator | ₹4,500 – ₹6,500 |
| **Storage (Edge Buffer)** | 256GB–512GB Industrial M.2 NVMe SSD (High write endurance TBW) | Kingston Industrial / Western Digital PC SN740 | ₹4,000 – ₹6,000 |
| **Enclosure & Wiring** | Fanless IP65 aluminium extrusion chassis, M12 vibration-proof aviation connectors | Custom Sheet Metal / Phoenix Contact | ₹3,500 – ₹5,000 |
| **Total per Bus (Approx)**| **Turnkey Edge AI Sensing Unit per Bus** | | **₹89,000 – ₹1,27,500** |

---

## 3. Vehicle Electrical Integration & Ignition Circuit

Public transit buses operate on **24V DC battery systems** (or 12V in smaller mini-buses). The edge box connects into the vehicle electrical harness using a **timed ignition-sensing power delivery system**:

```
 [ Bus Alternator / 24V Battery ]
                │
                ▼
  [ Inline 15A Automotive Fuse ]
                │
                ▼
   [ Transient Surge Suppressor (ISO 7637-2 / 600V Spike Clamp) ]
                │
                ├──────────────────────────────────────────┐
                ▼                                          ▼
   [ Wide-Input DC-DC Regulator ]             [ Ignition Sense Lead (IGN) ]
        (24V DC ──► 12V DC)                                │
                │                                          │
                └──────────────────┬───────────────────────┘
                                   │
                                   ▼
                   [ Edge Compute Power Management ]
                     - Ignition ON: Boot Jetson in 18s
                     - Ignition OFF: Flush buffer, send shutdown ping, power off in 60s
```

- **Ignition-Aware Power Cycle**: The unit boots automatically when the driver starts the engine.
- **Graceful Shutdown**: When the bus key is turned off at the depot, the edge OS receives a GPIO interrupt, safely flushes all SQLite queues to disk, and executes `systemctl poweroff` within 60 seconds to prevent battery drain.
- **Reverse Polarity & Surge Protection**: Prevents damage from jump-starts or bus battery alternators.

---

## 4. Multi-Camera Positioning & Sensor Topology

Every bus features 5 coordinated camera feeds covering 360° of the vehicle's spatial footprint:

```
                          ┌──────────────┐
                          │ FRONT BUMPER │
                          └──────┬───────┘
                                 │
                     [ 1. FRONT ROAD CAMERA ]
                   (Potholes, Cracks, Ravelling)
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     │                                                       │
[ 3. LEFT FLANK CAM ]                                  [ 4. RIGHT FLANK CAM ]
(Curbside, Bus Bay approach,                           (Median barriers, Divider
 Footpath obstructions, Pedestrians)                    damage, Blind-spot incursion)
     │                                                       │
     │                 [ 5. CABIN / DMS CAM ]                │
     │            (Passenger density, Driver vigilance)      │
     │                                                       │
     └───────────────────────────┬───────────────────────────┘
                                 │
                     [ 2. REAR TRAFFIC CAMERA ]
                   (ANPR, Tailgating buffer radar)
                                 │
                          ┌──────┴───────┐
                          │ REAR BUMPER  │
                          └──────────────┘
```

1. **Front Road Camera** (`FRONT_ROAD`): Mounted at top center of front windshield inside the wiper sweep path. High downward pitch ($15^\circ$) focused on 3m–25m road patch.
2. **Rear Traffic Camera** (`REAR_TRAFFIC`): Mounted on rear window or bumper facing following traffic. Scans tailgating distance and ANPR license plates.
3. **Left Flank Camera** (`LEFT_FLANK`): Mounted on left exterior rearview bracket facing curbside bus stops, footpath encroachment, and boarding queues.
4. **Right Flank Camera** (`RIGHT_FLANK`): Mounted on right exterior bracket tracking the median concrete divider, lane lines, and overtaking traffic.
5. **Cabin Camera** (`CABIN_CAM`): Wide-angle interior dome camera monitoring driver vigilance and passenger seating occupancy density.

---

## 5. Edge AI Software Stack & Container Pipeline

The on-board software operates inside a hardened Docker container running under **Ubuntu 22.04 LTS with JetPack 6.x**:

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER EDGE RUNTIME CONTAINER            │
│                                                             │
│   [ GStreamer 1.22 Hardware H.264/H.265 Video Decoder ]     │
│                              │                              │
│   [ Pre-Processing: 640×640 Normalization (CUDA Streams) ]  │
│                              │                              │
│   [ TensorRT Engine: YOLOv8-NagarDrishti-INT8 (28.5 FPS) ]  │
│                              │                              │
│   [ ByteTrack Multi-Object Tracker (Track ID persistence) ] │
│                              │                              │
│   [ Defect Spatial Event Formatter & Privacy Redactor ]     │
│                              │                              │
│   [ SQLite Edge Buffer (Store-and-Forward Queue) ]          │
│                              │                              │
│   [ HTTPS Client: Signed Event Upload (TLS 1.3) ]           │
└──────────────────────────────┬──────────────────────────────┘
                               │ 4G/5G Cellular Link
                               ▼
```

### TensorRT Model Optimization Parameters:
- **Architecture**: YOLOv8s custom fine-tuned on 45,000 Indian road defect images (Indian Road Defect Dataset / Roboflow Smart City).
- **Precision**: INT8 calibration using TensorRT engine builder (reduces VRAM to 1.1 GB, cuts latency to **22.4 ms** per frame).
- **Classes**: `pothole`, `damaged_road`, `missing_divider`, `damaged_signboard`, `waterlogging`, `vehicle_sedan`, `vehicle_bus`, `vehicle_autorickshaw`, `vehicle_twowheeler`, `pedestrian`.

---

## 6. Offline-First Store & Forward Telemetry

Public transit buses frequently pass through cellular dead zones (underpasses, tunnels, rural highway patches, basements). The edge software implements a **zero-loss offline-first queue**:

1. **Local Queue**: Detections are immediately serialized into an encrypted local **SQLite** database on the NVMe SSD:
   ```sql
   CREATE TABLE edge_event_queue (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       event_uuid TEXT NOT NULL UNIQUE,
       event_type TEXT NOT NULL,
       latitude REAL NOT NULL,
       longitude REAL NOT NULL,
       confidence REAL NOT NULL,
       severity INTEGER NOT NULL,
       image_blob BLOB NOT NULL,
       status TEXT DEFAULT 'PENDING',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
2. **Network Health Probe**: A lightweight background daemon pings `http://127.0.0.1:8000/api/health` every 10 seconds.
3. **Batch Transmission**: Once 4G/5G connectivity is restored, events are uploaded in prioritized FIFO batches (Critical severity first).
4. **Local Retention**: Uploaded records are purged after confirmation from the server, maintaining free SSD space.

---

## 7. Cloud & Supabase Production Infrastructure

### 7.1 Database Cluster Topology (Supabase)
- **Region**: AWS Mumbai (`ap-south-1`) for sub-30ms nationwide round-trip latency.
- **Engine**: PostgreSQL 16.x with **PostGIS 3.4** spatial extensions.
- **Connection Pooler**: PgBouncer / Supabase Pooler over IPv4 (Port 5432).

### 7.2 PostGIS Spatial Indexing
To support high-velocity queries across thousands of buses without performance degradation, the coordinates are stored as PostGIS `geography` types with GIST indexes:

```sql
-- Convert coordinates to native PostGIS Point on insert
ALTER TABLE issues ADD COLUMN geom geography(Point, 4326);
UPDATE issues SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

-- Build high-speed GIST Spatial Index
CREATE INDEX idx_issues_spatial ON issues USING GIST (geom);
CREATE INDEX idx_events_spatial ON events USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
```

### 7.3 Multi-Bus Clustering Query
When a bus uploads an observation, the backend clusters nearby events within 50 meters in milliseconds:

```sql
SELECT id, issue_code, confirmations_count, combined_confidence 
FROM issues 
WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:event_lng, :event_lat), 4326), 50.0)
  AND status != 'RESOLVED'
ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(:event_lng, :event_lat), 4326)) ASC
LIMIT 1;
```

---

## 8. Data Privacy, Face/Plate Redaction & Legal Compliance

To comply with the **Digital Personal Data Protection (DPDP) Act, 2023** and municipal surveillance mandates:

1. **On-Device Privacy Redaction**:
   - Before any image crop is saved or transmitted from the bus, the edge YOLO pipeline runs a localized face and license plate detector.
   - Any detected human face or non-violating vehicle license plate is subjected to a **$25\times25$ Gaussian blur** directly in memory.
   - Only road surface defects, infrastructure damage, and specific traffic violation plates (e.g. BRTS lane infringements) are retained.
2. **Encrypted Storage**:
   - Evidence snapshots are stored in private or signed Supabase Storage Buckets using AES-256 server-side encryption.
3. **Role-Based Audit Logging**:
   - Every officer action (assigning contractors, status changes, manual overrides) is cryptographically logged with user ID, timestamp, and IP.

---

## 9. Fleet Device Management & Over-The-Air (OTA) Updates

Managing 500 to 2,000 edge AI units across a city bus depot requires automated device fleet management:

```
┌─────────────────────────────────────────────────────────────┐
│                 CENTRAL CLOUD FLEET MANAGER                 │
│              (BalenaOS / AWS IoT Greengrass)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Encrypted MQTT / WireGuard VPN
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
 [ Depot Bus #101 ]      [ Depot Bus #102 ]      [ Depot Bus #304 ]
 ├── Dual-Root A/B       ├── Dual-Root A/B       ├── Dual-Root A/B
 └── Docker Container    └── Docker Container    └── Docker Container
```

1. **A/B Dual-Root System Partitioning**: Prevents bricking during OTA OS updates. If an update fails, the edge box automatically boots into the last working partition.
2. **Docker Container Rolling Updates**: Upgrading the YOLOv8 model weights (`.engine` file) is as simple as pushing a new container image tag over Wi-Fi when buses return to the depot overnight.
3. **Depot Wi-Fi Bulk Sync**: When buses enter the depot (e.g., PMPML Swargate Depot), the edge box automatically connects to the depot high-speed 5 GHz Wi-Fi to offload full HD audit logs and download model checkpoints.

---

## 10. Step-by-Step Production Rollout Phases

```
  PHASE 1: DEPOT PILOT          PHASE 2: ZONE ROLLOUT           PHASE 3: METRO SCALE
      (Months 1-3)                  (Months 4-6)                    (Months 7-12)
 ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
 │ • 25 PMPML Buses     │      │ • 250 Transit Buses  │      │ • 1,500+ Buses Fleet │
 │ • 3 High-Traffic     │ ───► │ • Full PWD Zone 4    │ ───► │ • All 15 PMC Wards   │
 │   Corridors (Swargate│      │ • 4 PWD Contractors  │      │ • Police ANPR Inter- │
 │   to Katraj / JM Rd) │      │ • Live Work Orders   │      │   connect Integration│
 │ • Edge Calibration   │      │ • Automated Rechecks │      │ • State-Wide Portal  │
 └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

### Phase 1: Pilot Depot Sandbox (25 Buses)
- Mount hardware on 25 buses operating across 3 high-priority transit corridors.
- Tune YOLOv8 false-positive filtering against Indian monsoon rain, dust, and shadow conditions.
- Calibrate GPS Dead Reckoning accuracy under flyovers and metro viaducts.

### Phase 2: Municipal Zone Deployment (250 Buses)
- Expand to an entire municipal zone (e.g., PMC Zone 4).
- Onboard certified PWD road repair contractors into the 6-stage maintenance board.
- Activate the automated bus transit recheck loop to eliminate manual site inspection sign-offs.

### Phase 3: City-Wide & Pan-India Scale (1,500+ Buses)
- Full fleet coverage across all urban depots (Swargate, Kothrud, Hadapsar, Katraj, Nigdi).
- Integration with Traffic Police ANPR servers for automated BRTS bus lane violation challans.
- Expand platform across other state road transport undertakings (BEST Mumbai, BMTC Bengaluru, DTC Delhi).

---

*Authored for the Smart India Hackathon (SIH 26124) Technical Evaluation Committee & Bharat Electronics Limited (BEL).*
