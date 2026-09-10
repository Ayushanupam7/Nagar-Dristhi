# NAGAR DRISHTI: Architecture & Engineering Specification

> **Organization**: Bharat Electronics Limited (BEL)  
> **Domain**: Smart Automation & Mobile Edge AI  
> **Platform Tagline**: *"Turning Public Buses into Mobile AI Sensors"*

---

## 1. System Overview & End-to-End Pipeline

NAGAR DRISHTI turns existing municipal transit bus fleets (e.g., PMPML in Pune) into intelligent, mobile sensing units. Low-cost dashcams mounted on buses feed forward-facing video into on-board Edge AI accelerators (NVIDIA Jetson / x86 mobile compute units). The edge devices run real-time inference (YOLOv8 + ByteTrack) to detect road defects (potholes, waterlogging, eroded bitumen, median damage) and traffic flow metrics.

Instead of continuously uploading high-bandwidth raw video feeds, the edge system produces **lightweight, geo-tagged structured JSON events** containing only timestamp, GPS coordinates, event type, confidence score, defect severity (1-10), and an evidence snapshot.

The centralized backend ingests these events, executes **Multi-Bus Verification** (clustering observations from independent buses within a configurable spatial radius), computes an **Explainable AI Priority Score (0–100)**, and feeds the centralized GIS Command Center.

```mermaid
flowchart TD
    subgraph EdgeFleet["Mobile Public Transit Fleet (Edge AI Sensors)"]
        Bus1["Bus 102 (Dashcam + Jetson)"]
        Bus2["Bus 217 (Dashcam + Jetson)"]
        Bus3["Bus 304 (Dashcam + Jetson)"]
        YOLO["YOLOv8 + ByteTrack Inference"]
        EventGen["Geo-Tagged Structured Event Generator"]
        Bus1 --> YOLO
        Bus2 --> YOLO
        Bus3 --> YOLO
        YOLO --> EventGen
    end

    subgraph CentralBackend["FastAPI Central Command Backend"]
        Ingest["REST Event Ingestion API (/api/events)"]
        Verif["Multi-Bus Spatial Verification Engine (Haversine/PostGIS)"]
        Priority["Transparent AI Priority Engine (0-100 Score)"]
        Maint["Maintenance Lifecycle & Recheck Service"]
        DB[(PostgreSQL + PostGIS / SQLite Spatial)]
        WS["WebSocket Hub (/ws)"]

        EventGen -- "JSON over 4G/5G" --> Ingest
        Ingest --> Verif
        Verif <--> DB
        Verif --> Priority
        Priority --> DB
        Maint <--> DB
        Ingest -.-> WS
        Verif -.-> WS
        Maint -.-> WS
    end

    subgraph GISFrontend["GIS Command Center (React 18 + Vite + Leaflet)"]
        Map["Leaflet GIS Map (Bus Fleet + Defect Layers)"]
        Alerts["Real-Time Critical Alerts Drawer"]
        Kanban["Maintenance Lifecycle Board (6 Stages)"]
        HUD["Simulated Dashcam Viewfinder HUD"]
        SIHModal["Interactive 12-Step SIH Demo Runner"]
        
        WS -- "Live Telemetry & Alerts" --> GISFrontend
        GISFrontend <--> Ingest
    end

    subgraph AuthorityAction["Municipal Authority Operations"]
        Assign["Work Order Dispatch to Contractor"]
        Repair["Contractor Executes Road Repair"]
        Recheck["Automated Fleet Pass Rechecks Defect (Severity <= 2/10)"]
        Resolved["Issue Transitioned to RESOLVED"]

        Kanban --> Assign --> Repair --> Recheck --> Resolved
    end
```

---

## 2. Multi-Bus Spatial Verification Algorithm

### The Problem
Single-camera computer vision in mobile urban environments suffers from transient false positives: shadows, oil stains, puddles, lighting glare, or camera lens smudges can falsely trigger pothole or defect alerts.

### The Innovation
NAGAR DRISHTI requires **independent physical confirmation across multiple distinct buses**. When a new event arrives:
1. Spatial search identifies active issues within `DISTANCE_THRESHOLD_METERS` (default: 50 meters).
2. Time window check verifies observations fall within `TIME_WINDOW_HOURS` (default: 48 hours).
3. **Distinct Bus Verification**:
   - Observations from the *same* bus ID update the last-observed timestamp but **do not** increment the confirmation count.
   - Observations from a *distinct* bus ID increment the confirmation count and record a confirmation audit record.
4. **Bayesian Ensemble Confidence Update**:
   $$\text{Confidence}_{\text{new}} = 1 - (1 - \text{Confidence}_{\text{old}}) \times (1 - \text{Confidence}_{\text{event}})$$
5. **State Transition**: When confirmations $\ge \text{MIN\_INDEPENDENT\_BUSES}$ (default: 2), status immediately transitions from `DETECTED` to `VERIFIED`.

---

## 3. Explainable AI Priority Scoring Engine

Unlike opaque neural network scores, NAGAR DRISHTI calculates a transparent, deterministic priority score between $0$ and $100$:

$$\text{Priority Score} = w_c \cdot C + w_s \cdot S + w_t \cdot T + w_r \cdot R + w_v \cdot V$$

| Factor | Weight ($w$) | Raw Input | Normalization / Scale |
| :--- | :--- | :--- | :--- |
| **Detection Confidence ($C$)** | 25% | 0.0 to 1.0 | Scaled to 0–100 |
| **Defect Severity ($S$)** | 25% | 1 to 10 scale | Multiplied by 10 (10–100) |
| **Traffic Volume ($T$)** | 20% | Corridor Density | LOW: 30, MED: 60, HIGH: 85, EXTREME: 100 |
| **Safety Risk ($R$)** | 15% | Vulnerability to 2-wheelers | LOW: 25, MED: 50, HIGH: 80, CRITICAL: 100 |
| **Confirmations ($V$)** | 15% | Distinct Buses | 1 Bus: 40%, 2 Buses: 80%, 3+ Buses: 100% |

### Priority Levels:
- **0 – 30**: `LOW`
- **31 – 60**: `MEDIUM`
- **61 – 80**: `HIGH`
- **81 – 100**: `CRITICAL` (triggers instant visual and audio sirens on the municipal console)

---

## 4. Maintenance Lifecycle & Mobile Recheck System

The maintenance lifecycle implements a closed-loop feedback loop:

```
DETECTED ──► VERIFIED ──► PRIORITIZED ──► ASSIGNED ──► REPAIRED ──► RECHECKED ──► RESOLVED
```

- **Recheck Verification**:
  When a contractor marks an issue `REPAIRED`, the issue is not automatically closed. Subsequent buses travelling along that route automatically scan the repaired coordinate.
  - If the recheck AI pass detects severity $\le 2/10$ (smooth asphalt), the issue automatically transitions to `RESOLVED`.
  - If the defect is still present ($> 2/10$), status changes to `RECHECKED (INCOMPLETE)` and flags contractor deficiency.

---

## 5. Edge AI Deployment Architecture (Future Scope)

On real bus hardware:
- **Compute Unit**: NVIDIA Jetson Orin Nano / AGX Orin mounted in bus electrical cabinet.
- **Camera**: IP67 1080p Sony STARVIS dashcam with global shutter.
- **Power**: 12V/24V vehicle battery with ignition delay timer.
- **Local Cache**: SQLite queue buffer when 4G/5G cellular connectivity is intermittent.
- **Optimization**: TensorRT FP16 quantization for YOLOv8 running at 30 FPS under 15W power envelope.
