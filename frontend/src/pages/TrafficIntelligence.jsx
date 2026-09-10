import React, { useState, useEffect } from "react";
import {
  Activity,
  Car,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
  MapPin,
  Flame,
  Route as RouteIcon,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useFleet } from "../context/FleetContext";
import { api } from "../services/api";

const PIE_COLORS = ["#0B3C74", "#D97706", "#059669", "#7C3AED", "#64748B"];

export default function TrafficIntelligence() {
  const { trafficSummary, summary } = useFleet();
  const [odFlows, setOdFlows] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTrafficData = async () => {
    setLoading(true);
    try {
      const [odData, routeData, bnData] = await Promise.all([
        api.getOriginDestinationFlows().catch(() => []),
        api.getRouteDelays().catch(() => []),
        api.getBottlenecks().catch(() => []),
      ]);
      setOdFlows(odData || []);
      setRoutes(routeData || []);
      setBottlenecks(bnData || []);
    } catch (err) {
      console.error("Failed to load traffic intelligence data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrafficData();
  }, []);

  const dist = trafficSummary?.vehicle_distribution || {
    cars: 42,
    bikes: 68,
    buses: 6,
    trucks: 8,
    other: 4,
  };

  const vehiclePieData = [
    { name: "Motorcycles & Scooters", value: dist.bikes || 68 },
    { name: "Private Cars", value: dist.cars || 42 },
    { name: "Public Buses", value: dist.buses || 6 },
    { name: "Commercial Trucks", value: dist.trucks || 8 },
    { name: "Other / 3-Wheelers", value: dist.other || 5 },
  ];

  // Fallback route data if API is loading
  const displayRoutes =
    routes.length > 0
      ? routes
      : [
          {
            route_id: "Route-102",
            corridor_name: "Swargate - Katraj BRTS",
            normal_travel_time_min: 24,
            current_travel_time_min: 38.5,
            delay_min: 14.5,
            congestion_level: "HIGH",
            bottleneck_detected: true,
          },
          {
            route_id: "Route-105",
            corridor_name: "Shivajinagar - Hinjewadi Ph3",
            normal_travel_time_min: 35,
            current_travel_time_min: 47.0,
            delay_min: 12.0,
            congestion_level: "HIGH",
            bottleneck_detected: true,
          },
          {
            route_id: "Route-118",
            corridor_name: "Hadapsar Gadital - Kharadi Bypass",
            normal_travel_time_min: 22,
            current_travel_time_min: 31.5,
            delay_min: 9.5,
            congestion_level: "MODERATE",
            bottleneck_detected: true,
          },
          {
            route_id: "Route-144",
            corridor_name: "Deccan Gymkhana - Kothrud Depot",
            normal_travel_time_min: 18,
            current_travel_time_min: 23.0,
            delay_min: 5.0,
            congestion_level: "LOW",
            bottleneck_detected: false,
          },
        ];

  // Fallback OD data if API is loading
  const displayOdFlows =
    odFlows.length > 0
      ? odFlows
      : [
          {
            origin_zone: "Swargate Bus Terminal",
            destination_zone: "Katraj Chowk",
            estimated_daily_trips: 18450,
            avg_travel_time_min: 38.5,
            confidence_score: 0.88,
            peak_hour_window: "08:30 - 10:30",
          },
          {
            origin_zone: "Shivajinagar Station",
            destination_zone: "Hinjewadi Phase 1",
            estimated_daily_trips: 24200,
            avg_travel_time_min: 47.0,
            confidence_score: 0.92,
            peak_hour_window: "09:00 - 11:30",
          },
          {
            origin_zone: "Hadapsar Gadital",
            destination_zone: "Kharadi IT Park",
            estimated_daily_trips: 12600,
            avg_travel_time_min: 31.5,
            confidence_score: 0.84,
            peak_hour_window: "17:30 - 20:00",
          },
        ];

  return (
    <div className="p-5 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0B3C74]" />
              Mobile Fleet Traffic Intelligence &amp; Origin-Destination Analytics
            </h1>
            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              DEMO / SIMULATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Vehicle counting (ByteTrack), flow density, corridor delay estimation, and corridor OD trip matrices from public bus cameras.
          </p>
        </div>

        <button
          onClick={loadTrafficData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">City Congestion Index</span>
          <p className="text-3xl font-bold font-mono text-amber-600 mt-1">
            {trafficSummary?.city_average_congestion || summary.traffic_congestion_index || 54.0}%
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Level: HIGH (Peak Transit Hours)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">Vehicles Counted Today</span>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-1">
            {trafficSummary?.total_vehicles_counted || 1420}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">YOLOv8 + ByteTrack Mobile Feed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">Critical Bottlenecks</span>
          <p className="text-3xl font-bold font-mono text-rose-700 mt-1">
            {bottlenecks.length || 3} Corridors
          </p>
          <span className="text-[10px] text-rose-600 mt-1 block font-medium">Transit Speed &lt; 15 km/h</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">Average Transit Delay</span>
          <p className="text-3xl font-bold font-mono text-[#0B3C74] mt-1">+9.2 mins</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Compared to baseline schedule</span>
        </div>
      </div>

      {/* Vehicle Classification Breakdown & Corridor Delay Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Vehicle Classification Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#0B3C74]" />
              Vehicle Classification Composition (ByteTrack)
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0B3C74] border border-blue-200">
              LIVE ACCUMULATOR
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Real-time counting classified across 5 primary vehicular classes from bus front-facing camera feeds
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehiclePieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {vehiclePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", color: "#0F172A", fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#475569" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown summary row */}
          <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-center font-mono">
            {vehiclePieData.map((v, i) => (
              <div key={i} className="p-1.5 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block truncate">{v.name.split(" ")[0]}</span>
                <span className="text-xs font-bold text-slate-800">{v.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Corridor Congestion & Delay */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Corridor Congestion (%) &amp; Delay (min)
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              GPS + SCHEDULE
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Real-time transit delay computed from baseline vs current bus travel times
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayRoutes.map((r) => ({
                  route: r.route_number || r.route_id || "Route",
                  congestion:
                    r.congestion_level === "SEVERE"
                      ? 92
                      : r.congestion_level === "HIGH"
                      ? 82
                      : r.congestion_level === "MODERATE"
                      ? 64
                      : 38,
                  delay: r.delay_minutes ?? r.delay_min ?? 0,
                }))}
              >
                <XAxis dataKey="route" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", color: "#0F172A", fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="congestion" name="Congestion %" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delay" name="Delay (min)" fill="#0B3C74" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#475569" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Highest Bottleneck:</strong> Route-102 (Swargate - Katraj BRTS) exhibiting +14.5m delay due to mixed traffic spillover.
            </span>
          </div>
        </div>
      </div>

      {/* Transit Route Delay & Bottleneck Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-[#0B3C74]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Key Transit Routes Schedule vs Live Delay Monitoring
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {displayRoutes.length} MONITORED ROUTES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Route ID</th>
                <th className="px-4 py-3">Corridor Name</th>
                <th className="px-4 py-3">Baseline (Min)</th>
                <th className="px-4 py-3">Live Time (Min)</th>
                <th className="px-4 py-3">Delay (Min)</th>
                <th className="px-4 py-3">Congestion</th>
                <th className="px-4 py-3">Bottleneck</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {displayRoutes.map((r, i) => {
                const routeId = r.route_number || r.route_id || `Route ${100 + i}`;
                const corridor = r.route_name || r.corridor_name || "Urban Transit Corridor";
                const baseline = r.normal_travel_time_min ?? 30;
                const liveTime = r.current_travel_time_min ?? 38;
                const delay = r.delay_minutes ?? r.delay_min ?? (liveTime > baseline ? Math.round(liveTime - baseline) : 0);
                const congestion = r.congestion_level || "MODERATE";
                const hasBottleneck = Boolean(r.bottleneck_detected || r.bottleneck_location);
                const bottleneckText = r.bottleneck_location || (hasBottleneck ? "DETECTED" : "CLEAR");

                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-[#0B3C74] font-mono">{routeId}</td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-900">{corridor}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{baseline}m</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{liveTime}m</td>
                    <td className="px-4 py-3 font-bold text-rose-700 font-mono">
                      +{delay}m
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          congestion === "SEVERE"
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : congestion === "HIGH"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : congestion === "MODERATE"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {congestion}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {hasBottleneck && bottleneckText !== "CLEAR" ? (
                        <span className="flex items-center gap-1 text-rose-700 font-bold text-[11px]" title={bottleneckText}>
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[180px]">{bottleneckText}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>CLEAR</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Origin-Destination (OD) Analytics Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0B3C74]" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Origin-Destination (OD) Flow Matrix &amp; Trip Distribution
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                TRANSIT DEMAND SPEC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Corridor travel demand estimates aggregated from bus passenger load sensor proxies and vehicular tracking nodes
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Model: Gravity OD Flow Synthesizer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayOdFlows.map((od, i) => {
            const origin = od.origin_zone || od.origin || "Origin";
            const destination = od.destination_zone || od.destination || "Destination";
            const trips = od.estimated_daily_trips ?? od.vehicle_volume ?? 14200;
            const duration = od.avg_travel_time_min ?? od.average_travel_time_min ?? 28;
            const peak = od.peak_hour_window || (od.delay_min ? `+${od.delay_min}m Peak Delay` : "08:30 - 10:30");
            const conf = Math.round((od.confidence_score || 0.88) * 100);

            return (
              <div
                key={i}
                className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#0B3C74] mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      {origin}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {destination}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Est. Daily Trips:</span>
                      <strong className="text-slate-900">{Number(trips).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Avg Duration:</span>
                      <strong className="text-slate-900">{duration} mins</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Peak Window:</span>
                      <strong className="text-amber-700">{peak}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
                  <span>Confidence: {conf}%</span>
                  <span className="text-[10px] bg-blue-100 text-[#0B3C74] font-bold px-1.5 py-0.5 rounded">
                    SYNTHESIZED
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
