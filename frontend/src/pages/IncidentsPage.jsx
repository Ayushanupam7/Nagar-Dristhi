import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Car,
  UserX,
  AlertTriangle,
  Radio,
  Send,
  CheckCircle2,
  Clock,
  Navigation,
  Gauge,
  Scan,
  Crosshair,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";
import { useFleet } from "../context/FleetContext";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transmittingId, setTransmittingId] = useState(null);
  const { addToast } = useFleet();

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSimulateHitAndRun = async () => {
    setLoading(true);
    try {
      const inc = await api.simulateHitAndRun();
      addToast(
        `Hit & Run Simulation Logged: Plate ${inc.license_plate || inc.registration_number} (SUV) tracked for ${inc.tracking_duration || 12.4}s`,
        "error"
      );
      await fetchIncidents();
    } catch (err) {
      addToast("Failed to simulate Hit & Run: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSchoolCrossing = async () => {
    setLoading(true);
    try {
      const inc = await api.simulateSchoolCrossing();
      addToast(
        `School Zone Pedestrian Hazard Logged near Bus ${inc.bus_id} (Risk Score: ${inc.risk_score || 89}/100)`,
        "warning"
      );
      await fetchIncidents();
    } catch (err) {
      addToast("Failed to simulate School Crossing hazard: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAnpr = async () => {
    setLoading(true);
    try {
      const inc = await api.simulateAnpr();
      addToast(`BRTS Lane Violation Logged: Plate ${inc.license_plate}`, "info");
      await fetchIncidents();
    } catch (err) {
      addToast("Failed to simulate ANPR: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchAlert = async (incident) => {
    setTransmittingId(incident.id);
    try {
      const res = await api.dispatchIncidentAlert(
        incident.id,
        "High-priority intercept & control room dispatch triggered by operator"
      );
      addToast(
        `Secure Command Alert Transmitted for ${incident.incident_code || incident.id} to Police & Transit HQ`,
        "success"
      );
      await fetchIncidents();
    } catch (err) {
      addToast("Failed to transmit alert: " + err.message, "error");
    } finally {
      setTransmittingId(null);
    }
  };

  return (
    <div className="p-5 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight">
                  Public Safety, ANPR &amp; Pedestrian Risk Intelligence
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  DEMO / SIMULATION
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mobile Edge-AI surveillance for hit-and-run investigation, rash driving tracking (ByteTrack), and school-zone pedestrian collision prevention.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateHitAndRun}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Car className="w-3.5 h-3.5 text-rose-200" />
            <span>Simulate Hit &amp; Run (ANPR)</span>
          </button>

          <button
            onClick={handleSimulateSchoolCrossing}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <UserX className="w-3.5 h-3.5 text-amber-100" />
            <span>Simulate School Crossing Hazard</span>
          </button>

          <button
            onClick={handleSimulateAnpr}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#0B3C74] hover:bg-[#072850] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Scan className="w-3.5 h-3.5 text-blue-200" />
            <span>Simulate BRTS Lane Breach</span>
          </button>

          <button
            onClick={fetchIncidents}
            className="p-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Incidents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Intelligence Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {incidents.map((inc) => {
          const isHitAndRun =
            inc.incident_type === "HIT_AND_RUN" ||
            inc.incident_type === "RASH_DRIVING" ||
            inc.incident_type === "ANPR_VIOLATION";
          const isPedestrian =
            inc.incident_type === "PEDESTRIAN_HAZARD" ||
            inc.pedestrian_scenario;
          const plate = inc.registration_number || inc.license_plate;
          const isAlertTransmitted =
            inc.alert_status === "COMMAND_ALERT_TRANSMITTED";

          return (
            <div
              key={inc.id}
              className={`bg-white rounded-xl border transition-shadow shadow-xs flex flex-col justify-between overflow-hidden ${
                inc.risk_level === "CRITICAL"
                  ? "border-rose-300 ring-1 ring-rose-200"
                  : "border-slate-200"
              }`}
            >
              {/* Card Top Banner */}
              <div
                className={`px-5 py-3 border-b flex items-center justify-between ${
                  inc.risk_level === "CRITICAL"
                    ? "bg-rose-50/60 border-rose-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-900">
                    {inc.incident_code || `INC-${inc.id.toString().slice(0, 6)}`}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-[#0B3C74]">
                    {inc.incident_type.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      inc.risk_level === "CRITICAL"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {inc.risk_level}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    EDGE AI
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1">
                {/* Description */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {inc.description}
                </p>

                {/* Specific Hit & Run / ANPR Telemetry Console */}
                {isHitAndRun && (
                  <div className="bg-slate-900 text-white rounded-lg p-4 space-y-3 font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>ByteTrack Multi-Object Tracking Record</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Class: {inc.vehicle_class || "SUV"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Target Plate
                        </span>
                        <span className="text-base font-extrabold tracking-widest text-amber-300">
                          {plate || "MH 19 6996"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Plate Confidence
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          {Math.round((inc.plate_confidence || inc.ocr_confidence || 0.94) * 100)}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Track Duration
                        </span>
                        <span className="text-sm font-bold text-sky-400">
                          {inc.tracking_duration ? `${inc.tracking_duration}s` : "12.4s"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specific Pedestrian Risk Scenario Console */}
                {isPedestrian && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Scenario: {inc.pedestrian_scenario || "School Children Crossing Hazard"}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                        Risk Score: {inc.risk_score || 89}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-slate-400" />
                        <span>Proximity: <strong>{inc.vehicle_proximity_m || 18} meters</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        <span>Transit Speed: <strong>{inc.vehicle_speed_kmh || 42} km/h</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence Image / Dashcam Frame */}
                {inc.evidence_url && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img
                      src={inc.evidence_url}
                      alt="Incident Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                      <span>BUS {inc.bus_id} • FRONT DASHCAM</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded">
                      GPS: {inc.latitude?.toFixed(4)}, {inc.longitude?.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Dispatch Action */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-slate-500 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(inc.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    Bus Registration: <strong className="text-slate-800">MH 19 6996</strong> (BUS {inc.bus_id})
                  </div>
                </div>

                {/* Command Alert Dispatch Button */}
                <div>
                  {isAlertTransmitted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>COMMAND ALERT SENT</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDispatchAlert(inc)}
                      disabled={transmittingId === inc.id}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {transmittingId === inc.id
                          ? "TRANSMITTING..."
                          : "Transmit Secure Command Alert"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
