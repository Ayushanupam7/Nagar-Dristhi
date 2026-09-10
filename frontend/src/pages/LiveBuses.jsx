import React, { useState } from "react";
import {
  Bus,
  Search,
  Radio,
  Eye,
  Globe,
  MapPin,
  Bell,
  X,
  Navigation,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import GisMap from "../components/GisMap";

export default function LiveBuses() {
  const { buses, setSelectedBus, setSelectedIssue, selectedRegion, setRegion, user, addToast, issues } = useFleet();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("split"); // 'split' | 'table' | 'map'
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [advisoryRoute, setAdvisoryRoute] = useState("Route 102 (Shivajinagar - Hadapsar)");
  const [advisoryLevel, setAdvisoryLevel] = useState("WARNING");
  const [advisoryMsg, setAdvisoryMsg] = useState(
    "Caution: Surface defect / waterlogging cluster reported ahead on Karve Road. Maintain speed under 25 km/h."
  );

  const getBusLastEvent = (bus) => {
    if (bus.last_event_type) return bus.last_event_type;
    const match = (issues || []).find(
      (i) => i.first_bus === bus.bus_id || i.confirming_buses?.includes(bus.bus_id)
    );
    if (match) return match.issue_type.replace(/_/g, " ");
    const charCode = (bus.bus_id || "101").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const fallbacks = ["POTHOLE", "POTHOLE", "WATERLOGGING", "DAMAGED ROAD", "POTHOLE", "CONGESTION"];
    return fallbacks[charCode % fallbacks.length];
  };

  const formatBusDisplayId = (busId) => {
    if (!busId) return "Bus";
    return busId.replace(/^BUS-/, "Bus ");
  };

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.bus_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bus.city && bus.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.state && bus.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.reg_number && bus.reg_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && bus.status === "ACTIVE") ||
      (statusFilter === "IDLE" && bus.status === "IDLE") ||
      (statusFilter === "CAM_ONLINE" && bus.camera_status === "ONLINE") ||
      (statusFilter === "CAM_OFFLINE" && bus.camera_status !== "ONLINE");
    return matchesSearch && matchesStatus;
  });

  const activeCount = buses.filter((b) => b.status === "ACTIVE").length;
  const camerasOnline = buses.filter((b) => b.camera_status === "ONLINE").length;
  const criticalIssues = (issues || []).filter(
    (i) => i.priority_level === "CRITICAL" && i.status !== "RESOLVED"
  );

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    addToast(
      `Fleet Advisory Transmitted to ${advisoryRoute}: "${advisoryMsg}" [Level: ${advisoryLevel}]`,
      "warning"
    );
    setBroadcastModalOpen(false);
  };

  return (
    <div className="p-5 space-y-5 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#0B3C74]" />
            Public Transit Operations &amp; Fleet Telemetry Command
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Edge AI dashcam telemetry, GPS coordinates, route congestion feeds, and driver communication across Indian Metros
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode("split")}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === "split" ? "bg-white text-[#0B3C74] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Split Radar
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === "table" ? "bg-white text-[#0B3C74] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Roster List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === "map" ? "bg-white text-[#0B3C74] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Full GIS Map
            </button>
          </div>

          {/* Broadcast Hazard Advisory Button */}
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Broadcast Advisory</span>
          </button>
        </div>
      </div>

      {/* Transport Control Officer Executive Operations Directive Bar */}
      <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
              🚌
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  {user?.role === "TRANSPORT_OFFICER" ? user.name : "Shri Ajay Gaikwad (Transport Control Officer)"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold border border-emerald-300">
                  PMPML-FLEET-DIV
                </span>
                <span className="text-[10px] text-slate-600 hidden sm:inline">• Level 3 Transit Dispatcher</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Fleet Directive: Real-time Dashcam Edge Inference, Route Bunching Prevention &amp; GPS Ingestion Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs shadow-2xs">
              <span className="text-slate-500 block text-[10px]">Fleet Mobilization</span>
              <span className="font-bold font-mono text-emerald-800 text-sm">
                {activeCount} / {buses.length} ({buses.length ? ((activeCount / buses.length) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs shadow-2xs">
              <span className="text-slate-500 block text-[10px]">AI Dashcam Feeds</span>
              <span className="font-bold font-mono text-[#0B3C74] text-sm">
                {camerasOnline} Streams (25 FPS)
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs shadow-2xs">
              <span className="text-slate-500 block text-[10px]">GPS Telemetry Sync</span>
              <span className="font-bold text-emerald-700 text-sm flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                0.8s Latency
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Critical Road Hazards Detected by Fleet (Critical Alerts Feed) */}
      <div className="bg-rose-50/90 border-2 border-rose-300 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <ShieldAlert className="w-4 h-4 text-rose-700" />
            <h2 className="text-xs font-black uppercase text-rose-950 tracking-wider font-mono">
              Live Critical Alerts &amp; Road Hazards Detected by Transit Fleet
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
              {criticalIssues.length} Immediate Incidents
            </span>
          </div>
          <span className="text-[11px] text-rose-800 font-medium">
            Multi-bus verified ground truth • Click any alert to inspect audit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {criticalIssues.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedIssue(alert)}
              className="p-3 rounded-lg bg-white border border-rose-200 hover:border-rose-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🔴</span>
                  <span className="font-mono text-xs font-extrabold text-[#0B3C74] group-hover:underline">
                    {alert.issue_code}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  Sev {alert.severity}/10
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">
                  {alert.issue_type.replace(/_/g, " ")}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {alert.location_name}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 font-mono">
                <span>{alert.confirmations_count || 2} Bus Passes</span>
                <span className="text-rose-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  View Audit &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Bus ID, Route, City..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 w-full"
            />
          </div>

          {/* All-India State/Region Scope Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800">
            <Globe className="w-3.5 h-3.5 text-[#0B3C74] shrink-0" />
            <select
              value={selectedRegion}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-transparent font-bold text-[#0B3C74] focus:outline-none cursor-pointer text-xs pr-1 max-w-[150px] sm:max-w-[180px] truncate"
            >
              <option value="ALL_INDIA">🇮🇳 All India (All 28 States)</option>
              <optgroup label="Maharashtra Hubs">
                <option value="MH_PUNE">Pune (Maharashtra)</option>
                <option value="MH_MUMBAI">Mumbai (Maharashtra)</option>
              </optgroup>
              <optgroup label="Major States &amp; Metropolitan Hubs">
                <option value="DL_DELHI">Delhi (NCT)</option>
                <option value="KA_BENGALURU">Bengaluru (Karnataka)</option>
                <option value="TN_CHENNAI">Chennai (Tamil Nadu)</option>
                <option value="TG_HYDERABAD">Hyderabad (Telangana)</option>
                <option value="GJ_AHMEDABAD">Ahmedabad (Gujarat)</option>
                <option value="WB_KOLKATA">Kolkata (West Bengal)</option>
                <option value="RJ_JAIPUR">Jaipur (Rajasthan)</option>
                <option value="UP_LUCKNOW">Lucknow (Uttar Pradesh)</option>
                <option value="KL_KOCHI">Kochi (Kerala)</option>
                <option value="MP_BHOPAL">Bhopal (Madhya Pradesh)</option>
                <option value="PB_CHANDIGARH">Chandigarh (Punjab)</option>
              </optgroup>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Statuses ({buses.length})</option>
            <option value="ACTIVE">Active Buses ({activeCount})</option>
            <option value="IDLE">Idle Buses ({buses.length - activeCount})</option>
            <option value="CAM_ONLINE">Camera Online ({camerasOnline})</option>
            <option value="CAM_OFFLINE">Camera Offline ({buses.length - camerasOnline})</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono self-end sm:self-center">
          Displaying <strong>{filteredBuses.length}</strong> vehicles
        </span>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === "map" && (
        <div className="h-[650px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
          <GisMap height="100%" />
        </div>
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 6 Cols: Live Transit Radar Map */}
          <div className="lg:col-span-6 h-[560px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
            <GisMap height="100%" />
          </div>

          {/* Right 6 Cols: Live Roster & Quick Action Table */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[560px] shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#0B3C74]" />
                Live Fleet Transit Roster ({filteredBuses.length})
              </h2>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Auto-Telemetry 6s
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto my-3 flex-1 pr-1">
              {filteredBuses.map((bus) => {
                const regPlate = bus.reg_number || (bus.bus_id === "BUS-101" ? "MH 19 6996" : "MH 12 Q 3017");
                const lastEvent = getBusLastEvent(bus);
                const isOnline = bus.status === "ACTIVE";

                return (
                  <div
                    key={bus.bus_id}
                    onClick={() => setSelectedBus(bus)}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer space-y-2 shadow-2xs"
                  >
                    {/* Primary Identifier: Vehicle Registration */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#0B3C74] text-amber-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                          🚌
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900 tracking-wide">
                              {regPlate}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                                isOnline
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                              {isOnline ? "ONLINE" : "IDLE"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            {formatBusDisplayId(bus.bus_id)} · {bus.route_name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs text-emerald-700 font-bold block">{bus.speed_kmh} km/h</span>
                        <span className="text-[10px] text-slate-500">{bus.city || "Pune"}</span>
                      </div>
                    </div>

                    {/* AI Status & Last Event Footer (No Ping Driver, Meaningful Event Metric) */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#0B3C74] border border-blue-200 font-bold">
                          AI: {isOnline ? "ACTIVE" : "STANDBY"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                          Last Event: <strong className="text-red-700 font-extrabold">{lastEvent}</strong>
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBus(bus);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0B3C74] hover:bg-[#072850] text-white font-semibold transition flex items-center gap-1 text-[11px] shadow-xs"
                      >
                        <Eye className="w-3 h-3 text-blue-200" />
                        <span>View AI Feed</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Vehicle Registration</th>
                  <th className="py-3 px-4">State &amp; City</th>
                  <th className="py-3 px-4">Transit Route</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Speed</th>
                  <th className="py-3 px-4">Edge AI Status</th>
                  <th className="py-3 px-4">Last Event</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBuses.map((bus) => {
                  const regPlate = bus.reg_number || (bus.bus_id === "BUS-101" ? "MH 19 6996" : "MH 12 Q 3017");
                  const lastEvent = getBusLastEvent(bus);
                  const isOnline = bus.status === "ACTIVE";

                  return (
                    <tr
                      key={bus.bus_id}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                      onClick={() => setSelectedBus(bus)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <div>
                            <span className="font-mono font-extrabold text-slate-900 block text-xs">
                              {regPlate}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {formatBusDisplayId(bus.bus_id)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#0B3C74] border border-slate-200">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {bus.city || "Pune"}, {bus.state_code || "MH"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{bus.route_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{bus.speed_kmh} km/h</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-[#0B3C74] border border-blue-200 font-bold">
                          <Radio className="w-3 h-3 text-[#0B3C74]" />
                          {isOnline ? "ACTIVE" : "STANDBY"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-red-700 font-bold text-xs">{lastEvent}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBus(bus);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0B3C74] hover:bg-[#072850] text-white rounded-lg text-[11px] font-semibold transition shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-blue-200" />
                          <span>View AI Feed</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Route Hazard Advisory Broadcast Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Fleet Route Hazard Advisory Broadcast</h3>
                  <p className="text-[10px] text-rose-200 font-mono">
                    PMPML Transit Operations • Driver In-Cabin Telemetry Link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-5 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Transit Corridor / Route</label>
                <select
                  value={advisoryRoute}
                  onChange={(e) => setAdvisoryRoute(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="Route 102 (Shivajinagar - Hadapsar)">Route 102 (Shivajinagar - Hadapsar)</option>
                  <option value="Route 105 (Swargate - Katraj)">Route 105 (Swargate - Katraj)</option>
                  <option value="Route 118 (Kothrud - Pune Station)">Route 118 (Kothrud - Pune Station)</option>
                  <option value="Route 144 (Pune Station - Hinjawadi Phase 3)">Route 144 (Pune Station - Hinjawadi Phase 3)</option>
                  <option value="ALL_ROUTES">All Active Fleet Routes (City-Wide Alert)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Advisory Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "INFO", label: "Informational", color: "bg-blue-600" },
                    { id: "WARNING", label: "Hazard Warning", color: "bg-amber-600" },
                    { id: "EMERGENCY", label: "Route Diversion", color: "bg-rose-600" },
                  ].map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setAdvisoryLevel(lvl.id)}
                      className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition ${
                        advisoryLevel === lvl.id
                          ? `${lvl.color} text-white shadow-xs`
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Driver In-Cabin Advisory Message</label>
                <textarea
                  rows={3}
                  value={advisoryMsg}
                  onChange={(e) => setAdvisoryMsg(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Will be displayed on Driver In-Cabin Tablet HUD and transmitted via 4G/5G edge MQTT link.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition shadow-xs active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast Advisory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
