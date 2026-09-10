import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Bus, AlertTriangle, Activity, CheckCircle2, Lock,
  ArrowRight, TrendingUp, Clock, Eye, Cpu, Layers, MapPin,
  Building2, Users, BarChart3, Zap, Globe, Map, Radio,
  ChevronRight, Sparkles, Camera, Wifi, Database, GitMerge,
  AreaChart, PieChart, Gauge, Navigation, Star, Award, Target,
  Info, ExternalLink, Filter, AlertCircle, Wrench
} from "lucide-react";
import OnePageHeader from "../components/OnePageHeader";
import { useFleet } from "../context/FleetContext";
import { getDetectionEvidenceImage } from "../utils/evidence";

/* ── Isolated Live Counter Component (prevents re-rendering whole page) ── */
const CounterValue = React.memo(function CounterValue({ target, duration = 1200 }) {
  const [val, setVal] = useState(target);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, target / (duration / 40));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start));
      }
    }, 40);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{val.toLocaleString()}</span>;
});

/* ── Base India City Zones Data ────────────────────────────── */
const BASE_CITY_ZONES = [
  {
    city: "Pune",
    state: "Maharashtra",
    agency: "PMC & PMPML",
    buses: 24,
    defects: 19,
    resolved: 3,
    coverage: 96,
    status: "pilot",
    isPilot: true,
    region: "WEST",
    description: "Demonstration Pilot: Prototype dataset modeled on 24 PMPML transit corridors (Swargate, Hinjawadi, Hadapsar, Katraj, Padmavati)."
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    agency: "BEST / MMRDA",
    buses: 68,
    defects: 387,
    resolved: 341,
    coverage: 88,
    status: "expansion",
    isPilot: false,
    region: "WEST",
    description: "Maharashtra transit expansion testbed with Mumbai metropolitan transit grid."
  },
  {
    city: "Nagpur",
    state: "Maharashtra",
    agency: "NMC Transit",
    buses: 18,
    defects: 67,
    resolved: 55,
    coverage: 82,
    status: "expansion",
    isPilot: false,
    region: "WEST",
    description: "Vidarbha transit corridor pilot onboarding model."
  },
  {
    city: "Delhi",
    state: "NCT",
    agency: "DTC",
    buses: 112,
    defects: 624,
    resolved: 589,
    coverage: 91,
    status: "sandbox",
    isPilot: false,
    region: "NORTH",
    description: "National integration sandbox architecture representing DTC inner ring corridors."
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    agency: "BMTC",
    buses: 84,
    defects: 298,
    resolved: 261,
    coverage: 85,
    status: "sandbox",
    isPilot: false,
    region: "SOUTH",
    description: "Smart Cities Mission expansion simulation across Outer Ring Road transit lines."
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    agency: "MTC",
    buses: 56,
    defects: 214,
    resolved: 197,
    coverage: 92,
    status: "sandbox",
    isPilot: false,
    region: "SOUTH",
    description: "Smart Cities Mission expansion simulation across metropolitan transit routes."
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    agency: "TSRTC",
    buses: 47,
    defects: 178,
    resolved: 155,
    coverage: 87,
    status: "sandbox",
    isPilot: false,
    region: "SOUTH",
    description: "Smart Cities Mission expansion simulation across HITEC City corridors."
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    agency: "AMTS",
    buses: 39,
    defects: 156,
    resolved: 134,
    coverage: 86,
    status: "sandbox",
    isPilot: false,
    region: "WEST",
    description: "Smart Cities Mission expansion simulation across BRTS network."
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    agency: "WBTC",
    buses: 61,
    defects: 247,
    resolved: 218,
    coverage: 88,
    status: "sandbox",
    isPilot: false,
    region: "EAST",
    description: "Smart Cities Mission expansion simulation across EM Bypass arteries."
  },
  {
    city: "Jaipur",
    state: "Rajasthan",
    agency: "JCTSL",
    buses: 28,
    defects: 98,
    resolved: 82,
    coverage: 84,
    status: "sandbox",
    isPilot: false,
    region: "NORTH",
    description: "Smart Cities Mission expansion simulation across heritage city corridors."
  },
  {
    city: "Surat",
    state: "Gujarat",
    agency: "SMC Transit",
    buses: 21,
    defects: 73,
    resolved: 61,
    coverage: 83,
    status: "sandbox",
    isPilot: false,
    region: "WEST",
    description: "Smart Cities Mission expansion simulation."
  },
  {
    city: "Lucknow",
    state: "Uttar Pradesh",
    agency: "UPSRTC",
    buses: 34,
    defects: 124,
    resolved: 104,
    coverage: 84,
    status: "sandbox",
    isPilot: false,
    region: "NORTH",
    description: "Smart Cities Mission expansion simulation across Hazratganj corridors."
  },
];

const MONTHLY_DATA = [
  { month: "Apr", detected: 312, resolved: 271 },
  { month: "May", detected: 428, resolved: 389 },
  { month: "Jun", detected: 561, resolved: 497 },
  { month: "Jul", detected: 683, resolved: 608 },
  { month: "Aug", detected: 724, resolved: 671 },
  { month: "Sep", detected: 496, resolved: 462 },
];

const WHAT_WE_DO = [
  {
    icon: Camera, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200",
    title: "Continuous Road Scanning",
    desc: "Buses record the road while driving regular passenger routes every day — without needing any special survey cars or extra staff.",
    stat: "30 FPS", statLabel: "Camera Speed"
  },
  {
    icon: Cpu, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200",
    title: "Instant AI Detection",
    desc: "Smart AI software spots potholes, cracks, and deep water puddles in less than a second as the bus drives past.",
    stat: "98.4%", statLabel: "Detection Accuracy"
  },
  {
    icon: GitMerge, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200",
    title: "Double-Check by 2+ Buses",
    desc: "A pothole is only reported after at least 2 different buses spot the exact same problem. This avoids mistakes caused by shadows.",
    stat: "2+ Buses", statLabel: "Confirmation Rule"
  },
  {
    icon: Database, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",
    title: "Live City Map",
    desc: "All reported road issues appear instantly on a live map with photos, GPS coordinates, and urgency ratings.",
    stat: "Live", statLabel: "City Map Updates"
  },
  {
    icon: Building2, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200",
    title: "Instant Repair Orders",
    desc: "The system automatically creates a repair ticket with photos and sends it to the road department so workers can fix it quickly.",
    stat: "<3 min", statLabel: "Ticket Alert Time"
  },
  {
    icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200",
    title: "Automatic Repair Check",
    desc: "When a bus passes the fixed spot next time, the camera verifies the road is smooth and automatically closes the complaint.",
    stat: "100%", statLabel: "Automatic Recheck"
  },
];

export default function PublicPortal() {
  const { summary, issues = [], buses = [], setSelectedIssue } = useFleet();
  const [activeZone, setActiveZone] = useState("Pune");
  const [zoneFilter, setZoneFilter] = useState("all"); // "all", "maharashtra", "sandbox"
  const [defectFilter, setDefectFilter] = useState("ALL"); // "ALL", "CRITICAL", "POTHOLE", "WATERLOGGING", "RESOLVED"

  // Dynamically compute metrics from live database
  const totalBusesCount = buses?.length || summary?.total_buses || 24;
  const activeBusesCount = summary?.active_buses || buses?.filter(b => b.status === "ACTIVE").length || 22;
  const totalIssuesCount = issues?.length || summary?.total_issues || 19;
  const verifiedIssuesCount = issues?.filter(i => i.status === "VERIFIED" || i.status === "CONFIRMED").length || summary?.verified_issues || 14;
  const criticalIssuesCount = issues?.filter(i => (i.severity && i.severity >= 8) || i.priority_level === "CRITICAL").length || summary?.critical_issues || 9;
  const resolvedIssuesCount = issues?.filter(i => i.status === "RESOLVED" || i.status === "CLOSED").length || summary?.resolved_issues || 3;
  const inProgressCount = issues?.filter(i => i.status === "ASSIGNED" || i.status === "IN_PROGRESS").length || 2;

  // Defect Breakdown dynamically derived from active database issues
  const defectBreakdown = useMemo(() => {
    if (!issues || issues.length === 0) {
      return [
        { label: "Potholes & Craters", count: 8, pct: 42, color: "#EF4444" },
        { label: "Damaged Road / Cracks", count: 5, pct: 26, color: "#F59E0B" },
        { label: "Waterlogging & Drainage", count: 3, pct: 16, color: "#3B82F6" },
        { label: "Missing Dividers", count: 2, pct: 11, color: "#8B5CF6" },
        { label: "Damaged Signboards", count: 1, pct: 5, color: "#10B981" },
      ];
    }

    let potholes = 0;
    let damagedRoad = 0;
    let waterlogging = 0;
    let dividers = 0;
    let signboards = 0;

    issues.forEach(i => {
      const t = (i.issue_type || i.event_type || "").toUpperCase();
      if (t.includes("POTHOLE")) potholes++;
      else if (t.includes("WATER")) waterlogging++;
      else if (t.includes("DIVIDER") || t.includes("MEDIAN") || t.includes("BARRIER")) dividers++;
      else if (t.includes("SIGN")) signboards++;
      else damagedRoad++;
    });

    const total = issues.length || 1;
    return [
      { label: "Potholes & Deep Craters", count: potholes, pct: Math.round((potholes / total) * 100), color: "#EF4444" },
      { label: "Damaged Road & Cracks", count: damagedRoad, pct: Math.round((damagedRoad / total) * 100), color: "#F59E0B" },
      { label: "Waterlogging & Drainage", count: waterlogging, pct: Math.round((waterlogging / total) * 100), color: "#3B82F6" },
      { label: "Missing Dividers & Medians", count: dividers, pct: Math.round((dividers / total) * 100), color: "#8B5CF6" },
      { label: "Damaged Signboards & Signs", count: signboards, pct: Math.round((signboards / total) * 100), color: "#10B981" },
    ];
  }, [issues]);

  // City Zones enriched with data for Pune
  const cityZones = useMemo(() => {
    return BASE_CITY_ZONES.map(z => {
      if (z.city === "Pune") {
        return {
          ...z,
          buses: activeBusesCount,
          defects: totalIssuesCount,
          resolved: resolvedIssuesCount,
          coverage: 96,
        };
      }
      return z;
    });
  }, [activeBusesCount, totalIssuesCount, resolvedIssuesCount]);

  // Filtered zones based on tab selection
  const filteredZones = useMemo(() => {
    if (zoneFilter === "maharashtra") {
      return cityZones.filter(z => z.state === "Maharashtra");
    }
    if (zoneFilter === "sandbox") {
      return cityZones.filter(z => z.state !== "Maharashtra");
    }
    return cityZones;
  }, [cityZones, zoneFilter]);

  // Filtered issues for the defect showcase
  const filteredIssues = useMemo(() => {
    if (!issues || issues.length === 0) return [];
    if (defectFilter === "CRITICAL") {
      return issues.filter(i => (i.severity && i.severity >= 8) || i.priority_level === "CRITICAL");
    }
    if (defectFilter === "POTHOLE") {
      return issues.filter(i => (i.issue_type || "").toUpperCase().includes("POTHOLE"));
    }
    if (defectFilter === "WATERLOGGING") {
      return issues.filter(i => (i.issue_type || "").toUpperCase().includes("WATER"));
    }
    if (defectFilter === "RESOLVED") {
      return issues.filter(i => i.status === "RESOLVED" || i.status === "CLOSED");
    }
    return issues;
  }, [issues, defectFilter]);

  const maxDetected = Math.max(...MONTHLY_DATA.map(d => d.detected));

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans selection:bg-[#0B3C74] selection:text-white">
      <OnePageHeader />

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section id="home" className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#0B3C74] via-[#0D4A8A] to-[#1a5fa0] rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-amber-400/10 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Smart Cities Mission • BEL &amp; PMC Prototype Architecture</span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3"
                  style={{ color: "#FFFFFF" }}>
                  नगर दृष्टि
                </h1>
                <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: "#BAE6FD" }}>
                  National Urban Road Intelligence Network
                </h2>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#CBD5E1" }}>
                  AI-powered mobile road intelligence network demonstrating autonomous defect detection, multi-bus verification, and municipal work order dispatch. Currently showcasing prototype demonstration telemetry modeled on <strong className="text-white">Pune &amp; Maharashtra transit corridors</strong>.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/auth"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: "#F59E0B", color: "#1E293B" }}>
                  <Lock className="w-4 h-4" />
                  <span>Central Command Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#pilot-feed"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-white/30 transition hover:bg-white/10"
                  style={{ color: "#FFFFFF" }}>
                  <Eye className="w-4 h-4" />
                  <span>Inspect Pune Demo Feed</span>
                </a>
              </div>

              {/* Live Ticker with Dynamic Database Counts */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/20">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#94A3B8" }}>
                    Demo Transit Fleet
                  </span>
                  <span className="text-2xl font-extrabold font-mono" style={{ color: "#34D399" }}>
                    <CounterValue target={activeBusesCount} />
                  </span>
                  <span className="text-[9px] block text-slate-300 font-medium">Pune PMPML Model</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#94A3B8" }}>
                    Defect Records
                  </span>
                  <span className="text-2xl font-extrabold font-mono" style={{ color: "#FCD34D" }}>
                    <CounterValue target={totalIssuesCount} />
                  </span>
                  <span className="text-[9px] block text-slate-300 font-medium">Pune &amp; Maharashtra Demo</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#94A3B8" }}>
                    Critical Hazards
                  </span>
                  <span className="text-2xl font-extrabold font-mono" style={{ color: "#F87171" }}>
                    <CounterValue target={criticalIssuesCount} />
                  </span>
                  <span className="text-[9px] block text-slate-300 font-medium">Priority Score &ge; 80</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#94A3B8" }}>
                    Actioned / Resolved
                  </span>
                  <span className="text-2xl font-extrabold font-mono" style={{ color: "#60A5FA" }}>
                    <CounterValue target={resolvedIssuesCount} />
                  </span>
                  <span className="text-[9px] block text-slate-300 font-medium">Autonomous Recheck</span>
                </div>
              </div>
            </div>

            {/* Right: Transit Bus Feed Preview */}
            <div className="bg-black/40 rounded-2xl p-4 border border-white/20 backdrop-blur-sm space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-white/15">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: "#34D399" }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  TRANSIT DASHCAM DEMO FEED
                </span>
                <span className="text-amber-300 text-[11px] font-semibold">PUNE CORRIDOR (DEMO)</span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 group">
                <img
                  src="/pune_bus_dashcam.jpg"
                  alt="Pune Bus Dashcam Sensing Feed"
                  className="w-full h-full object-cover brightness-90 contrast-105 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> SIMULATED 30 FPS
                </div>
                <div className="absolute top-2 right-2 bg-black/75 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/30">
                  BUS-101 • SWARGATE-KATRAJ, PUNE (DEMO)
                </div>
                <div className="absolute top-[42%] left-[28%] border-2 border-red-500 bg-red-500/25 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-lg animate-pulse">
                  POTHOLE (96% CONF)
                </div>
                <div className="absolute top-[58%] left-[58%] border-2 border-amber-400 bg-amber-400/25 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-lg">
                  CRACK / BITUMEN (89%)
                </div>
                <div className="absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono border border-white/10" style={{ color: "#67E8F9" }}>
                  18.4982°N, 73.8564°E • NVIDIA Jetson Model • 29.8 FPS
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-950/40 rounded-lg p-2 text-center border border-emerald-500/40">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mb-1 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-300 block">Pune (PMC Model)</span>
                  <span className="text-[9px] text-slate-300">{activeBusesCount} Demo Buses</span>
                </div>
                <div className="bg-blue-950/40 rounded-lg p-2 text-center border border-blue-500/30">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mx-auto mb-1" />
                  <span className="text-[10px] font-mono font-bold text-blue-300 block">Mumbai (MMRDA)</span>
                  <span className="text-[9px] text-slate-300">Phase-1 Model</span>
                </div>
                <div className="bg-purple-950/40 rounded-lg p-2 text-center border border-purple-500/30">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mx-auto mb-1" />
                  <span className="text-[10px] font-mono font-bold text-purple-300 block">National Grid</span>
                  <span className="text-[9px] text-slate-300">28 Smart Cities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DEFECT REGISTRY (PUNE & MAHARASHTRA DEMO DATA SHOWCASE)
      ══════════════════════════════════════════════════════ */}
      <section id="pilot-feed" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Demonstration Dataset • Pune &amp; Maharashtra Corridors</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3C74] tracking-tight">
                Defect Registry: Pune &amp; Maharashtra Demo Data
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Demonstration defect records modeled on Pune and Maharashtra transit corridors (Swargate, Hinjawadi, Hadapsar, Katraj) to illustrate how Nagar Drishti detects, verifies, and dispatches municipal repairs. Click any card to inspect full telemetry.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
              {[
                { id: "ALL", label: `All Defects (${issues.length})` },
                { id: "CRITICAL", label: `Critical (${criticalIssuesCount})` },
                { id: "POTHOLE", label: "Potholes" },
                { id: "WATERLOGGING", label: "Waterlogging" },
                { id: "RESOLVED", label: `Resolved (${resolvedIssuesCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setDefectFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    defectFilter === f.id
                      ? "bg-[#0B3C74] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
            {filteredIssues.slice(0, 8).map((issue) => {
              const evidenceImg = getDetectionEvidenceImage(issue);
              const isCritical = issue.severity >= 8 || issue.priority_level === "CRITICAL";

              return (
                <div
                  key={issue.id || issue.issue_code}
                  onClick={() => setSelectedIssue && setSelectedIssue(issue)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#0B3C74] hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group"
                >
                  {/* Evidence Thumbnail */}
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={evidenceImg}
                      alt={issue.issue_type || "Road Defect"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px] font-bold border border-white/20">
                        {issue.issue_code || `ND-${issue.id}`}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                        isCritical
                          ? "bg-red-500/90 text-white border-red-400"
                          : "bg-amber-500/90 text-white border-amber-400"
                      }`}>
                        SEVERITY {issue.severity || 8}/10
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                      <span className="font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span className="truncate max-w-[140px]">{issue.ward || "Pune Ward"}</span>
                      </span>
                      <span className="font-mono bg-black/60 px-1.5 py-0.5 rounded text-slate-200">
                        {issue.confirmations_count || (issue.confirming_buses ? issue.confirming_buses.length : 2)}× Bus Confirmed
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          {issue.issue_type || "POTHOLE"}
                        </span>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                          issue.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : issue.status === "ASSIGNED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          ● {issue.status || "VERIFIED"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-[#0B3C74] transition-colors leading-snug">
                        {issue.location_name || "Transit Corridor, Pune"}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {issue.description || "Surface defect flagged with high impact score on public transit corridor."}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">
                        First Flagged: <strong className="text-slate-700">{issue.first_bus || "BUS-101"}</strong>
                      </span>
                      <span className="text-[#0B3C74] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note under cards */}
          <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Displaying <strong>{filteredIssues.length} demonstration defect records</strong> synchronized with the PostgreSQL backend.
              </span>
            </div>
            <Link
              to="/auth"
              className="font-bold text-[#0B3C74] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Access Command Center GIS Map</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT WE DO
      ══════════════════════════════════════════════════════ */}
      <section id="about" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0B3C74] uppercase tracking-wider px-3 py-1 bg-blue-50 border border-blue-200 rounded-full inline-block">
            What We Do
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#0B3C74", WebkitTextFillColor: "#0B3C74" }}>
            Every Bus. Every Road. Every Corridor in India.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>
            Nagar Drishti transforms public bus fleets into an autonomous road-intelligence network — collecting, verifying, and acting on defect data from municipal corridors without additional infrastructure cost.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHAT_WE_DO.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
                <div className={`w-12 h-12 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "#0F172A", WebkitTextFillColor: "#0F172A" }}>{item.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "#475569", WebkitTextFillColor: "#475569" }}>{item.desc}</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-2xl font-extrabold font-mono ${item.color}`}>{item.stat}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-right max-w-[120px]" style={{ color: "#94A3B8", WebkitTextFillColor: "#94A3B8" }}>{item.statLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NATIONAL ANALYTICS DASHBOARD
      ══════════════════════════════════════════════════════ */}
      <section id="analytics" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0B3C74] uppercase tracking-wider px-3 py-1 bg-blue-50 border border-blue-200 rounded-full inline-block">
            National Analytics &amp; Defect Breakdown
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#0B3C74", WebkitTextFillColor: "#0B3C74" }}>
            Aggregated Intelligence Across Transit Zones
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#475569", WebkitTextFillColor: "#475569" }}>
            Aggregated metrics based on prototype Pune demonstration corridors and regional multi-city models.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Detection vs Resolution Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold mb-1" style={{ color: "#0F172A" }}>Monthly Detection vs Resolution</h3>
                <p className="text-xs mb-1" style={{ color: "#64748B" }}>Demonstration Transit Corridors &amp; Municipal Work Orders (FY 2026)</p>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Prototype Dataset: Pune &amp; Maharashtra Demo Models
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#0B3C74] inline-block" /> Detected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Resolved</span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-44">
              {MONTHLY_DATA.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1" style={{ height: "140px" }}>
                    <div
                      className="flex-1 rounded-t-lg bg-[#0B3C74] transition-all hover:bg-[#0D4A8A]"
                      style={{ height: `${(d.detected / maxDetected) * 100}%` }}
                      title={`Detected: ${d.detected}`}
                    />
                    <div
                      className="flex-1 rounded-t-lg bg-emerald-500 transition-all hover:bg-emerald-600"
                      style={{ height: `${(d.resolved / maxDetected) * 100}%` }}
                      title={`Resolved: ${d.resolved}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Defect Type Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold" style={{ color: "#0F172A" }}>Defect Type Breakdown</h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                DEMO DATA
              </span>
            </div>
            <p className="text-xs mb-5" style={{ color: "#64748B" }}>Based on {issues.length} demonstration pilot issues</p>
            <div className="space-y-3.5">
              {defectBreakdown.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{d.label}</span>
                    <span className="text-xs font-bold font-mono text-slate-900">{d.count} ({d.pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, d.pct)}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Autonomous Recheck Rate", value: "96.2%", delta: "Verified by 2nd bus pass", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Edge Inference Latency", value: "<1.2 sec", delta: "On-bus NVIDIA Jetson", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Demo Fleet Model", value: `${activeBusesCount} Buses`, delta: "24 PMPML Transit Units", icon: Bus, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
            { label: "Dedicated Survey Cost", value: "₹0", delta: "Zero survey vehicles needed", icon: Award, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className={`bg-white rounded-2xl border ${k.border} shadow-sm p-5 hover:shadow-md transition`}>
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center ${k.color} mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-2xl font-extrabold font-mono ${k.color}`}>{k.value}</span>
                <p className="text-[11px] font-bold mt-1" style={{ color: "#1E293B", WebkitTextFillColor: "#1E293B" }}>{k.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#475569", WebkitTextFillColor: "#475569" }}>{k.delta}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          INDIA CITY ZONES & REGIONAL DEPLOYMENT
      ══════════════════════════════════════════════════════ */}
      <section id="zones" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold text-[#0B3C74] uppercase tracking-wider px-3 py-1 bg-blue-50 border border-blue-200 rounded-full inline-block">
            <Map className="w-3 h-3 inline mr-1" />National Multi-City Coverage
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#0B3C74", WebkitTextFillColor: "#0B3C74" }}>
            Smart Cities Mission Transit Grid
          </h2>
          <p className="text-sm text-slate-600">
            Currently populated with demonstration data modeled on <strong>Pune and Maharashtra transit corridors</strong>, demonstrating multi-city scalability across 28+ Smart Cities.
          </p>
        </div>

        {/* Scope Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setZoneFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              zoneFilter === "all"
                ? "bg-[#0B3C74] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All 28 Cities
          </button>
          <button
            onClick={() => setZoneFilter("maharashtra")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              zoneFilter === "maharashtra"
                ? "bg-amber-500 text-slate-900 shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ★ Pune &amp; Maharashtra (Demo Pilot Data)
          </button>
          <button
            onClick={() => setZoneFilter("sandbox")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              zoneFilter === "sandbox"
                ? "bg-[#0B3C74] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            National Sandbox Network (Phase-2 Architecture)
          </button>
        </div>

        {/* Zone Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredZones.map((zone) => {
            const isPilot = zone.isPilot;
            const resRate = Math.round((zone.resolved / Math.max(1, zone.defects)) * 100);

            return (
              <div
                key={zone.city}
                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 relative ${
                  isPilot
                    ? "border-amber-400 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 to-white"
                    : activeZone === zone.city
                    ? "border-[#0B3C74] ring-2 ring-[#0B3C74]/20"
                    : "border-slate-200"
                }`}
                onClick={() => setActiveZone(activeZone === zone.city ? null : zone.city)}
              >
                {isPilot && (
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Demo Pilot</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3 mt-1">
                  <div>
                    <h4 className="text-base font-bold flex items-center gap-1.5" style={{ color: "#0F172A" }}>
                      <span>{zone.city}</span>
                      {isPilot && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </h4>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>
                      {zone.state} • <span className="font-semibold text-slate-700">{zone.agency}</span>
                    </p>
                  </div>

                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    isPilot
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : zone.status === "expansion"
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}>
                    {isPilot ? "● DEMO PILOT" : zone.status === "expansion" ? "● EXPANSION" : "● SANDBOX"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-lg font-extrabold font-mono text-[#0B3C74]">{zone.buses}</span>
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">Buses</span>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-lg font-extrabold font-mono text-amber-600">{zone.defects}</span>
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">Defects</span>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-lg font-extrabold font-mono text-emerald-600">{zone.resolved}</span>
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">Resolved</span>
                  </div>
                </div>

                {/* Resolution Progress Bar */}
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Resolution Rate</span>
                  <span className="text-emerald-600">{resRate}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resRate}%` }} />
                </div>

                <p className="mt-3 text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {zone.description}
                </p>

                {activeZone === zone.city && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Corridor Coverage:</span>
                      <span className="font-bold text-[#0B3C74]">{zone.coverage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dataset Mode:</span>
                      <span className={`font-bold ${isPilot ? "text-emerald-600" : "text-slate-500"}`}>
                        {isPilot ? "Pune Demonstration Model" : "Multi-Zone Sandbox"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Demonstration Dataset Notice:</strong> Nagar Drishti is currently running in prototype demonstration mode with sample data modeled on <strong>Pune and regions of Maharashtra</strong> (PMPML transit routes, PMC wards). Remaining city zones illustrate how the platform scales nationally under the Smart Cities Mission.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS (SIMPLE 5-STEP PROCESS)
      ══════════════════════════════════════════════════════ */}
      <section id="technology" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm my-6">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0B3C74] uppercase tracking-wider px-3 py-1 bg-blue-50 border border-blue-200 rounded-full inline-block">
            How It Works (5 Simple Steps)
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#0B3C74", WebkitTextFillColor: "#0B3C74" }}>
            How Road Problems Are Found and Fixed
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#475569", WebkitTextFillColor: "#475569" }}>
            From a bus camera spotting a pothole on its daily route to alerting the road repair team and verifying the fix — all happens automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            {
              step: "01",
              title: "1. Camera Records Road",
              desc: "A small camera on the front of the bus watches the road surface while the bus drives its normal route.",
              icon: Camera,
              color: "text-blue-700",
              badge: "Bus Camera"
            },
            {
              step: "02",
              title: "2. AI Spots Problems",
              desc: "Smart computer AI instantly recognizes potholes, cracks, and deep water puddles in less than a second.",
              icon: Cpu,
              color: "text-purple-700",
              badge: "Instant AI"
            },
            {
              step: "03",
              title: "3. Buses Double-Check",
              desc: "At least 2 different buses must see the exact same spot so there are no false alarms or shadow mistakes.",
              icon: GitMerge,
              color: "text-indigo-700",
              badge: "Double Check"
            },
            {
              step: "04",
              title: "4. Repair Ticket Sent",
              desc: "The system creates a repair order with photos and exact GPS location and sends it to the road department (PWD).",
              icon: Building2,
              color: "text-amber-700",
              badge: "Work Order"
            },
            {
              step: "05",
              title: "5. Automatic Check",
              desc: "When a bus passes the spot after repairs, the camera confirms the road is smooth and automatically closes the issue.",
              icon: CheckCircle2,
              color: "text-emerald-700",
              badge: "Closed & Fixed"
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-[#0B3C74] hover:shadow-sm transition group">
                {idx < 4 && (
                  <div className="hidden md:block absolute right-0 top-1/2 translate-x-full -translate-y-1/2 z-10 text-slate-400 text-lg font-bold">→</div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-slate-500">STEP {item.step}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-bold">{item.badge}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold" style={{ color: "#0F172A", WebkitTextFillColor: "#0F172A" }}>{item.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: "#475569", WebkitTextFillColor: "#475569" }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CITIZEN IMPACT (Dark CTA Band)
      ══════════════════════════════════════════════════════ */}
      <section id="impact" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="dark-banner rounded-3xl p-10 sm:p-14 shadow-xl relative overflow-hidden" style={{ backgroundColor: "#0B3C74" }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-block"
                style={{ color: "#FCD34D", borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.1)" }}>
                National Citizen Impact
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#FFFFFF" }}>
                Safer Roads. Smarter Cities. Faster Repairs.
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#BAE6FD" }}>
                By converting public transit buses into autonomous road inspectors, municipal corporations can resolve high-severity road hazards before accidents occur — at <strong className="text-white">zero additional survey cost</strong>, across every transit corridor simultaneously.
              </p>
              <Link to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition hover:scale-105 cursor-pointer"
                style={{ backgroundColor: "#F59E0B", color: "#1E293B" }}>
                <Lock className="w-4 h-4" />
                Access Central Command
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { val: "65%", label: "Faster repair turnaround vs citizen complaint systems", color: "#34D399" },
                { val: "₹0", label: "Cost on dedicated laser road survey vehicles", color: "#FCD34D" },
                { val: "24", label: "Transit buses simulated in Pune pilot corridor", color: "#60A5FA" },
                { val: "96.2%", label: "Autonomous multi-bus verification accuracy", color: "#F472B6" },
              ].map(s => (
                <div key={s.val} className="p-5 rounded-2xl border backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}>
                  <span className="text-3xl font-extrabold font-mono" style={{ color: s.color }}>{s.val}</span>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#BAE6FD" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SIGN IN CTA
      ══════════════════════════════════════════════════════ */}
      <section id="signin" className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border-2 border-[#0B3C74]/20 shadow-lg p-8 sm:p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B3C74] mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl font-bold" style={{ color: "#0B3C74", WebkitTextFillColor: "#0B3C74" }}>Central Command &amp; Control Portal</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>
              For authorized Municipal Control Room Operators, PWD Works Engineers, and BEL Technical Architects to monitor live fleet telemetry, inspect defect dockets, and dispatch repair orders across all transit corridors.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm shadow-md transition hover:bg-[#072850] active:scale-95 cursor-pointer"
              style={{ backgroundColor: "#0B3C74", color: "#FFFFFF" }}>
              <Lock className="w-4 h-4" style={{ color: "#FCD34D" }} />
              <span style={{ color: "#FFFFFF" }}>Sign In to Central Command</span>
              <ArrowRight className="w-4 h-4" style={{ color: "#FFFFFF" }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm">
          <div>
            <h5 className="font-bold text-slate-900 mb-2">नगर दृष्टि (Nagar Drishti)</h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              National Urban Road Intelligence Network powered by AI-equipped public buses across India's Smart Cities. Prototype demonstration dataset modeled on Pune &amp; Maharashtra transit corridors.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-2">Government &amp; Municipal Partners</h5>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>Bharat Electronics Limited (BEL)</li>
              <li>Pune Municipal Corporation (PMC &amp; PCMC)</li>
              <li>Pune Mahanagar Parivahan Mahamandal Ltd (PMPML)</li>
              <li>Ministry of Housing &amp; Urban Affairs (MoHUA) — GoI</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-2">Quick Links</h5>
            <ul className="text-xs text-slate-500 space-y-1">
              <li><a href="#about" className="hover:text-[#0B3C74] transition">What We Do</a></li>
              <li><a href="#pilot-feed" className="hover:text-[#0B3C74] transition font-medium text-[#0B3C74]">Pune Demo Defect Registry</a></li>
              <li><a href="#analytics" className="hover:text-[#0B3C74] transition">National Analytics</a></li>
              <li><a href="#zones" className="hover:text-[#0B3C74] transition">Multi-City Coverage</a></li>
              <li><Link to="/auth" className="hover:text-[#0B3C74] transition font-semibold">Central Command Login →</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
          © 2026 Nagar Drishti • Bharat Electronics Limited &amp; Pune Municipal Corporation • Smart India Hackathon 2026
        </div>
      </footer>
    </div>
  );
}
