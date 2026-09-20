import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../services/api";
import { wsService } from "../services/websocket";
import { INDIA_REGIONS, ALL_INDIA_STATES, generateAllIndiaBuses } from "../data/indiaRegions";
import { DEFAULT_ISSUES } from "../data/defaultIssues";

const FleetContext = createContext(null);

export const DEMO_USERS = {
  MUNICIPAL_CONTROL: {
    key: "MUNICIPAL_CONTROL",
    name: "Dr. Rajesh Kulkarni",
    email: "control.hq@pmc.gov.in",
    role: "MUNICIPAL_CONTROL",
    roleTitle: "Municipal Control Room",
    subTitle: "City Operations",
    designation: "Chief City Operations Controller",
    department: "PMC Central Command & Control Directorate",
    divisionCode: "PMC-CTRL-HQ",
    badgeId: "PMC-MCR-8842",
    clearance: "Level 4 · City Operations Command",
    accent: "#2563EB",
    emoji: "👮",
  },
  PWD_ENGINEER: {
    key: "PWD_ENGINEER",
    name: "Er. Vikram Patil",
    email: "pwd.chief@pmc.gov.in",
    role: "PWD_ENGINEER",
    roleTitle: "PWD Chief Engineer",
    subTitle: "Road & Infrastructure",
    designation: "Chief Executive Road Works Engineer",
    department: "Public Works & Asphalt Directorate",
    divisionCode: "PWD-INFRA-Z4",
    badgeId: "PWD-EXEC-7193",
    clearance: "Level 3 · Infrastructure Approvals",
    accent: "#D97706",
    emoji: "🏗️",
  },
  TRANSPORT_OFFICER: {
    key: "TRANSPORT_OFFICER",
    name: "Shri Ajay Gaikwad",
    email: "fleet.ctrl@pmpml.gov.in",
    role: "TRANSPORT_OFFICER",
    roleTitle: "Transport Control Officer",
    subTitle: "Fleet Operations",
    designation: "Superintendent of Public Transit Fleets",
    department: "PMPML Transit Operations Directorate",
    divisionCode: "PMPML-FLEET-DIV",
    badgeId: "PMPML-TCO-5021",
    clearance: "Level 3 · Fleet & Transit Dispatch",
    accent: "#059669",
    emoji: "🚌",
  },
  SYSTEM_ADMIN: {
    key: "SYSTEM_ADMIN",
    name: "Anand Sharma",
    email: "sysadmin@bel.gov.in",
    role: "SYSTEM_ADMIN",
    roleTitle: "System Administrator",
    subTitle: "Platform Administration",
    designation: "Lead Systems & AI Network Architect",
    department: "Bharat Electronics Ltd (Smart Automation)",
    divisionCode: "BEL-SMART-SYS",
    badgeId: "BEL-SYS-4019",
    clearance: "Level 5 · Root Platform Administration",
    accent: "#7C3AED",
    emoji: "⚙️",
  },
};

// Aliases for compatibility with any legacy references
DEMO_USERS.CONTROLLER = DEMO_USERS.MUNICIPAL_CONTROL;
DEMO_USERS.BEL_ADMIN = DEMO_USERS.SYSTEM_ADMIN;

export function FleetProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("nagar_user") || localStorage.getItem("nagar_user");
      return saved ? JSON.parse(saved) : DEMO_USERS.MUNICIPAL_CONTROL;
    } catch {
      return DEMO_USERS.MUNICIPAL_CONTROL;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem("nagar_auth") === "true";
    } catch {
      return false;
    }
  });

  const [buses, setBuses] = useState([]);
  const [allBuses, setAllBuses] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("ALL_INDIA");
  const [selectedState, setSelectedState] = useState("ALL");
  const [issues, setIssues] = useState(DEFAULT_ISSUES);
  const [summary, setSummary] = useState({
    total_buses: 24,
    active_buses: 22,
    total_issues: 14,
    verified_issues: 12,
    critical_issues: 8,
    resolved_issues: 2,
    road_health_index: 84.5,
    traffic_congestion_index: 54.0,
    bus_coverage_percent: 94.2
  });
  const [trafficSummary, setTrafficSummary] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [isFleetDemoModalOpen, setIsFleetDemoModalOpen] = useState(false);
  const [isSimulatingFleet, setIsSimulatingFleet] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState(null);

  const triggerDummyAlarm = useCallback((scenario = "HIT_AND_RUN") => {
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour12: false });
    let dummyData = null;

    if (scenario === "HIT_AND_RUN") {
      dummyData = {
        id: "ALARM-" + Date.now(),
        incident_code: "INC-2048",
        incident_type: "HIT_AND_RUN",
        title: "CRITICAL: HIT-AND-RUN OFFENDING VEHICLE DETECTED",
        severity: "CRITICAL",
        risk_score: 98,
        bus_id: "BUS-102",
        bus_reg_number: "MH 12 Q 3017",
        camera_id: "Front Windshield (AI Road Cam)",
        vehicle_class: "SUV (Black Metallic)",
        registration_number: "MH 19 6996",
        plate_confidence: 0.942,
        tracking_duration: 12.4,
        speed_kmh: 58.2,
        latitude: 18.5082,
        longitude: 73.8329,
        location_name: "Karve Road near Nal Stop Junction, Pune",
        description: "Black SUV collided with two-wheeler on Karve Road and accelerated through junction without stopping. ByteTrack algorithm maintained lock for 12.4s.",
        timestamp: new Date().toISOString(),
        time_formatted: nowStr,
        bandwidth_bytes: "1.4 KB",
        alert_status: "SECURE_ALERT_DISPATCHED",
        recipient: "Pune Traffic Police Cyber Cell & 112 Control"
      };
    } else if (scenario === "PEDESTRIAN_RISK") {
      dummyData = {
        id: "ALARM-" + Date.now(),
        incident_code: "PED-4109",
        incident_type: "PEDESTRIAN_RISK",
        title: "VULNERABLE PEDESTRIAN HAZARD: SCHOOL CHILDREN CROSSING",
        severity: "CRITICAL",
        risk_score: 89,
        bus_id: "BUS-110",
        bus_reg_number: "MH 12 RN 4821",
        camera_id: "Curbside Flank Camera",
        pedestrian_scenario: "SCHOOL_CHILDREN_CROSSING",
        pedestrian_count: 4,
        vehicle_proximity_m: 18.0,
        vehicle_speed_kmh: 42.0,
        latitude: 18.5144,
        longitude: 73.8762,
        location_name: "Camp School Zone near St. Vincent High School, Pune",
        description: "School children crossing carriageway without active crossing guard. Rapid vehicle approach detected at 42 km/h within 18m collision envelope.",
        timestamp: new Date().toISOString(),
        time_formatted: nowStr,
        bandwidth_bytes: "1.2 KB",
        alert_status: "CIVIC_SAFETY_ALERT_ACTIVE",
        recipient: "PMC Road Safety Cell & School Warden"
      };
    } else {
      dummyData = {
        id: "ALARM-" + Date.now(),
        incident_code: "INC-3812",
        incident_type: "RASH_DRIVING",
        title: "RASH DRIVING & DEDICATED BRTS BUS LANE INCURSION",
        severity: "HIGH",
        risk_score: 84,
        bus_id: "BUS-105",
        bus_reg_number: "MH 12 TR 8941",
        camera_id: "Rear Traffic Radar Camera",
        vehicle_class: "MOTORCYCLE (High Speed)",
        registration_number: "MH 14 DE 4567",
        plate_confidence: 0.965,
        tracking_duration: 8.6,
        speed_kmh: 68.0,
        latitude: 18.4990,
        longitude: 73.8568,
        location_name: "Swargate BRTS Dedicated Corridor, Pune",
        description: "Unauthorized two-wheeler traveling at 68 km/h in segregated BRTS lane tailgating public transit bus within 6m buffer.",
        timestamp: new Date().toISOString(),
        time_formatted: nowStr,
        bandwidth_bytes: "1.3 KB",
        alert_status: "E-CHALLAN_QUEUED",
        recipient: "PMPML BRTS Enforcement Squad"
      };
    }

    setActiveAlarm(dummyData);

    // Optional background sync with backend simulation endpoint
    try {
      if (scenario === "HIT_AND_RUN" && api.simulateHitAndRun) {
        api.simulateHitAndRun().catch(() => {});
      } else if (scenario === "PEDESTRIAN_RISK" && api.simulateSchoolCrossing) {
        api.simulateSchoolCrossing().catch(() => {});
      }
    } catch (e) {
      console.warn("Backend alarm notice:", e);
    }
  }, []);

  const triggerPageLoading = useCallback((duration = 450) => {
    setIsPageLoading(true);
    setTimeout(() => {
      setIsPageLoading(false);
    }, duration);
  }, []);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const currentRegion = useMemo(() => {
    return INDIA_REGIONS.find((r) => r.id === selectedRegion) || INDIA_REGIONS[0];
  }, [selectedRegion]);

  const setRegion = useCallback((regionId) => {
    setSelectedRegion(regionId);
    const reg = INDIA_REGIONS.find((r) => r.id === regionId);
    if (reg) {
      if (reg.state !== "All India") {
        setSelectedState(reg.state);
      } else {
        setSelectedState("ALL");
      }
      addToast(`Transit Scope switched to ${reg.name}`, "info");
      triggerPageLoading(400);
    }
  }, [addToast, triggerPageLoading]);

  // Dynamically filter fleet according to selected state or metropolitan hub
  const filteredBuses = useMemo(() => {
    if (!allBuses || allBuses.length === 0) return buses;

    if (selectedRegion === "ALL_INDIA") {
      if (selectedState && selectedState !== "ALL") {
        return allBuses.filter((b) => b.state === selectedState);
      }
      return allBuses;
    }

    return allBuses.filter((b) => b.region_id === selectedRegion);
  }, [allBuses, buses, selectedRegion, selectedState]);

  // Dynamically update KPIs based on the current filtered fleet scope
  const currentSummary = useMemo(() => {
    if (!filteredBuses || filteredBuses.length === 0) return summary;
    const activeCount = filteredBuses.filter((b) => b.status === "ACTIVE").length;
    const totalCount = filteredBuses.length;
    return {
      ...summary,
      total_buses: totalCount,
      active_buses: activeCount,
      bus_coverage_percent: totalCount > 0 ? parseFloat(((activeCount / totalCount) * 100).toFixed(1)) : 94.2,
    };
  }, [summary, filteredBuses]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, busesRes, issuesRes, eventsRes, trafficRes] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getBuses().catch(() => []),
        api.getIssues().catch(() => []),
        api.getEvents({ limit: 15 }).catch(() => []),
        api.getTrafficSummary().catch(() => null),
      ]);

      if (summaryRes) setSummary(summaryRes);
      if (busesRes) {
        setBuses(busesRes);
        const nationalBuses = generateAllIndiaBuses(busesRes);
        setAllBuses(nationalBuses);
      }
      if (issuesRes) setIssues(issuesRes);
      if (eventsRes) setRecentEvents(eventsRes);
      if (trafficRes) setTrafficSummary(trafficRes);
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load of general dashboard data
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time telemetry stream (only when in authenticated central operations)
  useEffect(() => {
    if (!isAuthenticated) return;
    wsService.connect();

    const unsubscribe = wsService.subscribe((msg) => {
      if (msg.type === "NEW_EVENT") {
        addToast(`New ${msg.event_type} detected by ${msg.bus_id}! Priority: ${msg.priority_score}`, "warning");
        refreshData();
      } else if (msg.type === "ISSUE_STATUS_UPDATED") {
        addToast(`Issue #${msg.issue_id} status updated to ${msg.to_status}`, "info");
        refreshData();
      } else if (msg.type === "ISSUE_ASSIGNED") {
        addToast(`Issue #${msg.issue_id} assigned to ${msg.contractor}`, "info");
        refreshData();
      } else if (msg.type === "ISSUE_RECHECKED") {
        addToast(`Issue #${msg.issue_id} rechecked! New status: ${msg.status}`, "success");
        refreshData();
      } else if (msg.type === "NEW_INCIDENT") {
        addToast(`Alert: ${msg.incident_type} logged (${msg.license_plate || msg.risk_level})`, "error");
        refreshData();
      } else if (msg.type === "FLEET_UPDATE" && msg.buses) {
        setBuses((prev) => {
          const map = new Map(prev.map((b) => [b.bus_id, b]));
          msg.buses.forEach((ub) => {
            if (map.has(ub.bus_id)) {
              const existing = map.get(ub.bus_id);
              map.set(ub.bus_id, { ...existing, latitude: ub.latitude, longitude: ub.longitude, speed_kmh: ub.speed_kmh });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [isAuthenticated, refreshData, addToast]);

  // Periodic simulated fleet movements (only when authenticated)
  useEffect(() => {
    if (!isSimulatingFleet || !isAuthenticated) return;
    const timer = setInterval(() => {
      api.advanceFleet().catch(() => {});
    }, 6000);
    return () => clearInterval(timer);
  }, [isSimulatingFleet, isAuthenticated]);

  const login = useCallback((userData) => {
    const finalUser = { ...DEMO_USERS.CONTROLLER, ...userData };
    setUser(finalUser);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem("nagar_user", JSON.stringify(finalUser));
      sessionStorage.setItem("nagar_auth", "true");
    } catch {}
    addToast(`Authenticated as ${finalUser.name} (${finalUser.roleTitle})`, "success");
  }, [addToast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem("nagar_auth");
      sessionStorage.removeItem("nagar_user");
      localStorage.removeItem("nagar_auth");
      localStorage.removeItem("nagar_user");
    } catch {}
    addToast("Signed out of Central Command session. Access locked.", "info");
  }, [addToast]);

  return (
    <FleetContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        buses: filteredBuses,
        allBuses,
        rawBuses: buses,
        issues,
        summary: currentSummary,
        rawSummary: summary,
        trafficSummary,
        recentEvents,
        selectedIssue,
        setSelectedIssue,
        selectedBus,
        setSelectedBus,
        isFleetDemoModalOpen,
        setIsFleetDemoModalOpen,
        isSihModalOpen: isFleetDemoModalOpen,
        setIsSihModalOpen: setIsFleetDemoModalOpen,
        isSimulatingFleet,
        setIsSimulatingFleet,
        toasts,
        addToast,
        refreshData,
        loading,
        setLoading,
        isPageLoading,
        setIsPageLoading,
        triggerPageLoading,
        selectedRegion,
        setSelectedRegion,
        selectedState,
        setSelectedState,
        setRegion,
        currentRegion,
        activeAlarm,
        setActiveAlarm,
        triggerDummyAlarm,
        INDIA_REGIONS,
        ALL_INDIA_STATES
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet must be used within FleetProvider");
  return context;
}
