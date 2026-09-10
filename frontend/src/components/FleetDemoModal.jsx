import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Bus,
  ShieldCheck,
  Wrench,
  X,
  Layers,
  ArrowRight
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { api } from "../services/api";

const DEMO_STEPS = [
  { id: 1, title: "Bus MH 19 6996 Dispatched on Route 101", desc: "Edge AI dashcam initializes spatial detection models at 28.5 FPS." },
  { id: 2, title: "Bus MH 19 6996 Detects Severe Pothole (JM Road)", desc: "Lat 18.5304, Lng 73.8467. Confidence 84%, Severity 8/10. Event logged to edge buffer." },
  { id: 3, title: "Central Backend Clusters Observation", desc: "Spatial engine matches 50m radius window; status initialized to DETECTED." },
  { id: 4, title: "Duplicate Filter Blocks Bus MH 19 6996", desc: "Same bus pass within 2 hours filtered out to prevent artificial single-sensor inflation." },
  { id: 5, title: "Bus MH 19 7421 Independent Confirmation Pass", desc: "Route 204 bus passes coordinate. Bayesian verification elevates combined confidence to 94%." },
  { id: 6, title: "Issue Promoted to VERIFIED", desc: "Multi-bus threshold satisfied. Issue marked as verified ground truth on municipal GIS map." },
  { id: 7, title: "Explainable Priority Engine Calculates 88/100", desc: "Factors applied: Severity 22/25, Traffic 17/20, Safety 14.5/15, Multi-Bus 15/15." },
  { id: 8, title: "Contractor Dispatched via Work Order", desc: "Assigned to Pune Infrastructure Works Ltd for hot-mix asphalt patching." },
  { id: 9, title: "Contractor Completes Field Repair", desc: "Status updated to REPAIRED. Coordinates flagged for automated municipal fleet verification pass." },
  { id: 10, title: "Bus MH 19 8134 Executes Automated Recheck Pass", desc: "Regular transit bus scans repaired road patch. AI evaluates residual severity at 1/10." },
  { id: 11, title: "Autonomous System Resolution", desc: "Because residual severity is <= 2/10, issue is automatically promoted to RESOLVED without manual inspection." },
  { id: 12, title: "Audit Trail & SLA Recorded", desc: "Mean Time to Detect: 18m, Mean Time to Verify: 32m, Total Resolution Cycle: 14.2 hours." },
];

export default function FleetDemoModal() {
  const { isFleetDemoModalOpen, setIsFleetDemoModalOpen, refreshData, addToast } = useFleet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepLogs, setStepLogs] = useState([]);

  useEffect(() => {
    let timer;
    if (isPlaying && currentStep <= 12) {
      timer = setTimeout(() => {
        executeStep(currentStep);
      }, 3500);
    } else if (currentStep > 12) {
      setIsPlaying(false);
      addToast("Fleet AI Demonstration Scenario Successfully Completed!", "success");
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  if (!isFleetDemoModalOpen) return null;

  const executeStep = async (stepNum) => {
    setLoading(true);
    try {
      const res = await api.runDemoStep(stepNum);
      const logEntry = {
        step: stepNum,
        time: new Date().toLocaleTimeString(),
        title: DEMO_STEPS[stepNum - 1]?.title || `Step ${stepNum}`,
        description: res.description || DEMO_STEPS[stepNum - 1]?.desc,
        status: res.status || "OK",
      };
      setStepLogs((prev) => [logEntry, ...prev.slice(0, 15)]);
      refreshData();
      setCurrentStep((prev) => prev + 1);
    } catch (err) {
      console.warn("Sim step error (using mock fallback):", err);
      const logEntry = {
        step: stepNum,
        time: new Date().toLocaleTimeString(),
        title: DEMO_STEPS[stepNum - 1]?.title,
        description: DEMO_STEPS[stepNum - 1]?.desc,
        status: "MOCK_SUCCESS",
      };
      setStepLogs((prev) => [logEntry, ...prev.slice(0, 15)]);
      refreshData();
      setCurrentStep((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setIsPlaying(false);
    setCurrentStep(1);
    setStepLogs([]);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="dark-banner flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-[#0B3C74] text-white">
          <div className="flex items-center gap-3">
            {/* <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div> */}
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-base font-bold !text-white tracking-tight"
                  style={{ color: "#FFFFFF" }}
                >
                  Fleet Urban Intelligence Live Lifecycle Demonstration
                </h2>
                <span
                  className="bg-amber-400 font-bold text-[10px] font-mono px-2 py-0.5 rounded shadow-xs"
                  style={{ color: "#020617" }}
                >
                  12-Step Lifecycle
                </span>
              </div>
              <p className="text-xs text-blue-100/90" style={{ color: "#E0E7FF" }}>
                End-to-End Simulation: Edge AI Detection → Multi-Bus Verification → Authority Assignment → Fleet Recheck
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFleetDemoModalOpen(false)}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition shadow-sm ${isPlaying
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-[#0B3C74] hover:bg-[#072850] text-white"
                }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? "Pause Auto-Run" : "Auto-Run Presentation"}</span>
            </button>

            <button
              onClick={() => executeStep(currentStep)}
              disabled={isPlaying || currentStep > 12 || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition disabled:opacity-50 shadow-2xs"
            >
              <span>Next Step ({currentStep <= 12 ? currentStep : 12}/12)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 text-xs transition shadow-2xs font-medium"
              title="Reset Demo to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Progress: <strong className="text-[#0B3C74] font-bold">{Math.min(currentStep, 12)} / 12 Steps</strong>
          </div>
        </div>

        {/* Content: Split Stepper Timeline and Live Console */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Stepper Timeline (Left 7 Cols) */}
          <div className="md:col-span-7 p-5 overflow-y-auto border-r border-slate-200 space-y-2 bg-slate-50/50">
            <h3 className="text-xs font-mono uppercase text-slate-500 font-bold mb-3">
              12-Step Lifecycle Progression
            </h3>

            <div className="space-y-2">
              {DEMO_STEPS.map((s) => {
                const isDone = currentStep > s.id;
                const isCurrent = currentStep === s.id;

                let cardStyle = "border-slate-200 bg-white text-slate-600";
                if (isCurrent) {
                  cardStyle = "border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-400";
                } else if (isDone) {
                  cardStyle = "border-emerald-200 bg-emerald-50/60 text-emerald-900";
                }

                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all shadow-2xs ${cardStyle}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 mt-0.5 ${isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                          ? "bg-[#0B3C74] text-white animate-pulse"
                          : "bg-slate-200 text-slate-600"
                        }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${isCurrent ? "text-blue-950" : "text-slate-800"}`}>
                          {s.title}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Action Console Log (Right 5 Cols) */}
          <div className="md:col-span-5 p-5 flex flex-col justify-between bg-slate-900 text-slate-100 overflow-hidden">
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Execution Log
                </h3>
                <span className="text-[10px] font-mono text-slate-400">FastAPI &amp; AI Telemetry</span>
              </div>

              <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800 overflow-y-auto space-y-2.5 font-mono text-[11px]">
                {stepLogs.length > 0 ? (
                  stepLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-blue-400 font-bold">STEP {log.step}: {log.title}</span>
                        <span className="text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-slate-300 text-[10px] leading-relaxed font-sans">{log.description}</p>
                      <div className="text-[9px] text-emerald-400">STATE: {log.status}</div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                    <p>Click "Auto-Run Presentation" or "Next Step" to start live demonstration.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Footnote */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <p>
                <strong className="text-white">Platform Core Innovation:</strong> Distinct bus confirmations transform raw edge camera alerts into reliable, high-confidence municipal work orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
