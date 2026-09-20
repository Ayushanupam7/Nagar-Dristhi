import React, { useState } from "react";
import {
  ShieldAlert,
  Car,
  Users,
  CheckCircle2,
  Radio,
  Send,
  Volume2,
  VolumeX,
  X,
  MapPin,
  Clock,
  ExternalLink,
  Cpu,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { useNavigate } from "react-router-dom";

export default function IncidentAlarmModal() {
  const { activeAlarm, setActiveAlarm, addToast } = useFleet();
  const navigate = useNavigate();
  const [dispatched, setDispatched] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  if (!activeAlarm) return null;

  const handleDispatch = () => {
    setDispatched(true);
    addToast(
      `🚨 Secure Telemetry Dispatched: Incident ${activeAlarm.incident_code} encrypted & routed to ${activeAlarm.recipient || "Pune Traffic Police HQ"}`,
      "success"
    );
  };

  const handleViewOnMap = () => {
    setActiveAlarm(null);
    navigate(`/command?lat=${activeAlarm.latitude}&lng=${activeAlarm.longitude}`);
    addToast(`Navigating to GIS Incident Location: ${activeAlarm.location_name}`, "info");
  };

  const isHitAndRun = activeAlarm.incident_type === "HIT_AND_RUN";
  const isPedestrian = activeAlarm.incident_type === "PEDESTRIAN_RISK";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Sound wave / Alarm Box */}
      <div className="bg-slate-950 border-2 border-red-500 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.55)] max-w-2xl w-full text-white font-mono overflow-hidden flex flex-col animate-scaleUp">
        
        {/* Flashing Siren Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-red-800 p-4 px-6 flex items-center justify-between border-b border-red-500/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-xl shrink-0 animate-bounce">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
                  EMERGENCY INCIDENT ALARM
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-yellow-300 border border-yellow-400/40">
                  SIH 26124 EDGE DISPATCH
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-semibold mt-0.5">
                Onboard Vision Neural Net Detected Critical Public Safety Event
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-red-100 transition cursor-pointer"
              title={soundMuted ? "Unmute Alarm" : "Mute Alarm"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            </button>
            <button
              onClick={() => setActiveAlarm(null)}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-red-100 transition cursor-pointer"
              title="Close Alarm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Incident Title & Risk Score */}
          <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                {activeAlarm.incident_code} • {activeAlarm.incident_type.replace(/_/g, " ")}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {activeAlarm.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeAlarm.description}
              </p>
            </div>

            <div className="bg-black/60 border border-red-500/50 p-3 rounded-xl text-center shrink-0 min-w-[110px]">
              <span className="text-[9px] text-slate-400 uppercase block">Risk Score</span>
              <span className="text-2xl font-black text-red-400 font-mono">
                {activeAlarm.risk_score || 94}/100
              </span>
              <span className="text-[9px] font-bold text-red-300 block uppercase">
                {activeAlarm.severity || "CRITICAL"}
              </span>
            </div>
          </div>

          {/* Key SIH Required Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Offending Vehicle or Pedestrian Details */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wide flex items-center gap-1.5">
                {isPedestrian ? <Users className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                {isPedestrian ? "Vulnerable Pedestrian Profile" : "Offending Vehicle (ANPR Extracted)"}
              </span>

              {isPedestrian ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scenario:</span>
                    <span className="font-bold text-white">{activeAlarm.pedestrian_scenario?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pedestrian Count:</span>
                    <span className="font-bold text-amber-300">{activeAlarm.pedestrian_count} School Children</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle Proximity:</span>
                    <span className="font-bold text-red-400">{activeAlarm.vehicle_proximity_m} meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle Speed:</span>
                    <span className="font-bold text-red-400">{activeAlarm.vehicle_speed_kmh} km/h (HIGH RISK)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle Class:</span>
                    <span className="font-bold text-white">{activeAlarm.vehicle_class || "SUV"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">License Plate:</span>
                    <span className="font-black font-mono text-sm px-2 py-0.5 rounded bg-yellow-400 text-slate-950 tracking-wider">
                      {activeAlarm.registration_number || "MH 19 6996"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ANPR Confidence:</span>
                    <span className="font-bold text-emerald-400">
                      {activeAlarm.plate_confidence ? `${(activeAlarm.plate_confidence * 100).toFixed(1)}%` : "94.2%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ByteTrack Duration:</span>
                    <span className="font-bold text-cyan-300">{activeAlarm.tracking_duration || 12.4}s Active Lock</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sensing Unit (Bus) & Edge Verification */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wide flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Sensing Unit &amp; Spatial Telemetry
              </span>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bus Identifier:</span>
                  <span className="font-bold text-white font-mono">{activeAlarm.bus_reg_number || activeAlarm.bus_id || "MH 12 Q 3017"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Camera Source:</span>
                  <span className="font-bold text-slate-200">{activeAlarm.camera_id || "Front Windshield"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GPS Coordinates:</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {activeAlarm.latitude?.toFixed(4)}, {activeAlarm.longitude?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-bold text-slate-300">{activeAlarm.time_formatted || "Live Now"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Banner */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-slate-300 truncate">
                <strong className="text-white">Location:</strong> {activeAlarm.location_name}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
              PUNE METRO
            </span>
          </div>

          {/* Edge AI Bandwidth Efficiency Badge */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Edge AI Onboard Optimization:</strong> ByteTrack &amp; OCR processed on-bus. Only <strong>{activeAlarm.bandwidth_bytes || "1.4 KB"}</strong> telemetry payload transmitted.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-600 text-emerald-200 shrink-0">
              99.8% BANDWIDTH SAVED
            </span>
          </div>

          {/* Action Dispatch Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={handleDispatch}
              disabled={dispatched}
              className={`sm:col-span-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-mono ${
                dispatched
                  ? "bg-emerald-700 text-white border border-emerald-500"
                  : "bg-red-600 hover:bg-red-700 text-white active:scale-98"
              }`}
            >
              {dispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>SECURE TELEMETRY SENT TO POLICE &amp; HQ</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>DISPATCH SECURE ALERT TO TRAFFIC POLICE HQ</span>
                </>
              )}
            </button>

            <button
              onClick={handleViewOnMap}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>VIEW ON GIS MAP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
