import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
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
  Bus as BusIcon,
  Gauge,
  Navigation,
  Compass,
  Zap,
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

// Map Viewport Pan Controller for Traffic Intelligence Map
function TrafficMapPanController({ targetCoords }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo([targetCoords.lat, targetCoords.lng], targetCoords.zoom || 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [targetCoords, map]);
  return null;
}

function createTrafficBusIcon(busId) {
  return L.divIcon({
    className: "traffic-bus-marker",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(11, 60, 116, 0.35); animation: ping 2.5s infinite;"></div>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: #0B3C74; border: 2px solid #93C5FD; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">
          <svg style="width: 12px; height: 12px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-8 4h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function TrafficIntelligence() {
  const { trafficSummary, summary, buses } = useFleet();
  const [odFlows, setOdFlows] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [heatFilter, setHeatFilter] = useState("ALL");
  const [selectedHeatPoint, setSelectedHeatPoint] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTrafficData = async () => {
    setLoading(true);
    try {
      const [odData, routeData, bnData, heatData] = await Promise.all([
        api.getOriginDestinationFlows().catch(() => []),
        api.getRouteDelays().catch(() => []),
        api.getBottlenecks().catch(() => []),
        api.getTrafficHeatmap().catch(() => null),
      ]);
      setOdFlows(odData || []);
      setRoutes(routeData || []);
      setBottlenecks(bnData || []);
      if (heatData?.heat_points && heatData.heat_points.length > 0) {
        setHeatPoints(heatData.heat_points);
      }
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

  const displayHeatPoints = heatPoints.length > 0 ? heatPoints : [
    {
      id: "HEAT-01",
      latitude: 18.5085,
      longitude: 73.8327,
      corridor_name: "Karve Road (Nal Stop Junction)",
      location_name: "Nal Stop Metro Flyover Divergence",
      intensity: 0.92,
      congestion_percent: 98.0,
      congestion_level: "SEVERE",
      average_speed_kmh: 10.2,
      vehicle_count: 569,
      bottleneck_detected: true,
      bottleneck_description: "Metro pillar construction + signal spillover",
    },
    {
      id: "HEAT-02",
      latitude: 18.4792,
      longitude: 73.8576,
      corridor_name: "Swargate - Katraj BRTS Corridor",
      location_name: "Padmavati Bridge Flyover Incline",
      intensity: 0.95,
      congestion_percent: 92.0,
      congestion_level: "SEVERE",
      average_speed_kmh: 9.5,
      vehicle_count: 780,
      bottleneck_detected: true,
      bottleneck_description: "Mixed vehicular intrusion into dedicated BRTS lane",
    },
    {
      id: "HEAT-03",
      latitude: 18.5018,
      longitude: 73.8580,
      corridor_name: "Swargate Transit Hub",
      location_name: "Jedhe Chowk Central Intersection",
      intensity: 0.86,
      congestion_percent: 84.0,
      congestion_level: "HIGH",
      average_speed_kmh: 12.0,
      vehicle_count: 640,
      bottleneck_detected: true,
      bottleneck_description: "Inter-city bus turnaround convergence",
    },
    {
      id: "HEAT-04",
      latitude: 18.5985,
      longitude: 73.7620,
      corridor_name: "Hinjewadi IT Expressway",
      location_name: "Wakad Bridge Underpass Corridor",
      intensity: 0.84,
      congestion_percent: 81.0,
      congestion_level: "HIGH",
      average_speed_kmh: 13.5,
      vehicle_count: 744,
      bottleneck_detected: true,
      bottleneck_description: "Peak shift IT commuter bottleneck",
    },
    {
      id: "HEAT-05",
      latitude: 18.5912,
      longitude: 73.7389,
      corridor_name: "Hinjewadi IT Park Phase 1",
      location_name: "Shivaji Chowk Tech Gate",
      intensity: 0.78,
      congestion_percent: 75.0,
      congestion_level: "HIGH",
      average_speed_kmh: 16.0,
      vehicle_count: 612,
      bottleneck_detected: false,
    },
    {
      id: "HEAT-06",
      latitude: 18.5314,
      longitude: 73.8446,
      corridor_name: "Shivajinagar Transit Hub",
      location_name: "Shimla Office Chowk",
      intensity: 0.80,
      congestion_percent: 78.0,
      congestion_level: "HIGH",
      average_speed_kmh: 15.0,
      vehicle_count: 520,
      bottleneck_detected: true,
      bottleneck_description: "Suburban rail & bus passenger boarding queues",
    },
    {
      id: "HEAT-07",
      latitude: 18.5289,
      longitude: 73.8744,
      corridor_name: "Pune Railway Station Central",
      location_name: "Alankar Talkies Junction",
      intensity: 0.74,
      congestion_percent: 72.0,
      congestion_level: "HIGH",
      average_speed_kmh: 17.5,
      vehicle_count: 480,
      bottleneck_detected: false,
    },
    {
      id: "HEAT-08",
      latitude: 18.4485,
      longitude: 73.8588,
      corridor_name: "Katraj South Depot Corridor",
      location_name: "Katraj Snake Park Chowk",
      intensity: 0.76,
      congestion_percent: 74.0,
      congestion_level: "HIGH",
      average_speed_kmh: 16.5,
      vehicle_count: 430,
      bottleneck_detected: false,
    },
    {
      id: "HEAT-09",
      latitude: 18.5020,
      longitude: 73.9290,
      corridor_name: "Hadapsar Gadital Transit Node",
      location_name: "Gadital Flyover Junction",
      intensity: 0.69,
      congestion_percent: 68.0,
      congestion_level: "MODERATE",
      average_speed_kmh: 19.5,
      vehicle_count: 390,
      bottleneck_detected: false,
    },
    {
      id: "HEAT-10",
      latitude: 18.5515,
      longitude: 73.9350,
      corridor_name: "Kharadi Bypass (East Tech Hub)",
      location_name: "EON IT Park Divergence",
      intensity: 0.66,
      congestion_percent: 65.0,
      congestion_level: "MODERATE",
      average_speed_kmh: 21.0,
      vehicle_count: 410,
      bottleneck_detected: false,
    },
    {
      id: "HEAT-11",
      latitude: 18.5173,
      longitude: 73.8415,
      corridor_name: "Deccan Gymkhana",
      location_name: "Goodluck Chowk / FC Road",
      intensity: 0.62,
      congestion_percent: 61.0,
      congestion_level: "MODERATE",
      average_speed_kmh: 22.0,
      vehicle_count: 350,
      bottleneck_detected: false,
    },
    {
      id: "HEAT-12",
      latitude: 18.5074,
      longitude: 73.7786,
      corridor_name: "Chandani Chowk Expressway",
      location_name: "Bavdhan Multi-Level Flyover",
      intensity: 0.35,
      congestion_percent: 34.0,
      congestion_level: "LOW",
      average_speed_kmh: 42.0,
      vehicle_count: 180,
      bottleneck_detected: false,
    }
  ];

  const filteredHeatPoints = displayHeatPoints.filter((p) => {
    if (heatFilter === "ALL") return true;
    if (heatFilter === "BOTTLENECKS") return Boolean(p.bottleneck_detected);
    return p.congestion_level === heatFilter;
  });

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

      {/* City-Wide Traffic Congestion Heat Map & Corridor Bottleneck GIS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-[#0B3C74] uppercase tracking-wide">
                City-Wide Traffic Congestion Heat Map &amp; Corridor Bottlenecks
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                REAL-TIME HEAT DENSITY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Spatial congestion heat density aggregated from mobile bus tracking units across all municipal corridors. Shows bottleneck heat nodes, transit speed deficits, and traffic choke points.
            </p>
          </div>

          {/* Heatmap Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Filter Corridor:</span>
            {[
              { id: "ALL", label: `All Nodes (${displayHeatPoints.length})` },
              { id: "BOTTLENECKS", label: `Bottlenecks (${displayHeatPoints.filter(p => p.bottleneck_detected).length})` },
              { id: "SEVERE", label: "Severe Congestion" },
              { id: "HIGH", label: "High Volume" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setHeatFilter(f.id)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition border ${heatFilter === f.id
                  ? "bg-[#0B3C74] text-white border-[#0B3C74] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Heat Map Container & Side Telemetry Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main Leaflet Heatmap */}
          <div className="xl:col-span-3 relative h-[450px] rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0 isolate">
            {/* Heat Gradient Legend Overlay */}
            <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-300 p-2.5 rounded-lg shadow-md text-[10px] space-y-1 select-none font-mono">
              <span className="font-bold text-slate-700 block uppercase text-[9px]">Congestion Heat Index</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
                <span className="text-slate-800 font-medium">Severe (&gt;80% · &lt;12 km/h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EA580C]" />
                <span className="text-slate-800 font-medium">High (65-80% · 12-20 km/h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="text-slate-800 font-medium">Moderate (45-65% · 20-35 km/h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-slate-800 font-medium">Free Flow (&lt;45% · &gt;35 km/h)</span>
              </div>
            </div>

            <MapContainer
              center={[18.5204, 73.8567]}
              zoom={12}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TrafficMapPanController targetCoords={mapTarget} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Dynamic Traffic Heat Gradient Nodes */}
              {filteredHeatPoints.map((pt) => {
                const color =
                  pt.congestion_level === "SEVERE"
                    ? "#DC2626"
                    : pt.congestion_level === "HIGH"
                      ? "#EA580C"
                      : pt.congestion_level === "MODERATE"
                        ? "#F59E0B"
                        : "#10B981";

                const radius =
                  pt.congestion_level === "SEVERE"
                    ? 38
                    : pt.congestion_level === "HIGH"
                      ? 30
                      : pt.congestion_level === "MODERATE"
                        ? 22
                        : 16;

                return (
                  <React.Fragment key={`page-heat-${pt.id}`}>
                    {/* Outer Heat Dispersion Circle */}
                    <CircleMarker
                      center={[pt.latitude, pt.longitude]}
                      radius={radius + 14}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.22,
                        stroke: false,
                      }}
                    />
                    {/* Inner Density Core Circle */}
                    <CircleMarker
                      center={[pt.latitude, pt.longitude]}
                      radius={radius}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.55,
                        color: color,
                        weight: 2,
                        opacity: 0.8,
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedHeatPoint(pt);
                          setMapTarget({ lat: pt.latitude, lng: pt.longitude, zoom: 14 });
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-1 min-w-[220px] space-y-2 text-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="font-bold text-slate-900 text-xs font-mono">{pt.corridor_name}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${pt.congestion_level === "SEVERE"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : pt.congestion_level === "HIGH"
                                  ? "bg-orange-100 text-orange-800 border border-orange-300"
                                  : pt.congestion_level === "MODERATE"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                }`}
                            >
                              {pt.congestion_level}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500">{pt.location_name}</p>

                          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                            <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Avg Speed</span>
                              <strong className="text-slate-900">{pt.average_speed_kmh} km/h</strong>
                            </div>
                            <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Congestion</span>
                              <strong style={{ color }}>{pt.congestion_percent}%</strong>
                            </div>
                          </div>

                          {pt.bottleneck_detected && (
                            <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-800 flex items-start gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Bottleneck:</strong> {pt.bottleneck_description || "Traffic delay node detected"}
                              </span>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}

              {/* Live Bus Fleet Markers */}
              {buses.map((b) => (
                <Marker
                  key={`heat-bus-${b.bus_id}`}
                  position={[b.latitude, b.longitude]}
                  icon={createTrafficBusIcon(b.bus_id)}
                >
                  <Popup>
                    <div className="p-1 text-xs space-y-1 font-mono">
                      <strong className="text-[#0B3C74]">{b.bus_id} ({b.reg_number || "MH 12"})</strong>
                      <p className="text-slate-600">{b.route_name}</p>
                      <p className="text-emerald-700 font-bold">Speed: {b.speed_kmh} km/h</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Side Telemetry Panel: Critical Corridors Ranked */}
          <div className="flex flex-col justify-between space-y-3 bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-[#0B3C74]" />
                  Corridor Speed Watch
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  TOP {Math.min(filteredHeatPoints.length, 6)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Click any corridor to center the heat map viewport on the bottleneck zone
              </p>

              <div className="mt-3 space-y-2 max-h-[310px] overflow-y-auto pr-1">
                {[...filteredHeatPoints]
                  .sort((a, b) => b.congestion_percent - a.congestion_percent)
                  .slice(0, 6)
                  .map((node) => {
                    const isSelected = selectedHeatPoint?.id === node.id;
                    const isCrit = node.congestion_level === "SEVERE" || node.congestion_level === "HIGH";
                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          setSelectedHeatPoint(node);
                          setMapTarget({ lat: node.latitude, lng: node.longitude, zoom: 14 });
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition text-xs ${isSelected
                          ? "bg-white border-[#0B3C74] ring-1 ring-[#0B3C74] shadow-xs"
                          : "bg-white hover:bg-slate-100/80 border-slate-200"
                          }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="font-bold text-slate-900 truncate max-w-[150px]">{node.corridor_name}</span>
                          <span
                            className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${isCrit ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                              }`}
                          >
                            {node.average_speed_kmh} km/h
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                          <span className="truncate max-w-[140px]">{node.location_name}</span>
                          <strong className={isCrit ? "text-rose-600" : "text-emerald-600"}>
                            {node.congestion_percent}%
                          </strong>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-950 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0B3C74] shrink-0" />
              <span>
                <strong>Transit Priority AI:</strong> Automatic green wave signal synchronization recommended on <strong>Karve Road</strong> &amp; <strong>Padmavati Bridge</strong>.
              </span>
            </div>
          </div>
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
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${congestion === "SEVERE"
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
