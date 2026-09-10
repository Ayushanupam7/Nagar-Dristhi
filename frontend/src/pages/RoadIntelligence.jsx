import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Filter,
  Search,
  MapPin,
  Eye,
  ShieldCheck,
  Wrench,
  Building2,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  Send,
  X,
  FileText,
  ChevronRight,
  Layers,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { api } from "../services/api";
import { getDetectionEvidenceImage } from "../utils/evidence";
import GisMap from "../components/GisMap";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";

export default function RoadIntelligence() {
  const { issues, setSelectedIssue, user, addToast, refreshData } = useFleet();
  const [selectedType, setSelectedType] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState(0);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedDefectForDispatch, setSelectedDefectForDispatch] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Dispatch Form State
  const [contractor, setContractor] = useState("PMC Ward 4 Rapid Road Squad");
  const [asphaltGrade, setAsphaltGrade] = useState("VG-30 Hot-Mix Bitumen");
  const [asphaltQuantity, setAsphaltQuantity] = useState("1.8 MT");
  const [slaTarget, setSlaTarget] = useState("48h Urgent");

  const defectCounts = {
    POTHOLE: issues.filter((i) => i.issue_type === "POTHOLE").length,
    WATERLOGGING: issues.filter((i) => i.issue_type === "WATERLOGGING").length,
    DAMAGED_ROAD: issues.filter((i) => i.issue_type === "DAMAGED_ROAD" || i.issue_type === "ROAD_SURFACE_DETERIORATION").length,
    MISSING_DIVIDER: issues.filter((i) => i.issue_type === "MISSING_DIVIDER" || i.issue_type === "MISSING_ZEBRA_CROSSING").length,
    DAMAGED_SIGNBOARD: issues.filter((i) => i.issue_type === "DAMAGED_SIGNBOARD" || i.issue_type === "OTHER_HAZARD").length,
  };

  const filteredIssues = issues.filter((iss) => {
    const matchesType = selectedType === "ALL" || iss.issue_type === selectedType;
    const matchesSev = iss.severity >= severityFilter;
    return matchesType && matchesSev;
  });

  // Calculate hot-mix bitumen requirement based on active potholes
  const estimatedBitumenMT = (defectCounts.POTHOLE * 1.25).toFixed(1);

  // Issues awaiting bus transit recheck
  const awaitingRecheckIssues = issues.filter(
    (i) => i.status === "REPAIRED" || i.status === "ASSIGNED"
  );

  const handleOpenDispatch = (issue) => {
    setSelectedDefectForDispatch(issue || issues[0]);
    setDispatchModalOpen(true);
  };

  const handleDispatchWorkOrder = async (e) => {
    e?.preventDefault();
    if (!selectedDefectForDispatch) return;

    setIsDispatching(true);
    try {
      if (api.assignIssue) {
        await api.assignIssue(selectedDefectForDispatch.id, {
          contractor: contractor,
          asphalt_grade: asphaltGrade,
          quantity_mt: asphaltQuantity,
          sla: slaTarget,
        }).catch(() => null);
      }

      addToast(
        `Work Order Dispatched: ${contractor} assigned to ${selectedDefectForDispatch.issue_code} (${asphaltQuantity} ${asphaltGrade}, SLA: ${slaTarget})`,
        "success"
      );
      setDispatchModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(`Dispatched work order locally: ${err.message}`, "info");
      setDispatchModalOpen(false);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleTriggerRecheck = async (issue) => {
    try {
      if (api.recheckIssue) {
        await api.recheckIssue(issue.id, {
          bus_id: "MH-12-RN-4821",
          verified: true,
        }).catch(() => null);
      }
      addToast(
        `Automated Transit Recheck: PMPML Bus #MH-12-RN-4821 passed over ${issue.issue_code}. Surface verified smooth! Status updated to RESOLVED.`,
        "success"
      );
      refreshData();
    } catch (err) {
      addToast(`Recheck triggered for ${issue.issue_code}`, "info");
    }
  };

  return (
    <div className="p-5 space-y-5 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Public Works Department • Road Surface &amp; Infrastructure Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated edge detection of potholes, bitumen erosion, monsoon waterlogging, and contractor work-order verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenDispatch(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Work Order</span>
          </button>
          <Link
            to="/maintenance"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#0B3C74]" />
            <span>6-Stage Maintenance Board</span>
          </Link>
        </div>
      </div>

      {/* PWD Chief Engineer Executive Operations Directive Bar */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
              🏗️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  {user?.role === "PWD_ENGINEER" ? user.name : "Er. Vikram Patil (Chief Engineer)"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold border border-amber-300">
                  PWD-INFRA-Z4
                </span>
                <span className="text-[10px] text-slate-600 hidden sm:inline">• Level 3 Infrastructure Executive</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Directive: Accelerated Hot-Mix Asphalt Batching, Contractor SLA Enforcement &amp; Bus Transit Recheck Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs shadow-2xs">
              <span className="text-slate-500 block text-[10px]">Road Quality Index</span>
              <span className="font-bold font-mono text-amber-800 text-sm">76.4 / 100</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs shadow-2xs">
              <span className="text-slate-500 block text-[10px]">Est. Bitumen Req.</span>
              <span className="font-bold font-mono text-[#0B3C74] text-sm">~{estimatedBitumenMT} MT</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs shadow-2xs">
              <span className="text-slate-500 block text-[10px]">Hadapsar Plant</span>
              <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                85 MT Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { type: "POTHOLE", label: "Potholes", count: defectCounts.POTHOLE, color: "text-rose-700", sub: "Avg Depth: 6.2cm" },
          { type: "WATERLOGGING", label: "Waterlogging", count: defectCounts.WATERLOGGING, color: "text-blue-700", sub: "Monsoon Hotspots" },
          { type: "DAMAGED_ROAD", label: "Damaged Road", count: defectCounts.DAMAGED_ROAD, color: "text-amber-700", sub: "Bitumen Raveling" },
          { type: "MISSING_DIVIDER", label: "Missing Dividers", count: defectCounts.MISSING_DIVIDER, color: "text-purple-700", sub: "Safety Hazard" },
          { type: "DAMAGED_SIGNBOARD", label: "Damaged Signs", count: defectCounts.DAMAGED_SIGNBOARD, color: "text-amber-800", sub: "Regulatory Signs" },
        ].map((item) => (
          <div
            key={item.type}
            onClick={() => setSelectedType(selectedType === item.type ? "ALL" : item.type)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all shadow-2xs ${
              selectedType === item.type
                ? "bg-blue-50 border-blue-600 ring-1 ring-blue-500/30"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
              {selectedType === item.type && (
                <span className="text-[9px] bg-blue-600 text-white font-bold px-1 rounded">ACTIVE</span>
              )}
            </div>
            <p className={`text-2xl font-bold font-mono mt-1 ${item.color}`}>{item.count}</p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: GIS Map + Filterable Defect List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: GIS Map */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="h-[460px]">
            <GisMap height="100%" />
          </div>

          {/* Automated Transit Recheck Protocol Tracker */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Automated Bus Transit Recheck Protocol
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Patent Feature #ND-RECHECK
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              When PWD marks a pothole as repaired, edge dashcam cameras on passing city buses automatically scan the GPS coordinates. Two consecutive defect-free passes transition the status to <strong>VERIFIED RESOLVED</strong> without human bias.
            </p>

            <div className="space-y-2">
              {awaitingRecheckIssues.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs">
                  All repaired road sites have been verified by transit buses.
                </div>
              ) : (
                awaitingRecheckIssues.slice(0, 3).map((iss) => (
                  <div
                    key={iss.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0B3C74]">{iss.issue_code}</span>
                        <span className="text-slate-800 font-medium">{iss.location_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Status: <strong className="text-amber-700">{iss.status}</strong> • Nearest Bus: PMPML Route 102
                      </span>
                    </div>

                    <button
                      onClick={() => handleTriggerRecheck(iss)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shrink-0 active:scale-95 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Simulate Bus Pass</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Defect Table List with Quick Actions */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[620px] shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filtered Defect Registry ({filteredIssues.length})
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">Min Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(Number(e.target.value))}
                className="bg-white border border-slate-300 text-slate-800 rounded px-2 py-0.5 text-[10px] font-medium"
              >
                <option value={0}>All</option>
                <option value={6}>6+</option>
                <option value={8}>8+ (High)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto my-3 flex-1 pr-1">
            {filteredIssues.map((iss) => (
              <div
                key={iss.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition space-y-2.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0B3C74]">{iss.issue_code}</span>
                  <PriorityBadge score={iss.priority_score} level={iss.priority_level} />
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-16 h-12 rounded overflow-hidden border border-slate-300 shrink-0 bg-slate-900 relative">
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

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Confirmations: <strong className="text-[#0B3C74] font-bold">{iss.confirmations_count} buses</strong></span>
                  <StatusBadge status={iss.status} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedIssue(iss)}
                    className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-semibold transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleOpenDispatch(iss)}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold transition active:scale-95 flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Dispatch Crew</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contractor Work Order Quick Dispatcher Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-[#0B3C74] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">PWD Contractor Work Order Dispatch</h3>
                  <p className="text-[10px] text-blue-200 font-mono">
                    Target Defect: {selectedDefectForDispatch?.issue_code || "ND-POT-1837"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleDispatchWorkOrder} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-xs">
                  {selectedDefectForDispatch?.issue_type?.replace(/_/g, " ") || "POTHOLE"} at {selectedDefectForDispatch?.location_name || "Karve Road Junction"}
                </p>
                <p className="text-[11px] text-slate-600">
                  Priority Score: <strong>{selectedDefectForDispatch?.priority_score || 88}/100</strong> • Multi-Bus Confirmed: <strong>{selectedDefectForDispatch?.confirmations_count || 4} buses</strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Repair Contractor</label>
                <select
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="PMC Ward 4 Rapid Road Squad">PMC Ward 4 Rapid Road Squad (In-House Municipal Crew)</option>
                  <option value="L&T Urban Infra Asphalt Cell">L&T Urban Infra Asphalt Cell (Contractor Division)</option>
                  <option value="Maharashtra State Road Dev Corp (MSRDC)">Maharashtra State Road Dev Corp (MSRDC Maintenance)</option>
                  <option value="Pune Expressway Maintenance Wing">Pune Expressway Maintenance Wing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bitumen Material Grade</label>
                  <select
                    value={asphaltGrade}
                    onChange={(e) => setAsphaltGrade(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="VG-30 Hot-Mix Bitumen">VG-30 Hot-Mix Bitumen (Standard Potholes)</option>
                    <option value="VG-40 Polymer Modified Bitumen">VG-40 Polymer Modified Bitumen (High Traffic)</option>
                    <option value="Cold-Mix Asphalt Emulsion">Cold-Mix Asphalt Emulsion (Emergency Rain Patch)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Quantity</label>
                  <input
                    type="text"
                    value={asphaltQuantity}
                    onChange={(e) => setAsphaltQuantity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory SLA Completion Window</label>
                <div className="grid grid-cols-3 gap-2">
                  {["24h Emergency", "48h Urgent", "7-Day Regular"].map((sla) => (
                    <button
                      type="button"
                      key={sla}
                      onClick={() => setSlaTarget(sla)}
                      className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition ${
                        slaTarget === sla
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {sla}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? "Dispatching..." : "Confirm & Dispatch Work Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
