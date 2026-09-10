import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { Layers, Eye, EyeOff, Navigation, AlertTriangle, Bus as BusIcon, Crosshair, RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { getDetectionEvidenceImage } from "../utils/evidence";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

// Fix standard leaflet icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map Viewport Pan Controller
function MapPanController({ targetCoords }) {
  const map = useMap();
  React.useEffect(() => {
    if (targetCoords) {
      map.flyTo([targetCoords.lat, targetCoords.lng], targetCoords.zoom || 15, {
        animate: true,
        duration: 1.4,
      });
    }
  }, [targetCoords, map]);
  return null;
}

// Custom HTML marker for User's Current GPS Location
function createCurrentLocationIcon() {
  return L.divIcon({
    className: "custom-user-location-marker",
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: radar-pulse 2s infinite;"></div>
        <div style="position: relative; width: 16px; height: 16px; border-radius: 9999px; background: #10B981; border: 3px solid #ECFDF5; box-shadow: 0 0 14px #10B981, 0 4px 6px rgba(0,0,0,0.6);"></div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

// Custom HTML marker for Buses
function createBusIcon(busId, heading) {
  return L.divIcon({
    className: "custom-bus-marker",
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.4); animation: radar-pulse 2s infinite;"></div>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #1D4ED8; border: 2px solid #93C5FD; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">
          <svg style="width: 14px; height: 14px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-8 4h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

// Custom HTML marker for Issues
function createIssueIcon(issue) {
  let color = "#3B82F6"; // blue
  if (issue.status === "RESOLVED") {
    color = "#10B981"; // green
  } else if (issue.priority_level === "CRITICAL") {
    color = "#EF4444"; // red
  } else if (issue.priority_level === "HIGH") {
    color = "#F97316"; // orange
  } else if (issue.priority_level === "MEDIUM") {
    color = "#F59E0B"; // amber
  }

  const iconGlyph = issue.issue_type === "WATERLOGGING" ? "💧" : (issue.issue_type === "POTHOLE" ? "⚠️" : "🚧");

  return L.divIcon({
    className: "custom-issue-marker",
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${color}; opacity: 0.3; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #111827; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 4px 8px rgba(0,0,0,0.6);">
          ${iconGlyph}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

export default function GisMap({ height = "100%", center = [18.5204, 73.8567], zoom = 12 }) {
  const { buses, issues, setSelectedIssue, setSelectedBus, addToast, currentRegion } = useFleet();
  const [showBuses, setShowBuses] = useState(true);
  const [showDefects, setShowDefects] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [isLayersExpanded, setIsLayersExpanded] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [targetLocation, setTargetLocation] = useState(null);

  // Automatically fly to region coordinates when user switches region/state
  React.useEffect(() => {
    if (currentRegion) {
      setTargetLocation({
        lat: currentRegion.lat,
        lng: currentRegion.lng,
        zoom: currentRegion.zoom || (currentRegion.id === "ALL_INDIA" ? 5 : 12),
      });
    }
  }, [currentRegion?.id]);

  const filteredIssues = issues.filter((iss) => {
    if (filterType === "ALL") return true;
    if (filterType === "CRITICAL") return iss.priority_level === "CRITICAL";
    if (filterType === "VERIFIED") return iss.status === "VERIFIED";
    if (filterType === "UNRESOLVED") return iss.status !== "RESOLVED";
    return iss.issue_type === filterType;
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      if (addToast) addToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setShowUserLocation(true);
        setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 15 });
        setIsLocating(false);
        if (addToast) {
          addToast(`Location acquired: ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E (±${Math.round(coords.accuracy)}m)`, "success");
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation prompt or access error:", err);
        if (addToast) {
          addToast("Unable to access GPS location. Please check browser location permissions.", "warning");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleResetToHub = () => {
    const hub = currentRegion || { lat: 18.5204, lng: 73.8567, zoom: 12, name: "Pune Fleet Hub" };
    setTargetLocation({ lat: hub.lat, lng: hub.lng, zoom: hub.zoom || (hub.id === "ALL_INDIA" ? 5 : 12) });
    if (addToast) {
      addToast(`Map centered to ${hub.name}`, "info");
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-command-border shadow-xl z-0 isolate" style={{ height }}>
      {/* Scope Indicator Badge (Top Center) */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-md border border-slate-300 px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2.5 text-xs select-none">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        <span className="font-semibold text-slate-800 tracking-tight">{currentRegion?.name || "All India"}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#0B3C74] font-bold border border-blue-200">
          {buses.length} Buses
        </span>
      </div>

      {/* Floating Map Quick Action Buttons (Cleanly below Leaflet Zoom Control) */}
      <div className="absolute top-[80px] left-[10px] z-[400] flex flex-col gap-1.5">
        <button
          onClick={handleGetLocation}
          title={userLocation ? "Zoom to Current Location" : "Detect Current Location"}
          disabled={isLocating}
          className={`w-[32px] h-[32px] rounded border shadow backdrop-blur-md transition flex items-center justify-center ${
            userLocation
              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20"
              : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-slate-300/40"
          }`}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={handleResetToHub}
          title={`Reset View to ${currentRegion?.name || "Hub"}`}
          className="w-[32px] h-[32px] rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 shadow backdrop-blur-md transition flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* GIS Layer Controls Overlay (Collapsed by Default) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end">
        {!isLayersExpanded ? (
          <button
            onClick={() => setIsLayersExpanded(true)}
            className="flex items-center gap-2 bg-white/95 hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-md text-xs font-mono text-slate-800 shadow-md backdrop-blur-md transition group active:scale-95"
            title="Expand GIS Map Layers"
          >
            <Layers className="w-4 h-4 text-[#0B3C74] group-hover:text-blue-700" />
            <span className="font-bold text-xs tracking-wider uppercase text-slate-800">GIS Layers</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800" />
          </button>
        ) : (
          <div className="bg-white/98 backdrop-blur-md border border-slate-300 rounded-lg p-3 shadow-xl flex flex-col gap-2.5 text-xs w-56 animate-fadeIn">
            <div
              onClick={() => setIsLayersExpanded(false)}
              className="flex items-center justify-between font-mono text-slate-800 font-bold uppercase text-[10px] pb-1.5 border-b border-slate-200 cursor-pointer hover:text-blue-700 transition"
              title="Click to collapse"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0B3C74]" />
                <span>GIS Map Layers</span>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-slate-500 hover:text-slate-800" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showBuses}
                onChange={(e) => setShowBuses(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Live Buses ({buses.length})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showDefects}
                onChange={(e) => setShowDefects(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Road Defects ({filteredIssues.length})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded border-slate-300 text-purple-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                Defect Heatmap
              </span>
            </label>

            {userLocation && (
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={showUserLocation}
                  onChange={(e) => setShowUserLocation(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Current Location
                </span>
              </label>
            )}

            <div className="pt-1.5 border-t border-slate-200">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Show All Issues</option>
                <option value="CRITICAL">Critical Priority Only</option>
                <option value="VERIFIED">Verified Issues Only</option>
                <option value="UNRESOLVED">Active Unresolved</option>
                <option value="POTHOLE">Potholes</option>
                <option value="WATERLOGGING">Waterlogging</option>
                <option value="DAMAGED_ROAD">Damaged Roads</option>
              </select>
            </div>

            {/* Current Location Action Button */}
            <div className="pt-1.5 border-t border-slate-200 flex flex-col gap-1.5">
              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-[11px] shadow-sm transition"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Acquiring GPS...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-white" />
                    <span>{userLocation ? "Re-center Current GPS" : "Locate My Position"}</span>
                  </>
                )}
              </button>
              {userLocation && (
                <button
                  onClick={handleResetToHub}
                  className="flex items-center justify-center gap-1.5 w-full py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] transition border border-slate-300 font-medium"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset to Pune Hub</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Dynamic Pan Controller */}
        <MapPanController targetCoords={targetLocation} />
        {/* OpenStreetMap Dark Styled Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Heatmap Overlay Simulation */}
        {showHeatmap &&
          filteredIssues.map((iss) => (
            <CircleMarker
              key={`heat-${iss.id}`}
              center={[iss.latitude, iss.longitude]}
              radius={35}
              pathOptions={{
                fillColor: iss.priority_level === "CRITICAL" ? "#ef4444" : "#f59e0b",
                fillOpacity: 0.25,
                stroke: false,
              }}
            />
          ))}

        {/* Live Buses Layer */}
        {showBuses &&
          buses.map((bus) => (
            <Marker
              key={bus.bus_id}
              position={[bus.latitude, bus.longitude]}
              icon={createBusIcon(bus.bus_id, bus.heading_deg)}
              eventHandlers={{
                click: () => setSelectedBus(bus),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[220px] space-y-2 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <BusIcon className="w-4 h-4 text-[#0B3C74]" />
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {bus.reg_number || (bus.bus_id === "BUS-101" ? "MH 19 6996" : "MH 12 Q 3017")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                      {bus.status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <p className="font-medium text-slate-900">{bus.bus_id} · {bus.route_name}</p>
                    <p><span className="text-slate-500">Speed:</span> <span className="font-mono text-emerald-700 font-bold">{bus.speed_kmh} km/h</span></p>
                    <p><span className="text-slate-500">AI Status:</span> <span className="font-mono text-[#0B3C74] font-bold">ACTIVE (FRONT_ROAD)</span></p>
                    <p><span className="text-slate-500">Last Event:</span> <span className="font-mono text-red-700 font-bold">POTHOLE</span></p>
                  </div>

                  <button
                    onClick={() => setSelectedBus(bus)}
                    className="w-full mt-2 py-1.5 bg-[#0B3C74] hover:bg-[#072850] text-white rounded text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    View AI Sensing Feed
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Road Defects / Urban Issues Layer */}
        {showDefects &&
          filteredIssues.map((iss) => (
            <Marker
              key={`issue-${iss.id}`}
              position={[iss.latitude, iss.longitude]}
              icon={createIssueIcon(iss)}
              eventHandlers={{
                click: () => setSelectedIssue(iss),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[240px] space-y-2 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 font-mono text-xs">{iss.issue_code}</span>
                    <PriorityBadge score={iss.priority_score} level={iss.priority_level} />
                  </div>

                  {/* Detection Evidence Thumbnail */}
                  <div className="relative aspect-video w-full rounded-md overflow-hidden border border-slate-300 bg-slate-900">
                    <img
                      src={getDetectionEvidenceImage(iss)}
                      alt={iss.issue_type}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/evidence_pothole.jpg";
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-black/75 text-[9px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      {iss.issue_type.replace(/_/g, " ")}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-rose-950/85 text-[8px] text-rose-300 px-1.5 py-0.5 rounded font-mono">
                      SEV: {iss.severity}/10
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <p className="text-[11px] text-slate-500 line-clamp-1">{iss.location_name}</p>
                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge status={iss.status} />
                      <span className="text-[11px] font-mono text-slate-600">
                        Buses: <strong className="text-blue-700 font-bold">{iss.confirmations_count}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedIssue(iss)}
                    className="w-full py-1.5 bg-[#0B3C74] hover:bg-[#072850] text-white rounded text-xs font-semibold shadow-xs transition"
                  >
                    View Verification &amp; Audit
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* User's Current GPS Location Layer */}
        {userLocation && showUserLocation && (
          <>
            {/* GPS Accuracy Radius Circle */}
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={Math.min(Math.max(userLocation.accuracy || 45, 28), 130)}
              pathOptions={{
                fillColor: "#10B981",
                fillOpacity: 0.15,
                color: "#10B981",
                weight: 1.5,
                dashArray: "4 4",
              }}
            />

            {/* Pulsing GPS Location Marker */}
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createCurrentLocationIcon()}
            >
              <Popup>
                <div className="p-1 min-w-[210px] space-y-2 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                      <Navigation className="w-4 h-4" />
                      <span>Your Current Location</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      LIVE GPS
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700 font-mono">
                    <p>
                      <span className="text-slate-500">Lat:</span> {userLocation.lat.toFixed(5)}°
                    </p>
                    <p>
                      <span className="text-slate-500">Lng:</span> {userLocation.lng.toFixed(5)}°
                    </p>
                    {userLocation.accuracy && (
                      <p className="text-[10px] text-slate-500 font-sans">
                        Accuracy: ±{Math.round(userLocation.accuracy)} meters
                      </p>
                    )}
                  </div>

                  <div className="pt-1 flex gap-1.5">
                    <button
                      onClick={handleResetToHub}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium rounded transition border border-slate-300"
                    >
                      Fleet Hub
                    </button>
                    <button
                      onClick={handleGetLocation}
                      className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded transition"
                    >
                      Refresh GPS
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
