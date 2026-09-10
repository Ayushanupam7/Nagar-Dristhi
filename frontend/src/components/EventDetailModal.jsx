import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Bus,
  ShieldCheck,
  Wrench,
  Clock,
  ArrowRight,
  ExternalLink,
  MapPin,
  Car,
  ShieldAlert,
  Camera,
  Maximize2
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { api } from "../services/api";
import { getDetectionEvidenceImage, isVideoUrl } from "../utils/evidence";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

export default function EventDetailModal() {
  const { selectedIssue, setSelectedIssue, addToast, refreshData } = useFleet();
  const [isAssigning, setIsAssigning] = useState(false);
  const [contractorName, setContractorName] = useState("Pune Infrastructure Works Ltd");
  const [assignNotes, setAssignNotes] = useState("Urgent hot-mix asphalt patching required");
  const [actionLoading, setActionLoading] = useState(false);
  const [evidencePreviewOpen, setEvidencePreviewOpen] = useState(false);

  if (!selectedIssue) return null;

  const handleAssign = async () => {
    setActionLoading(true);
    try {
      await api.assignIssue(selectedIssue.id, {
        assigned_contractor: contractorName,
        assigned_officer: "Authority Officer (Zone 4)",
        notes: assignNotes
      });
      addToast(`Issue ${selectedIssue.issue_code} successfully assigned to ${contractorName}!`, "success");
      setIsAssigning(false);
      refreshData();
      const updated = await api.getIssue(selectedIssue.id);
      setSelectedIssue(updated);
    } catch (err) {
      addToast("Failed to assign issue: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkRepaired = async () => {
    setActionLoading(true);
    try {
      await api.updateIssueStatus(selectedIssue.id, {
        status: "REPAIRED",
        action_by: "Contractor Portal",
        comment: "Road repair completed. Ready for automated fleet recheck pass."
      });
      addToast(`Issue ${selectedIssue.issue_code} marked as REPAIRED!`, "info");
      refreshData();
      const updated = await api.getIssue(selectedIssue.id);
      setSelectedIssue(updated);
    } catch (err) {
      addToast("Failed to mark repaired: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecheck = async (busId = 1) => {
    setActionLoading(true);
    try {
      const res = await api.simulateRecheck(selectedIssue.id, busId);
      addToast(
        `Automated Recheck Pass Completed! Defect Severity reduced to ${res.recheck_severity}/10. Status: ${res.new_status}`,
        "success"
      );
      refreshData();
      const updated = await api.getIssue(selectedIssue.id);
      setSelectedIssue(updated);
    } catch (err) {
      addToast("Failed to perform recheck: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const factors = selectedIssue.priority_factors || {};

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-[#0B3C74] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {selectedIssue.issue_code}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {selectedIssue.issue_type.replace(/_/g, " ")}
                <StatusBadge status={selectedIssue.status} />
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedIssue.location_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PriorityBadge score={selectedIssue.priority_score} level={selectedIssue.priority_level} />
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Combined Confidence</span>
              <p className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                {Math.round((selectedIssue.combined_confidence || 0.8) * 100)}%
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Defect Severity</span>
              <p className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                {selectedIssue.severity} / 10
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Traffic Volume</span>
              <p className="text-lg font-bold text-blue-700 font-mono mt-0.5">
                {selectedIssue.traffic_level || "HIGH"}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Confirming Buses</span>
              <p className="text-lg font-bold text-purple-700 font-mono mt-0.5">
                {selectedIssue.confirmations_count} Independent
              </p>
            </div>
          </div>

          {/* HERO SECTION: Multi-Bus Verification Panel */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0B3C74]" />
                <h3 className="text-sm font-bold text-[#0B3C74]">Multi-Bus Verification Audit</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-[#0B3C74] border border-blue-300 font-bold">
                {selectedIssue.confirmations_count >= 2 ? `CONFIRMED BY ${selectedIssue.confirmations_count} BUSES` : "AWAITING SECOND BUS"}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Independent transit buses passing this GPS coordinate cross-verify the defect, filtering false positives and elevating combined statistical confidence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {(selectedIssue.confirmations || []).length > 0 ? (
                selectedIssue.confirmations.map((conf, idx) => (
                  <div key={conf.id || idx} className="bg-white border border-blue-200 p-2.5 rounded-lg flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-[#0B3C74]" />
                      <div>
                        <p className="font-mono font-bold text-slate-900">{conf.bus_id}</p>
                        <p className="text-[10px] text-slate-500">Δ {conf.distance_meters || 0}m offset</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">
                      {Math.round((conf.confidence || 0.8) * 100)}% ✓
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-2 text-slate-500">
                  Initial detection by {selectedIssue.first_bus_id}
                </div>
              )}
            </div>
          </div>

          {/* Transparent AI Priority Scoring Decomposition */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Transparent Priority Scoring Model ({Math.round(selectedIssue.priority_score)} / 100)
              </h3>
              <span className="font-mono text-xs text-slate-500">Official Weight Formula</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>AI Detection Confidence (25% Weight)</span>
                  <span className="font-mono font-bold text-slate-900">{factors.confidence || 23.5} / 25</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${((factors.confidence || 23.5) / 25) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Defect Severity Magnitude (25% Weight)</span>
                  <span className="font-mono font-bold text-slate-900">{factors.severity || 22.0} / 25</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: `${((factors.severity || 22.0) / 25) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Corridor Traffic Density (20% Weight)</span>
                  <span className="font-mono font-bold text-slate-900">{factors.traffic || 17.0} / 20</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${((factors.traffic || 17.0) / 20) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Pedestrian / Two-Wheeler Safety Risk (15% Weight)</span>
                  <span className="font-mono font-bold text-slate-900">{factors.safety || 14.5} / 15</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${((factors.safety || 14.5) / 15) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Multi-Bus Independent Confirmations (15% Weight)</span>
                  <span className="font-mono font-bold text-slate-900">{factors.verification || 15.0} / 15</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${((factors.verification || 15.0) / 15) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Evidence (Before vs After) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-[#0B3C74]" />
                  Detection Evidence (Before)
                </span>
                <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {selectedIssue.first_bus_id || selectedIssue.first_bus || "PMPML Transit Bus"}
                </span>
              </div>
              <div
                onClick={() => setEvidencePreviewOpen(true)}
                className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-slate-900 group cursor-pointer shadow-xs"
                title="Click to view full-resolution detection evidence"
              >
                {(() => {
                  const evSrc = getDetectionEvidenceImage(selectedIssue);
                  return isVideoUrl(evSrc) ? (
                    <video
                      src={evSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={evSrc}
                      alt={`Detection Evidence - ${selectedIssue.issue_type}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/evidence_pothole.jpg";
                      }}
                    />
                  );
                })()}

                {/* Defect Severity Badge */}
                <div className="absolute top-2 left-2 bg-rose-900/90 backdrop-blur-xs border border-rose-500/40 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                  <span>SEVERITY:</span>
                  <span className="text-amber-300">{selectedIssue.severity}/10</span>
                </div>

                {/* AI Detection Confidence Tag */}
                <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-xs border border-slate-700 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                  AI CONF: {Math.round((selectedIssue.combined_confidence || selectedIssue.confidence || 0.88) * 100)}%
                </div>

                {/* Bottom Overlay Label */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-4 flex items-end justify-between">
                  <div>
                    <p className="text-white text-[11px] font-bold tracking-tight">
                      {selectedIssue.issue_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-slate-300 text-[9px] font-mono">
                      Public Dashcam Evidence • GPS Tagged
                    </p>
                  </div>
                  <span className="text-[9px] text-white/90 bg-white/20 group-hover:bg-white/30 backdrop-blur-xs px-2 py-0.5 rounded transition font-medium flex items-center gap-1">
                    <Maximize2 className="w-2.5 h-2.5" />
                    Expand
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Recheck Evidence (After Repair)
              </span>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center">
                {selectedIssue.after_evidence_url ? (
                  <>
                    {isVideoUrl(selectedIssue.after_evidence_url) ? (
                      <video
                        src={selectedIssue.after_evidence_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={selectedIssue.after_evidence_url}
                        alt="Defect After"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 bg-emerald-900/90 backdrop-blur-xs border border-emerald-500/40 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                      RECHECK: {selectedIssue.recheck_severity || 1}/10
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-slate-600 text-xs font-semibold">
                      Awaiting Scheduled Fleet Recheck
                    </p>
                    <p className="text-slate-400 text-[10px] max-w-[200px] mx-auto">
                      Automated bus pass will capture after-repair proof once contractor completes work.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Official Audit &amp; Maintenance Trail
            </h4>
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
              {(selectedIssue.history || []).map((h) => (
                <div key={h.id} className="flex items-start gap-2.5 text-[11px] pb-1.5 border-b border-slate-200 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-[#0B3C74] mt-1 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">{h.to_status}</span>
                    <span className="text-slate-500 ml-1.5 font-mono text-[10px]">by {h.action_by}</span>
                    <p className="text-slate-600 text-[10px] mt-0.5">{h.comment}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Contractor Subview */}
          {isAssigning && (
            <div className="p-4 bg-slate-50 border border-blue-300 rounded-xl space-y-3">
              <h4 className="font-bold text-[#0B3C74] text-xs flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0B3C74]" />
                Dispatch Official Work Order to Contractor
              </h4>
              <div>
                <label className="text-[10px] text-slate-600 block mb-1 font-semibold">Contractor Name</label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded p-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block mb-1 font-semibold">Repair Directives</label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded p-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsAssigning(false)}
                  className="px-3 py-1.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded bg-[#0B3C74] hover:bg-[#072850] text-white font-semibold text-xs transition"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-semibold">GPS Coordinates:</span>
            <code className="text-xs font-mono font-bold text-slate-800">
              {selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}
            </code>
          </div>

          <div className="flex items-center gap-2">
            {selectedIssue.status !== "RESOLVED" && selectedIssue.status !== "ASSIGNED" && selectedIssue.status !== "REPAIRED" && (
              <button
                onClick={() => setIsAssigning(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B3C74] hover:bg-[#082b52] text-white text-xs font-semibold transition shadow-sm"
              >
                <Wrench className="w-3.5 h-3.5" />
                Assign Work Order
              </button>
            )}

            {selectedIssue.status === "ASSIGNED" && (
              <button
                onClick={handleMarkRepaired}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Repaired
              </button>
            )}

            {(selectedIssue.status === "REPAIRED" || selectedIssue.status === "RECHECKED") && (
              <button
                onClick={() => handleRecheck(1)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold transition shadow-sm"
              >
                <Bus className="w-3.5 h-3.5" />
                Simulate Bus Recheck Pass
              </button>
            )}

            <button
              onClick={() => setSelectedIssue(null)}
              className="px-4 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition border border-slate-300"
            >
              Close Record
            </button>
          </div>
        </div>
      </div>

      {/* Expanded High-Resolution Detection Evidence Lightbox Modal */}
      {evidencePreviewOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setEvidencePreviewOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden text-white animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Detection Evidence (Before) • {selectedIssue.issue_code}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Defect Category: <strong className="text-amber-300">{selectedIssue.issue_type.replace(/_/g, " ")}</strong> • Captured by {selectedIssue.first_bus_id || selectedIssue.first_bus || "PMPML Transit Bus"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEvidencePreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-res Image Container */}
            <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
              {(() => {
                const evSrc = getDetectionEvidenceImage(selectedIssue);
                return isVideoUrl(evSrc) ? (
                  <video
                    src={evSrc}
                    autoPlay
                    loop
                    controls
                    playsInline
                    className="w-full h-auto max-h-[65vh] object-contain"
                  />
                ) : (
                  <img
                    src={evSrc}
                    alt={`Evidence ${selectedIssue.issue_code}`}
                    className="w-full h-auto max-h-[65vh] object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/evidence_pothole.jpg";
                    }}
                  />
                );
              })()}

              {/* HUD Sensor Tag */}
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md border border-white/20 p-2.5 rounded-lg space-y-1 text-[11px] font-mono shadow-lg">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  YOLOv8 EDGE INFERENCE
                </div>
                <div className="text-slate-300">
                  Target: <strong className="text-white">{selectedIssue.issue_type}</strong>
                </div>
                <div className="text-slate-300">
                  Confidence: <strong className="text-emerald-300">{Math.round((selectedIssue.combined_confidence || 0.88) * 100)}%</strong>
                </div>
                <div className="text-slate-300">
                  Severity Rating: <strong className="text-rose-400">{selectedIssue.severity}/10</strong>
                </div>
              </div>

              {/* HUD Geolocation Tag */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md border border-white/20 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] shadow-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">{selectedIssue.location_name}</span>
                </div>
                <div className="font-mono text-slate-300 text-[10px]">
                  GPS: {selectedIssue.latitude.toFixed(5)}, {selectedIssue.longitude.toFixed(5)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 px-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>NAGAR DRISHTI Autonomous Municipal AI Surveillance Infrastructure</span>
              <button
                onClick={() => setEvidencePreviewOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
