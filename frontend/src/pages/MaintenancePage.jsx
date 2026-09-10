import React, { useState, useMemo } from "react";
import {
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Search,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  Layers,
  RotateCcw,
  ExternalLink,
  Bus,
  Check,
  ChevronRight,
  TrendingUp,
  MapPin,
  Building2,
  HardHat
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { getDetectionEvidenceImage } from "../utils/evidence";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";

const STAGES = [
  {
    key: "DETECTED",
    label: "1. Detected",
    sub: "Edge AI On-Bus",
    color: "text-amber-800",
    bg: "bg-amber-50/80",
    border: "border-amber-300",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-300"
  },
  {
    key: "VERIFIED",
    label: "2. Verified",
    sub: "Multi-Bus Cross-Check",
    color: "text-blue-800",
    bg: "bg-blue-50/80",
    border: "border-blue-300",
    badgeBg: "bg-blue-100 text-blue-900 border-blue-300"
  },
  {
    key: "PRIORITIZED",
    label: "3. Prioritized",
    sub: "AI Risk Scoring",
    color: "text-purple-800",
    bg: "bg-purple-50/80",
    border: "border-purple-300",
    badgeBg: "bg-purple-100 text-purple-900 border-purple-300"
  },
  {
    key: "ASSIGNED",
    label: "4. Assigned",
    sub: "PWD Work Order",
    color: "text-indigo-800",
    bg: "bg-indigo-50/80",
    border: "border-indigo-300",
    badgeBg: "bg-indigo-100 text-indigo-900 border-indigo-300"
  },
  {
    key: "REPAIRED",
    label: "5. Repaired",
    sub: "Contractor Done",
    color: "text-teal-800",
    bg: "bg-teal-50/80",
    border: "border-teal-300",
    badgeBg: "bg-teal-100 text-teal-900 border-teal-300"
  },
  {
    key: "RESOLVED",
    label: "6. Resolved",
    sub: "Fleet AI Recheck Verified",
    color: "text-emerald-800",
    bg: "bg-emerald-50/80",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-300"
  },
];

export default function MaintenancePage() {
  const { issues, setSelectedIssue, refreshData } = useFleet();
  const [activeStageFilter, setActiveStageFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("board"); // 'board' | 'list'

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = issues.length;
    const detected = issues.filter((i) => i.status === "DETECTED").length;
    const verified = issues.filter((i) => i.status === "VERIFIED").length;
    const inProgress = issues.filter((i) => i.status === "ASSIGNED" || i.status === "REPAIRED" || i.status === "PRIORITIZED").length;
    const resolved = issues.filter((i) => i.status === "RESOLVED" || i.status === "RECHECKED").length;
    const critical = issues.filter((i) => i.priority_score >= 80).length;
    return { total, detected, verified, inProgress, resolved, critical };
  }, [issues]);

  // Filtering Logic
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      // Stage
      if (activeStageFilter !== "ALL") {
        if (activeStageFilter === "RESOLVED") {
          if (iss.status !== "RESOLVED" && iss.status !== "RECHECKED") return false;
        } else if (iss.status !== activeStageFilter) {
          return false;
        }
      }

      // Type
      if (typeFilter !== "ALL" && iss.issue_type !== typeFilter) {
        return false;
      }

      // Priority
      if (priorityFilter === "CRITICAL" && iss.priority_score < 80) return false;
      if (priorityFilter === "HIGH" && (iss.priority_score < 60 || iss.priority_score >= 80)) return false;
      if (priorityFilter === "MEDIUM" && iss.priority_score >= 60) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const codeMatch = (iss.issue_code || "").toLowerCase().includes(q);
        const locMatch = (iss.location_name || "").toLowerCase().includes(q);
        const typeMatch = (iss.issue_type || "").toLowerCase().includes(q);
        if (!codeMatch && !locMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [issues, activeStageFilter, typeFilter, priorityFilter, searchTerm]);

  const getIssuesForStage = (stageKey) => {
    return filteredIssues.filter((i) => {
      if (stageKey === "RESOLVED") {
        return i.status === "RESOLVED" || i.status === "RECHECKED";
      }
      return i.status === stageKey;
    });
  };

  return (
    <div className="p-5 sm:p-6 space-y-5 animate-fadeIn max-w-[1600px] mx-auto">
      {/* 1. Header & Summary Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B3C74]">
              <Wrench className="w-5 h-5 text-[#0B3C74]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B3C74] tracking-tight flex items-center gap-2">
                Authority Maintenance Action &amp; Lifecycle Pipeline
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Central municipal work-order lifecycle: Edge AI Detection → Multi-Bus Verification → Prioritization → PWD Action → Bus Fleet Recheck
              </p>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Pill Box */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Work Orders</span>
            <span className="text-base font-bold font-mono text-slate-900">{metrics.total} Orders</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-lg px-3.5 py-2 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Multi-Bus Verified</span>
            <span className="text-base font-bold font-mono text-blue-900">{metrics.verified} Ready</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-3.5 py-2 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Critical (Sev ≥ 80)</span>
            <span className="text-base font-bold font-mono text-amber-900">{metrics.critical} Urgent</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg px-3.5 py-2 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Rechecked &amp; Resolved</span>
            <span className="text-base font-bold font-mono text-emerald-900">{metrics.resolved} Closed</span>
          </div>

          <button
            onClick={refreshData}
            title="Refresh Registry Data"
            className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs hover:border-slate-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Lifecycle Process Progression Stepper */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0B3C74]" />
            Workflow Progression Funnel (Click stage to focus)
          </span>
          <button
            onClick={() => setActiveStageFilter("ALL")}
            className={`text-xs px-2.5 py-1 rounded font-semibold transition ${
              activeStageFilter === "ALL"
                ? "bg-[#0B3C74] text-white"
                : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
            }`}
          >
            Show All Stages ({metrics.total})
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAGES.map((stg, idx) => {
            const count = issues.filter((i) =>
              stg.key === "RESOLVED"
                ? i.status === "RESOLVED" || i.status === "RECHECKED"
                : i.status === stg.key
            ).length;
            const isSelected = activeStageFilter === stg.key;

            return (
              <button
                key={stg.key}
                onClick={() => setActiveStageFilter(isSelected ? "ALL" : stg.key)}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? "border-[#0B3C74] bg-blue-50/70 ring-2 ring-[#0B3C74]/20 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold ${stg.color}`}>{stg.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${stg.badgeBg}`}>
                    {count}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 line-clamp-1">{stg.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Controls, Search, and Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Work Order ID, road, or ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
            />
          </div>

          {/* Defect Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Defect Types</option>
            <option value="POTHOLE">Potholes</option>
            <option value="WATERLOGGING">Waterlogging</option>
            <option value="DAMAGED_ROAD">Damaged Road</option>
            <option value="MISSING_DIVIDER">Missing Dividers</option>
            <option value="DAMAGED_SIGNBOARD">Damaged Signboards</option>
          </select>

          {/* Priority Score Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Priority Levels</option>
            <option value="CRITICAL">Critical Priority (≥ 80)</option>
            <option value="HIGH">High Priority (60 - 79)</option>
            <option value="MEDIUM">Medium / Low (&lt; 60)</option>
          </select>
        </div>

        {/* View Switcher: Board vs List */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === "board"
                ? "bg-white text-[#0B3C74] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-white text-[#0B3C74] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Registry Table ({filteredIssues.length})</span>
          </button>
        </div>
      </div>

      {/* 4. VIEW MODE: KANBAN BOARD */}
      {viewMode === "board" && (
        <div className="overflow-x-auto pb-4 pt-1">
          <div className="flex gap-4 items-start min-w-[1250px]">
            {STAGES.filter((stage) => activeStageFilter === "ALL" || activeStageFilter === stage.key).map((stage) => {
              const stageIssues = getIssuesForStage(stage.key);

              return (
                <div
                  key={stage.key}
                  className="flex-1 min-w-[280px] bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 flex flex-col min-h-[580px] shadow-2xs"
                >
                  {/* Column Header */}
                  <div className={`flex items-center justify-between p-2.5 rounded-lg mb-3 border ${stage.border} ${stage.bg}`}>
                    <div>
                      <span className={`text-xs font-bold block ${stage.color}`}>{stage.label}</span>
                      <span className="text-[10px] text-slate-600 font-medium">{stage.sub}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shadow-2xs ${stage.badgeBg}`}>
                      {stageIssues.length}
                    </span>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {stageIssues.map((iss) => (
                      <div
                        key={iss.id}
                        onClick={() => setSelectedIssue(iss)}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#0B3C74] hover:shadow-md transition-all cursor-pointer space-y-2.5 group relative"
                      >
                        {/* Top Card Line: Issue Code + Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-[#0B3C74] tracking-tight">
                            {iss.issue_code}
                          </span>
                          <PriorityBadge score={iss.priority_score} level={iss.priority_level} />
                        </div>

                        {/* Defect Preview & Type */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-900 relative shadow-2xs">
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
                            <p className="text-xs font-bold text-slate-800 tracking-tight truncate">
                              {iss.issue_type.replace(/_/g, " ")}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-start gap-1 line-clamp-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span>{iss.location_name}</span>
                            </p>
                          </div>
                        </div>

                        {/* Verification & Sensor Telemetry Chips */}
                        <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                            <Bus className="w-2.5 h-2.5 text-blue-600" />
                            {iss.confirmations_count} Buses Verified
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Sev: <strong>{iss.severity}/10</strong>
                          </span>
                          {iss.speed_kmh && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {iss.speed_kmh} km/h
                            </span>
                          )}
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 text-[10px]">
                            {iss.created_at ? new Date(iss.created_at).toLocaleDateString() : "Active Docket"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssue(iss);
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-[#0B3C74] group-hover:text-blue-600 transition"
                          >
                            <span>Inspect Docket</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {stageIssues.length === 0 && (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-xl bg-white/70 p-4 text-center">
                        <CheckCircle2 className="w-6 h-6 text-slate-300 mb-1" />
                        <span>No work orders in stage</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VIEW MODE: REGISTRY TABLE */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Work Order ID</th>
                  <th className="py-3 px-4">Stage / Status</th>
                  <th className="py-3 px-4">Defect Classification</th>
                  <th className="py-3 px-4">Location / Corridor</th>
                  <th className="py-3 px-4">Fleet Verification</th>
                  <th className="py-3 px-4">Priority Score</th>
                  <th className="py-3 px-4 text-right">Municipal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((iss) => (
                  <tr
                    key={iss.id}
                    onClick={() => setSelectedIssue(iss)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {iss.issue_code}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={iss.status} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {iss.issue_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1 text-slate-600 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{iss.location_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                        <Bus className="w-3 h-3 text-blue-600" />
                        {iss.confirmations_count} Buses
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge score={iss.priority_score} level={iss.priority_level} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(iss);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#0B3C74] hover:bg-[#072850] text-white text-[11px] font-semibold transition shadow-2xs"
                      >
                        <span>Audit Docket</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                      No municipal work orders found matching your search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

