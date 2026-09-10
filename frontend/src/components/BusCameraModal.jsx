import React, { useState } from "react";
import {
  X,
  Camera,
  MapPin,
  HardDrive,
  Info,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Eye,
  Radio,
  Maximize2
} from "lucide-react";
import { useFleet } from "../context/FleetContext";

const CAMERA_POSITIONS = [
  {
    id: "FRONT_ROAD",
    label: "Front Road Camera",
    badge: "ROAD INFERENCE",
    image: "/pune_bus_dashcam.jpg",
    model: "YOLOv8-RoadDefect-FP16",
    fps: "28.5 FPS",
    latency: "22ms",
    feedTitle: "Live Windshield Dashcam Feed (Front-Facing Inference)",
    bottomStatus: "GEO-TAGGED ROAD DEFECT DETECTED",
    observation: {
      title: "POTHOLE (Severe Road Crater)",
      desc: "Discovered on transit lane • High rollover hazard for two-wheelers",
      confidence: "88%",
      severity: "8 / 10",
      tag: "HIGH PRIORITY DEFECT",
      icon: "🕳️",
      isDefect: true,
    },
  },
  {
    id: "REAR_TRAFFIC",
    label: "Rear Traffic Camera",
    badge: "ANPR & RADAR",
    image: "/bus_cam_rear.jpg",
    model: "YOLOv8-ANPR-Tailgating-FP16",
    fps: "25.0 FPS",
    latency: "19ms",
    feedTitle: "Live Rear Traffic & Tailgating Radar Feed",
    bottomStatus: "REAR VEHICULAR BUFFER SECURE • SPEED MATCHED",
    observation: {
      title: "TRAILING TRAFFIC & FOLLOWING DISTANCE NORMAL",
      desc: "Trailing vehicle buffer maintained at 14.2m • Automated plate recognition (ANPR) scanning active",
      confidence: "95%",
      severity: "2 / 10",
      tag: "TRAFFIC FLOW NORMAL",
      icon: "🚗",
      isDefect: false,
    },
  },
  {
    id: "LEFT_FLANK",
    label: "Left Flank",
    badge: "CURBSIDE SCAN",
    image: "/bus_cam_left.jpg",
    model: "YOLOv8-Curbside-Proximity",
    fps: "25.0 FPS",
    latency: "21ms",
    feedTitle: "Live Curbside, Bus Bay & Pedestrian Footpath Feed",
    bottomStatus: "CURBSIDE OBSTACLES: 0 DETECTED • BOARDING PERIMETER CLEAR",
    observation: {
      title: "TRANSIT CURBSIDE & BUS STOP APPROACH",
      desc: "Optimal curb docking approach clearance: 1.8m • Pedestrian queue zone safe and unobstructed",
      confidence: "92%",
      severity: "1 / 10",
      tag: "CURBSIDE CLEAR",
      icon: "🚶",
      isDefect: false,
    },
  },
  {
    id: "RIGHT_FLANK",
    label: "Right Flank",
    badge: "MEDIAN SENSOR",
    image: "/bus_cam_right.jpg",
    model: "YOLOv8-Median-LaneBoundary",
    fps: "25.0 FPS",
    latency: "23ms",
    feedTitle: "Live Median Barrier & Overtaking Lane Incursion Feed",
    bottomStatus: "MEDIAN INTEGRITY VERIFIED • NO HEAD-ON ENCROACHMENT",
    observation: {
      title: "MEDIAN DIVIDER BARRIER MONITORED",
      desc: "Continuous median strip integrity verified • No broken divider gaps or oncoming incursions",
      confidence: "94%",
      severity: "3 / 10",
      tag: "BARRIER MONITORED",
      icon: "🛣️",
      isDefect: false,
    },
  },
  {
    id: "CABIN_CAM",
    label: "Cabin Camera",
    badge: "DMS & OCCUPANCY",
    image: "/bus_cam_cabin.jpg",
    model: "YOLOv8-CabinOccupancy-DMS",
    fps: "20.0 FPS",
    latency: "18ms",
    feedTitle: "Live Interior Passenger Cabin & Driver Safety (DMS) Feed",
    bottomStatus: "CABIN DENSITY NORMAL • CCTV ENCRYPTED RECORDING",
    observation: {
      title: "CABIN OCCUPANCY: 68% • DRIVER ALERT",
      desc: "28 seated passengers, 4 standing • Driver alertness index: 99% HIGH • Emergency egress clear",
      confidence: "96%",
      severity: "1 / 10",
      tag: "CABIN SECURE",
      icon: "👥",
      isDefect: false,
    },
  },
];

export default function BusCameraModal() {
  const { selectedBus, setSelectedBus, setSelectedIssue, issues, addToast } = useFleet();
  const [activeCamId, setActiveCamId] = useState("FRONT_ROAD");

  if (!selectedBus) return null;

  const currentCam =
    CAMERA_POSITIONS.find((c) => c.id === activeCamId) || CAMERA_POSITIONS[0];

  // Primary identifier: Vehicle registration number
  const regNo =
    selectedBus.reg_number ||
    (selectedBus.bus_id === "BUS-101" ? "MH 19 6996" : "MH 12 Q 3017");

  // Find corresponding or related verified road event for this bus
  const matchedIssue =
    (issues || []).find(
      (iss) =>
        iss.first_bus === selectedBus.bus_id ||
        iss.confirming_buses?.includes(selectedBus.bus_id)
    ) ||
    (issues || []).find((iss) => iss.issue_type === "POTHOLE") ||
    (issues || [])[0];

  const handleViewEvent = () => {
    if (matchedIssue && setSelectedIssue) {
      setSelectedBus(null);
      setSelectedIssue(matchedIssue);
      if (addToast) {
        addToast(
          `Navigating to Verified Road Defect Event: ${matchedIssue.issue_code} (${matchedIssue.issue_type})`,
          "info"
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] overflow-y-auto flex flex-col">
        {/* Modal Header: Registration as Primary Identifier */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0B3C74] text-amber-300 flex items-center justify-center shadow-xs text-xl shrink-0">
              🚌
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-lg font-black text-slate-900 font-mono tracking-wide">
                  {regNo}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                  {selectedBus.bus_id}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedBus.status || "ONLINE"}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#0B3C74]" />
                {selectedBus.route_name}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedBus(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Top Flow: CURRENT LOCATION & TELEMETRY */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Active Camera Feed
              </span>
              <span className="font-bold text-[#0B3C74] flex items-center gap-1 font-mono text-[11px] truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                {currentCam.label.toUpperCase()}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Edge AI Pipeline
              </span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {currentCam.fps} • ACTIVE
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                GPS Location
              </span>
              <span className="font-mono font-bold text-slate-900 text-[11px]">
                {selectedBus.latitude.toFixed(4)}, {selectedBus.longitude.toFixed(4)}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Transit Speed
              </span>
              <span className="font-mono font-bold text-emerald-700 text-[11px]">
                {selectedBus.speed_kmh} km/h
              </span>
            </div>
          </div>

          {/* Interactive Multi-Camera Architecture Switcher */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0B3C74]" />
                On-Board Multi-Camera Topology (Click to Switch Live View)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Viewing: <strong className="text-emerald-700 font-bold">{currentCam.id}</strong>
              </span>
            </div>

            {/* 5 Clickable Camera Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CAMERA_POSITIONS.map((cam) => {
                const isActive = cam.id === activeCamId;
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setActiveCamId(cam.id);
                      if (addToast) {
                        addToast(`Switched to ${cam.label} feed (${cam.model})`, "info");
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition cursor-pointer text-left ${
                      isActive
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/40 text-emerald-950 font-bold shadow-xs scale-[1.02]"
                        : "bg-slate-50/80 border-slate-200 hover:bg-blue-50/50 hover:border-blue-300 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate text-[11px] font-bold">{cam.label}</span>
                      <span
                        className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ml-1 ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isActive ? "ACTIVE" : "STANDBY"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      {cam.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 italic pt-0.5">
              Click any camera position above to switch live video feed and AI spatial inference reticles.
            </p>
          </div>

          {/* Camera View: Realistic Viewfinder with Live Overlays */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0B3C74]" />
                {currentCam.feedTitle}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentCam.model}
              </span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-300 bg-black shadow-lg">
              {/* Dynamic Camera Feed Image */}
              <img
                key={currentCam.id}
                src={currentCam.image}
                alt={currentCam.label}
                className="w-full h-full object-cover filter contrast-105 animate-fadeIn"
                onError={(e) => {
                  e.currentTarget.src = "/pune_bus_dashcam.jpg";
                }}
              />

              {/* DEMO VIDEO — SIMULATED BUS CAMERA WATERMARK */}
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <div className="px-3 py-1 rounded-md bg-black/85 backdrop-blur-xs border border-amber-400/80 text-amber-300 font-mono text-[10px] sm:text-[11px] font-black tracking-wider flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  LIVE FEED • {currentCam.id}
                </div>
              </div>

              {/* Viewfinder Reticle & Dynamic HUD Overlays */}
              <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 flex flex-col justify-between">
                {/* Top HUD Line */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-cyan-300 bg-black/75 backdrop-blur-xs p-2 rounded-lg border border-cyan-500/30 max-w-[65%] sm:max-w-none">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold text-red-400">REC [AI ACTIVE]</span>
                    <span className="text-gray-400 hidden sm:inline">|</span>
                    <span className="hidden sm:inline">BUS: {regNo}</span>
                    <span className="text-gray-400 hidden sm:inline">|</span>
                    <span>{currentCam.id}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300 hidden md:inline">
                      GPS: {selectedBus.latitude.toFixed(4)}, {selectedBus.longitude.toFixed(4)}
                    </span>
                    <span className="text-gray-400 hidden md:inline">|</span>
                    <span className="text-emerald-300 font-bold">{selectedBus.speed_kmh} KM/H</span>
                  </div>
                </div>

                {/* OVERLAYS PER CAMERA POSITION */}
                {activeCamId === "FRONT_ROAD" && (
                  <>
                    {/* Bounding Box 1: Pothole / Surface Defect */}
                    <div className="absolute top-[64%] left-[36%] w-[24%] h-[16%] border-2 border-red-500 bg-red-500/20 rounded-xs shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                      <div className="bg-red-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>🕳️ POTHOLE (88%) • SEV 8/10</span>
                      </div>
                    </div>

                    {/* Bounding Box 2: Auto-Rickshaw on left */}
                    <div className="absolute top-[37%] left-[16%] w-[20%] h-[32%] border-2 border-amber-400 bg-amber-400/15 rounded-xs">
                      <div className="bg-amber-500 text-slate-950 font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🛺 AUTO-RICKSHAW (91%)
                      </div>
                    </div>

                    {/* Bounding Box 3: White Sedan Car on right */}
                    <div className="absolute top-[39%] left-[57%] w-[21%] h-[26%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🚗 SEDAN #104 (94%)
                      </div>
                    </div>
                  </>
                )}

                {activeCamId === "REAR_TRAFFIC" && (
                  <>
                    {/* Bounding Box: Trailing vehicle with following distance */}
                    <div className="absolute top-[42%] left-[32%] w-[34%] h-[38%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>🚗 SEDAN • GAP: 14.2m [SAFE BUFFER]</span>
                      </div>
                    </div>

                    {/* ANPR Plate Recognition Box */}
                    <div className="absolute top-[68%] left-[40%] w-[18%] h-[8%] border border-emerald-400 bg-emerald-500/20 rounded-xs">
                      <div className="bg-emerald-600 text-white font-mono text-[7px] sm:text-[8px] font-bold px-1 py-0.5 inline-block">
                        ANPR: MH 12 TR 8941
                      </div>
                    </div>

                    {/* Two-Wheeler on flank */}
                    <div className="absolute top-[46%] left-[12%] w-[15%] h-[30%] border-2 border-amber-400 bg-amber-400/15 rounded-xs">
                      <div className="bg-amber-500 text-slate-950 font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🏍️ TWO-WHEELER (96%)
                      </div>
                    </div>
                  </>
                )}

                {activeCamId === "LEFT_FLANK" && (
                  <>
                    {/* Curbside & Bus Bay Docking Reticle */}
                    <div className="absolute top-[40%] left-[10%] w-[38%] h-[46%] border-2 border-emerald-400 bg-emerald-400/15 rounded-xs shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                      <div className="bg-emerald-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>🚏 BUS BAY APPROACH • 1.8m CLEARANCE</span>
                      </div>
                    </div>

                    {/* Waiting Pedestrians */}
                    <div className="absolute top-[44%] left-[54%] w-[22%] h-[34%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🚶 WAITING PASSENGERS (93%)
                      </div>
                    </div>
                  </>
                )}

                {activeCamId === "RIGHT_FLANK" && (
                  <>
                    {/* Median Barrier Detection */}
                    <div className="absolute top-[35%] left-[5%] w-[42%] h-[55%] border-2 border-amber-400 bg-amber-400/15 rounded-xs shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                      <div className="bg-amber-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>🛣️ MEDIAN BARRIER • CONTINUOUS (1.1m)</span>
                      </div>
                    </div>

                    {/* Overtaking Vehicle */}
                    <div className="absolute top-[42%] left-[56%] w-[30%] h-[36%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🚙 OVERTAKING LANE #2 • CLEAR
                      </div>
                    </div>
                  </>
                )}

                {activeCamId === "CABIN_CAM" && (
                  <>
                    {/* Interior Seating Occupancy Grid */}
                    <div className="absolute top-[28%] left-[18%] w-[64%] h-[52%] border-2 border-emerald-400 bg-emerald-400/10 rounded-xs shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      <div className="bg-emerald-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>👥 PASSENGERS: 28 / 42 SEATS (68% OCCUPANCY)</span>
                      </div>
                    </div>

                    {/* Driver Vigilance HUD */}
                    <div className="absolute top-[16%] left-[6%] w-[24%] h-[22%] border border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[7px] sm:text-[8px] font-bold px-1 py-0.5 inline-block">
                        👁️ DRIVER ALERTNESS: 99%
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom HUD Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 bg-black/75 backdrop-blur-xs p-2 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 font-bold">LATENCY: {currentCam.latency}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-300">{currentCam.model}</span>
                  </div>
                  <span className="text-amber-300 font-bold hidden sm:inline">
                    {currentCam.bottomStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core SIH Section: CURRENT AI OBSERVATION (Dynamic per active camera) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-extrabold text-slate-200">
                  CURRENT AI OBSERVATION • {currentCam.label.toUpperCase()}
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                currentCam.observation.isDefect
                  ? "bg-red-950 text-red-300 border-red-800"
                  : "bg-emerald-950 text-emerald-300 border-emerald-800"
              }`}>
                {currentCam.observation.tag}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              <div className="sm:col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentCam.observation.icon}</span>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100 tracking-wide font-mono flex items-center gap-2">
                      {currentCam.observation.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {currentCam.observation.desc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[9px] text-slate-400 uppercase block">Confidence</span>
                    <span className="text-sm font-black text-emerald-400">{currentCam.observation.confidence}</span>
                  </div>

                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[9px] text-slate-400 uppercase block">Severity / Risk</span>
                    <span className="text-sm font-black text-amber-400">{currentCam.observation.severity}</span>
                  </div>

                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[9px] text-slate-400 uppercase block">GPS Location</span>
                    <span className="text-xs font-bold text-slate-200 truncate block">
                      {selectedBus.latitude.toFixed(4)}, {selectedBus.longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[9px] text-slate-400 uppercase block">Sensor Frame</span>
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      10:42:18
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="sm:col-span-2 flex flex-col justify-center items-stretch sm:border-l sm:border-slate-800 sm:pl-4 space-y-2">
                <span className="text-[11px] text-slate-400">
                  {currentCam.observation.isDefect
                    ? "Convert mobile edge detection into municipal work-order & PWD repair audit:"
                    : "Live spatial sensor active. Click other cameras to inspect 360° coverage:"}
                </span>

                {currentCam.observation.isDefect ? (
                  <button
                    onClick={handleViewEvent}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>VIEW EVENT RECORD</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveCamId("FRONT_ROAD")}
                    className="w-full py-2.5 px-4 bg-[#0B3C74] hover:bg-[#082b52] active:scale-98 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    <Camera className="w-4 h-4" />
                    <span>RETURN TO FRONT ROAD</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Edge AI Bandwidth Reduction Metrics Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-100">
                  Edge AI Bandwidth Optimization Architecture
                </span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                SIH ARCHITECTURE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Raw Video On Edge</span>
                <p className="text-lg font-bold text-slate-200 mt-0.5">~6.0 Mbps</p>
                <span className="text-[10px] text-slate-500">Processed locally on Jetson</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Telemetry To Cloud</span>
                <p className="text-lg font-bold text-sky-400 mt-0.5">~12.4 Kbps</p>
                <span className="text-[10px] text-slate-500">JSON metadata &amp; alerts only</span>
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-700/50">
                <span className="text-[10px] text-emerald-400 block uppercase">Bandwidth Saved</span>
                <p className="text-lg font-bold text-emerald-300 mt-0.5">99.8%</p>
                <span className="text-[10px] text-emerald-400/80">Zero expensive cloud streaming</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
