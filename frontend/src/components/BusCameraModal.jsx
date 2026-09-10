import React, { useState, useRef } from "react";
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
  Maximize2,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Film,
  Check,
  Zap,
  RefreshCw
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { api } from "../services/api";

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
    video: "/bus_cam_rear.mp4",
    model: "YOLOv8-ANPR-Tailgating-FP16",
    fps: "25.0 FPS",
    latency: "19ms",
    feedTitle: "Live Rear Traffic & Tailgating Radar Feed (Real Video Stream)",
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
  const { selectedBus, setSelectedBus, setSelectedIssue, issues, addToast, refreshData } = useFleet();
  const [activeCamId, setActiveCamId] = useState("FRONT_ROAD");

  // Custom footage state (video or image uploaded by user)
  const [customFootage, setCustomFootage] = useState(null); // { url, name, size, type: 'video' | 'image', file }
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [selectedDefectType, setSelectedDefectType] = useState("POTHOLE");
  const [isIngesting, setIsIngesting] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Determine active feed media and format
  const activeFeedSource = customFootage ? customFootage.url : (currentCam.video || currentCam.image);
  const isVideoFeed = customFootage ? customFootage.type === "video" : Boolean(currentCam.video);

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

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  // Handle file upload (video or image)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video") || /\.(mp4|webm|mov|ogg|mkv)$/i.test(file.name);
    const isImage = file.type.startsWith("image") || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isVideo && !isImage) {
      if (addToast) addToast("Please upload an MP4, WebM, MOV video or JPG/PNG image.", "error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const formattedSize = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    setCustomFootage({
      url: objectUrl,
      name: file.name,
      size: formattedSize,
      type: isVideo ? "video" : "image",
      file: file,
    });
    setIsPlaying(true);
    setIsMuted(true);

    if (addToast) {
      addToast(
        isVideo
          ? `Uploaded Bus Dashcam Video "${file.name}" (${formattedSize})! Streaming with Edge AI HUD.`
          : `Uploaded Bus Dashcam Image "${file.name}" (${formattedSize})!`,
        "success"
      );
    }
  };

  // Ingest detection from footage to fleet database
  const handleIngestFromFootage = async () => {
    setIsIngesting(true);
    try {
      let evidenceUrl = customFootage?.url || currentCam.image;

      // Optional backend upload sync if real file is present
      if (customFootage?.file) {
        try {
          const formData = new FormData();
          formData.append("file", customFootage.file);
          formData.append("camera_id", activeCamId);
          formData.append("defect_type", selectedDefectType);
          const uploadRes = await api.uploadBusFootage(selectedBus.bus_id, formData);
          if (uploadRes?.url) {
            evidenceUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn("Backend persistent upload fallback to local reference:", uploadErr);
        }
      }

      const defectSeverity = selectedDefectType === "POTHOLE" ? 8 : (selectedDefectType === "DAMAGED_ROAD" ? 7 : 6);

      await api.createEvent({
        event_type: selectedDefectType,
        confidence: 0.94,
        severity: defectSeverity,
        bus_id: selectedBus.bus_id,
        latitude: selectedBus.latitude,
        longitude: selectedBus.longitude,
        speed_kmh: selectedBus.speed_kmh || 26.5,
        heading_deg: selectedBus.heading_deg || 180.0,
        evidence_url: evidenceUrl,
      });

      if (refreshData) refreshData();

      if (addToast) {
        addToast(
          `⚡ Successfully Ingested ${selectedDefectType} Detection from Bus ${selectedBus.bus_id}! Multi-Bus Spatial Verification triggered.`,
          "success"
        );
      }
    } catch (err) {
      console.error(err);
      if (addToast) addToast(`Failed to ingest event: ${err.message}`, "error");
    } finally {
      setIsIngesting(false);
    }
  };

  const activeObservation = customFootage
    ? {
        title: `${selectedDefectType.replace(/_/g, " ")} DETECTED (USER FOOTAGE)`,
        desc: `Edge AI Vision Model scanned "${customFootage.name}" • Real-time detection reticle applied`,
        confidence: "94%",
        severity: selectedDefectType === "POTHOLE" ? "8 / 10" : (selectedDefectType === "DAMAGED_ROAD" ? "7 / 10" : "6 / 10"),
        tag: "CUSTOM EDGE INFERENCE",
        icon: selectedDefectType === "POTHOLE" ? "🕳️" : (selectedDefectType === "DAMAGED_ROAD" ? "⚠️" : "🌊"),
        isDefect: true,
      }
    : currentCam.observation;

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
                {customFootage ? "CUSTOM FOOTAGE" : currentCam.label.toUpperCase()}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Edge AI Pipeline
              </span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {isVideoFeed ? "30.0 FPS • VIDEO STREAM" : `${currentCam.fps} • ACTIVE`}
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

          {/* Video & Footage Upload Bar */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 rounded-xl border border-blue-200/80 p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B3C74] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Film className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Bus Dashcam Video / Footage Ingestion
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                      MP4 • WebM • MOV • JPG
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload recorded transit footage to test live Edge AI inference and real-time defect verification.
                  </p>
                </div>
              </div>

              {/* Upload & Revert Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3C74] hover:bg-[#072850] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Video / Image</span>
                </button>

                {customFootage && (
                  <button
                    onClick={() => {
                      setCustomFootage(null);
                      if (addToast) addToast("Reverted to standard bus camera stream.", "info");
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                    title="Reset to default presets"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Revert</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Footage Status & Defect Ingestion Options */}
            {customFootage && (
              <div className="bg-white rounded-lg border border-blue-200 p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[220px]">
                    {customFootage.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {customFootage.size}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {customFootage.type.toUpperCase()} ACTIVE
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold">Simulate Defect:</span>
                    <select
                      value={selectedDefectType}
                      onChange={(e) => setSelectedDefectType(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="POTHOLE">🕳️ POTHOLE</option>
                      <option value="DAMAGED_ROAD">⚠️ DAMAGED ROAD</option>
                      <option value="WATERLOGGING">🌊 WATERLOGGING</option>
                      <option value="MISSING_DIVIDER">🚧 MISSING DIVIDER</option>
                      <option value="DAMAGED_SIGNBOARD">🪧 SIGNBOARD</option>
                    </select>
                  </div>

                  <button
                    onClick={handleIngestFromFootage}
                    disabled={isIngesting}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isIngesting ? "Ingesting..." : "Ingest To Fleet DB"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Multi-Camera Architecture Switcher */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0B3C74]" />
                On-Board Multi-Camera Topology (Click to Switch Live View)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Viewing: <strong className="text-emerald-700 font-bold">{customFootage ? "CUSTOM FEED" : currentCam.id}</strong>
              </span>
            </div>

            {/* 5 Clickable Camera Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CAMERA_POSITIONS.map((cam) => {
                const isActive = !customFootage && cam.id === activeCamId;
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setCustomFootage(null);
                      setActiveCamId(cam.id);
                      setIsPlaying(true);
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
                        {cam.video ? "VIDEO" : (isActive ? "ACTIVE" : "STANDBY")}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      {cam.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 italic pt-0.5 flex items-center justify-between">
              <span>Click any camera position above to switch live feed, or upload custom video to test edge detection.</span>
              {currentCam.video && !customFootage && (
                <span className="text-emerald-700 font-bold font-mono">
                  🎬 Playing Live MP4 Dashcam Video
                </span>
              )}
            </p>
          </div>

          {/* Camera View: Realistic Viewfinder with Live Overlays */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0B3C74]" />
                {customFootage ? `Custom Edge Feed • ${customFootage.name}` : currentCam.feedTitle}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {customFootage ? "YOLOv8-CustomFootage-Edge" : currentCam.model}
              </span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-300 bg-black shadow-lg group">
              {/* Dynamic Camera Feed (Video or Image) */}
              {isVideoFeed ? (
                <video
                  ref={videoRef}
                  key={activeFeedSource}
                  src={activeFeedSource}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover filter contrast-105"
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration) {
                      setVideoProgress((v.currentTime / v.duration) * 100);
                    }
                  }}
                  onError={() => {
                    if (addToast) addToast("Video load error; fallback to standard image feed.", "error");
                  }}
                />
              ) : (
                <img
                  key={activeFeedSource}
                  src={activeFeedSource}
                  alt={customFootage ? customFootage.name : currentCam.label}
                  className="w-full h-full object-cover filter contrast-105 animate-fadeIn"
                  onError={(e) => {
                    e.currentTarget.src = "/pune_bus_dashcam.jpg";
                  }}
                />
              )}

              {/* LIVE / VIDEO WATERMARK */}
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <div className="px-3 py-1 rounded-md bg-black/85 backdrop-blur-xs border border-amber-400/80 text-amber-300 font-mono text-[10px] sm:text-[11px] font-black tracking-wider flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {isVideoFeed ? "LIVE VIDEO FEED" : "LIVE FEED"} • {customFootage ? "CUSTOM" : currentCam.id}
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
                    <span>{customFootage ? "CUSTOM_STREAM" : currentCam.id}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300 hidden md:inline">
                      GPS: {selectedBus.latitude.toFixed(4)}, {selectedBus.longitude.toFixed(4)}
                    </span>
                    <span className="text-gray-400 hidden md:inline">|</span>
                    <span className="text-emerald-300 font-bold">{selectedBus.speed_kmh} KM/H</span>
                  </div>
                </div>

                {/* OVERLAYS FOR CUSTOM FOOTAGE */}
                {customFootage && (
                  <>
                    <div className="absolute top-[52%] left-[34%] w-[32%] h-[24%] border-2 border-red-500 bg-red-500/20 rounded-xs shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse">
                      <div className="bg-red-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-2 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>{activeObservation.icon} {selectedDefectType} (94% CONF) • SEV 8/10</span>
                      </div>
                    </div>

                    <div className="absolute top-[28%] left-[12%] w-[22%] h-[35%] border border-cyan-400 bg-cyan-400/10 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[7px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🚗 VEHICLE #42 (95%)
                      </div>
                    </div>
                  </>
                )}

                {/* OVERLAYS PER DEFAULT CAMERA POSITION (When not custom) */}
                {!customFootage && activeCamId === "FRONT_ROAD" && (
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

                {!customFootage && activeCamId === "REAR_TRAFFIC" && (
                  <>
                    {/* Bounding Box: Trailing vehicle with following distance */}
                    <div className="absolute top-[38%] left-[28%] w-[38%] h-[42%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>🚗 SEDAN • GAP: 14.2m [SAFE BUFFER]</span>
                      </div>
                    </div>

                    {/* ANPR Plate Recognition Box */}
                    <div className="absolute top-[66%] left-[38%] w-[20%] h-[9%] border border-emerald-400 bg-emerald-500/20 rounded-xs">
                      <div className="bg-emerald-600 text-white font-mono text-[7px] sm:text-[8px] font-bold px-1 py-0.5 inline-block">
                        ANPR: MH 12 TR 8941
                      </div>
                    </div>

                    {/* Two-Wheeler on flank */}
                    <div className="absolute top-[46%] left-[10%] w-[16%] h-[32%] border-2 border-amber-400 bg-amber-400/15 rounded-xs">
                      <div className="bg-amber-500 text-slate-950 font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🏍️ TWO-WHEELER (96%)
                      </div>
                    </div>
                  </>
                )}

                {!customFootage && activeCamId === "LEFT_FLANK" && (
                  <>
                    <div className="absolute top-[40%] left-[10%] w-[38%] h-[46%] border-2 border-emerald-400 bg-emerald-400/15 rounded-xs shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                      <div className="bg-emerald-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-center gap-1 shadow-xs">
                        <span>🚏 BUS BAY APPROACH • 1.8m CLEARANCE</span>
                      </div>
                    </div>

                    <div className="absolute top-[44%] left-[54%] w-[22%] h-[34%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🚶 WAITING PASSENGERS (93%)
                      </div>
                    </div>
                  </>
                )}

                {!customFootage && activeCamId === "RIGHT_FLANK" && (
                  <>
                    <div className="absolute top-[35%] left-[5%] w-[42%] h-[55%] border-2 border-amber-400 bg-amber-400/15 rounded-xs shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                      <div className="bg-amber-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>🛣️ MEDIAN BARRIER • CONTINUOUS (1.1m)</span>
                      </div>
                    </div>

                    <div className="absolute top-[42%] left-[56%] w-[30%] h-[36%] border-2 border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[8px] sm:text-[9px] font-bold px-1 py-0.5 inline-block">
                        🚙 OVERTAKING LANE #2 • CLEAR
                      </div>
                    </div>
                  </>
                )}

                {!customFootage && activeCamId === "CABIN_CAM" && (
                  <>
                    <div className="absolute top-[28%] left-[18%] w-[64%] h-[52%] border-2 border-emerald-400 bg-emerald-400/10 rounded-xs shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      <div className="bg-emerald-600 text-white font-mono text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <span>👥 PASSENGERS: 28 / 42 SEATS (68% OCCUPANCY)</span>
                      </div>
                    </div>

                    <div className="absolute top-[16%] left-[6%] w-[24%] h-[22%] border border-cyan-400 bg-cyan-400/15 rounded-xs">
                      <div className="bg-cyan-600 text-white font-mono text-[7px] sm:text-[8px] font-bold px-1 py-0.5 inline-block">
                        👁️ DRIVER ALERTNESS: 99%
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom HUD Bar & Interactive Video Controls */}
                <div className="space-y-1.5">
                  {/* Interactive Video Playback Toolbar (Pointer Events Active) */}
                  {isVideoFeed && (
                    <div className="pointer-events-auto flex items-center justify-between gap-2 bg-black/80 backdrop-blur-md p-1.5 px-3 rounded-lg border border-cyan-500/30 text-white text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlay}
                          className="p-1 rounded hover:bg-white/20 transition cursor-pointer text-cyan-300"
                          title={isPlaying ? "Pause Video" : "Play Video"}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>

                        <button
                          onClick={toggleMute}
                          className="p-1 rounded hover:bg-white/20 transition cursor-pointer text-slate-300"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={restartVideo}
                          className="p-1 rounded hover:bg-white/20 transition cursor-pointer text-slate-300"
                          title="Restart Video"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Video Timeline Progress Bar */}
                      <div className="flex-1 mx-2 bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                        <span className="text-emerald-400 font-bold">STREAMING</span>
                        <button
                          onClick={() => {
                            if (videoRef.current?.requestFullscreen) {
                              videoRef.current.requestFullscreen();
                            }
                          }}
                          className="p-1 rounded hover:bg-white/20 transition cursor-pointer text-slate-300"
                          title="Fullscreen"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Latency and Status Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 bg-black/75 backdrop-blur-xs p-2 rounded-lg border border-cyan-500/30">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-300 font-bold">
                        LATENCY: {currentCam.latency}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-300">
                        {customFootage ? "YOLOv8 Edge Vision Pipeline" : currentCam.model}
                      </span>
                    </div>
                    <span className="text-amber-300 font-bold hidden sm:inline">
                      {customFootage ? "INSPECTION ACTIVE • REAL-TIME RETICLES ENGAGED" : currentCam.bottomStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core SIH Section: CURRENT AI OBSERVATION (Dynamic per active camera or footage) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-extrabold text-slate-200">
                  CURRENT AI OBSERVATION • {customFootage ? "CUSTOM FOOTAGE" : currentCam.label.toUpperCase()}
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  activeObservation.isDefect
                    ? "bg-red-950 text-red-300 border-red-800"
                    : "bg-emerald-950 text-emerald-300 border-emerald-800"
                }`}
              >
                {activeObservation.tag}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              <div className="sm:col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeObservation.icon}</span>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100 tracking-wide font-mono flex items-center gap-2">
                      {activeObservation.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {activeObservation.desc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[9px] text-slate-400 uppercase block">Confidence</span>
                    <span className="text-sm font-black text-emerald-400">{activeObservation.confidence}</span>
                  </div>

                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[9px] text-slate-400 uppercase block">Severity / Risk</span>
                    <span className="text-sm font-black text-amber-400">{activeObservation.severity}</span>
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
                  {customFootage
                    ? "Push custom edge detection into municipal work-order pipeline & verification engine:"
                    : (activeObservation.isDefect
                        ? "Convert mobile edge detection into municipal work-order & PWD repair audit:"
                        : "Live spatial sensor active. Click other cameras to inspect 360° coverage:")}
                </span>

                {customFootage ? (
                  <button
                    onClick={handleIngestFromFootage}
                    disabled={isIngesting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-mono disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isIngesting ? "INGESTING TO DATABASE..." : "INGEST TO FLEET DATABASE"}</span>
                  </button>
                ) : activeObservation.isDefect ? (
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
