import React from "react";
import {
  Bus,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Activity,
  TrendingUp,
  MapPin,
  Play
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { getDetectionEvidenceImage } from "../utils/evidence";
import GisMap from "../components/GisMap";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";

export default function CommandCenter() {
  const {
    summary,
    issues,
    recentEvents,
    setSelectedIssue,
    setIsSihModalOpen,
    currentRegion,
    user
  } = useFleet();

  const criticalIssues = issues.filter(
    (i) =>
      (i.priority_level === "CRITICAL" || (i.priority_score && i.priority_score >= 80)) &&
      i.status !== "RESOLVED"
  );

  return (
    <div className="space-y-4 p-5 animate-fadeIn">
      {/* Top Header Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#138808] animate-pulse" />
            <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight">
              {currentRegion?.id === "ALL_INDIA"
                ? "All-India Transit & Infrastructure Command Center"
                : `${currentRegion?.name || "Pune"} Transit & Road Command Center`}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRegion?.id === "ALL_INDIA"
              ? "Government of India • Ministry of Housing & Urban Affairs (MoHUA) • Integrated 28 States & UTs Transit Grid"
              : `Government of ${currentRegion?.state || "Maharashtra"} • ${currentRegion?.agency || "Municipal Operations & Fleet Monitoring"}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs shadow-2xs">
              <span className="text-sm">{user.emoji || "👮"}</span>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-[11px] leading-tight">{user.name}</p>
                <p className="text-[9px] text-slate-500 font-mono leading-tight">{user.roleTitle}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsSihModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0B3C74] hover:bg-[#072850] text-white rounded-md text-xs font-semibold shadow transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current text-blue-200" />
            <span>Launch Fleet Demo</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Active Buses */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Active Fleet</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-[#0B3C74] border border-blue-100">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">{summary.active_buses || 22}</span>
              <span className="text-xs text-slate-500 font-mono">/ {summary.total_buses || 24}</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              91.6% Fleet Mobilized
            </p>
          </div>
        </div>

        {/* KPI 2: Total Detected */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Detected Issues</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold font-mono text-slate-900">{summary.total_issues || 14}</span>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              From {summary.total_events_logged || 69} Raw Events
            </p>
          </div>
        </div>

        {/* KPI 3: Verified Issues */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Verified Ground Truth</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold font-mono text-[#0B3C74]">{summary.verified_issues || 12}</span>
            <p className="text-[10px] text-blue-700 font-semibold mt-1">
              Multi-Bus Confirmed (2+ passes)
            </p>
          </div>
        </div>

        {/* KPI 4: Critical Issues */}
        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-rose-800">Critical Priority</span>
            <div className="p-1.5 rounded-md bg-rose-100 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold font-mono text-rose-800">{summary.critical_issues || 8}</span>
            <p className="text-[10px] text-rose-700 font-semibold mt-1">
              Priority Score &gt; 80 / 100
            </p>
          </div>
        </div>

        {/* KPI 5: Resolved */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Closed &amp; Repaired</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold font-mono text-emerald-700">{summary.resolved_issues || 2}</span>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">
              Automated Recheck Pass Verified
            </p>
          </div>
        </div>
      </div>

      {/* Center Layout: Main GIS Map + Right Critical Alerts Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8-9 Cols: Interactive GIS Map */}
        <div className="lg:col-span-8 xl:col-span-9 h-[540px] flex flex-col">
          <GisMap height="100%" />
        </div>

        {/* Right 3-4 Cols: Critical Alerts Feed */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[540px] shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Critical Alerts</h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
              {criticalIssues.length} Immediate
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto my-3 flex-1 pr-1">
            {criticalIssues.length > 0 ? (
              criticalIssues.map((iss) => (
                <div
                  key={iss.id}
                  onClick={() => setSelectedIssue(iss)}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0B3C74] group-hover:underline">
                      {iss.issue_code}
                    </span>
                    <PriorityBadge score={iss.priority_score} level={iss.priority_level} />
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-14 h-12 rounded overflow-hidden border border-slate-300 shrink-0 bg-slate-900 relative">
                      <img
                        src={getDetectionEvidenceImage(iss)}
                        alt={iss.issue_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = "/evidence_pothole.jpg";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{iss.issue_type.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{iss.location_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>Confirmations: <strong className="text-[#0B3C74] font-bold">{iss.confirmations_count} buses</strong></span>
                    <StatusBadge status={iss.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">All Transit Hazards Controlled</p>
                <p className="text-[10px]">No unresolved critical priority alerts in current scope.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              onClick={() => setIsSihModalOpen(true)}
              className="w-full py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-300"
            >
              Simulate Live Bus Confirmation
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Live Event Feed & City Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live Event Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-600">Incoming Fleet Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
            {recentEvents.slice(0, 4).map((evt) => (
              <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-900 font-mono text-[11px]">{evt.bus_id} • {evt.event_type}</p>
                  <p className="text-[10px] text-slate-500">Conf: {Math.round(evt.confidence * 100)}% | Severity: {evt.severity}/10</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Traffic Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-600">Municipal Traffic Congestion</span>
            <Activity className="w-4 h-4 text-[#0B3C74]" />
          </div>
          <div className="my-auto py-2 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-amber-600">{summary.traffic_congestion_index || 54.0}%</span>
              <span className="text-xs font-mono text-slate-500">Transit Delay: +8.5m</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.traffic_congestion_index || 54}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Busiest Transit Corridor: <strong className="text-slate-800">Swargate → Katraj BRTS</strong>
            </p>
          </div>
        </div>

        {/* Card 3: Road Health & Coverage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-600">Road Quality Surface Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-auto py-2 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-emerald-700">{summary.road_health_index || 84.5}</span>
              <span className="text-xs font-mono text-slate-500">Fleet Coverage: {summary.bus_coverage_percent || 94.2}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.road_health_index || 84.5}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Aggregated from 24 PMPML transit bus routes covering 94% Pune roads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
