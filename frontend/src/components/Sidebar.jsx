import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  AlertTriangle,
  Activity,
  ListFilter,
  ShieldAlert,
  Wrench,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { useFleet } from "../context/FleetContext";

function getRoleNavConfig(role) {
  switch (role) {
    case "PWD_ENGINEER":
      return {
        sectionTitle: "PWD Road & Infrastructure",
        roleTag: "Road Works Authority",
        primaryItems: [
          { to: "/roads", label: "Road Intelligence", icon: AlertTriangle, badge: "Defects" },
          { to: "/maintenance", label: "Work Orders & Repairs", icon: Wrench, badge: "SLA" },
          { to: "/command", label: "GIS Defect Heatmap", icon: LayoutDashboard },
          { to: "/analytics", label: "Infrastructure Quality", icon: BarChart3 },
          { to: "/events", label: "Defect Events Log", icon: ListFilter },
        ],
        secondaryTitle: "Fleet & City Context",
        secondaryItems: [
          { to: "/buses", label: "Live Transit Buses", icon: Bus },
          { to: "/traffic", label: "Traffic Density", icon: Activity },
          { to: "/incidents", label: "Road Incidents", icon: ShieldAlert },
          { to: "/settings", label: "Tolerances & Settings", icon: Settings },
        ],
      };

    case "TRANSPORT_OFFICER":
      return {
        sectionTitle: "Transit Fleet Operations",
        roleTag: "PMPML Fleet Division",
        primaryItems: [
          { to: "/buses", label: "Live Bus Fleet", icon: Bus, badge: "Live GPS" },
          { to: "/command", label: "Fleet GIS Tracking", icon: LayoutDashboard },
          { to: "/traffic", label: "Traffic Intelligence", icon: Activity, badge: "Congestion" },
          { to: "/incidents", label: "Incidents & ANPR", icon: ShieldAlert },
          { to: "/events", label: "Live Telemetry Feed", icon: ListFilter },
          { to: "/analytics", label: "Fleet Mobilization", icon: BarChart3 },
        ],
        secondaryTitle: "Civil Infrastructure",
        secondaryItems: [
          { to: "/roads", label: "Detected Road Defects", icon: AlertTriangle },
          { to: "/maintenance", label: "Contractor Status", icon: Wrench },
          { to: "/settings", label: "System Config", icon: Settings },
        ],
      };

    case "SYSTEM_ADMIN":
      return {
        sectionTitle: "BEL Platform Admin",
        roleTag: "Root Administration",
        primaryItems: [
          { to: "/settings", label: "Platform & PostGIS DB", icon: Settings, badge: "Root" },
          { to: "/analytics", label: "AI Accuracy & Latency", icon: BarChart3, badge: "YOLOv8" },
          { to: "/command", label: "Command Topology", icon: LayoutDashboard },
          { to: "/incidents", label: "Security & ANPR Logs", icon: ShieldAlert },
          { to: "/events", label: "Raw Telemetry Ingestion", icon: ListFilter },
          { to: "/buses", label: "Edge Compute Nodes", icon: Bus },
        ],
        secondaryTitle: "Operational Domains",
        secondaryItems: [
          { to: "/roads", label: "Road Surface Data", icon: AlertTriangle },
          { to: "/traffic", label: "Traffic Telemetry", icon: Activity },
          { to: "/maintenance", label: "Contractor Pipeline", icon: Wrench },
        ],
      };

    default: // MUNICIPAL_CONTROL
      return {
        sectionTitle: "Municipal Control Room",
        roleTag: "City Operations Command",
        primaryItems: [
          { to: "/command", label: "Command Center", icon: LayoutDashboard, badge: "HQ" },
          { to: "/buses", label: "Live Buses", icon: Bus },
          { to: "/roads", label: "Road Intelligence", icon: AlertTriangle },
          { to: "/traffic", label: "Traffic Intelligence", icon: Activity },
          { to: "/events", label: "Events Log", icon: ListFilter },
          { to: "/incidents", label: "Incidents & ANPR", icon: ShieldAlert },
          { to: "/maintenance", label: "Maintenance", icon: Wrench },
          { to: "/analytics", label: "Analytics", icon: BarChart3 },
          { to: "/settings", label: "Settings", icon: Settings },
        ],
        secondaryTitle: null,
        secondaryItems: [],
      };
  }
}

export default function Sidebar() {
  const { user, logout } = useFleet();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const navConfig = getRoleNavConfig(user?.role);

  const renderNavLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/command"}
        className={({ isActive }) =>
          `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
            isActive
              ? "bg-blue-50 text-[#0B3C74] font-bold border-l-4 border-[#0B3C74] pl-2 shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`
        }
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none h-[calc(100vh-4.25rem)] shadow-xs">
      <div className="p-3 space-y-1 overflow-y-auto flex-1">
        {/* Role Directorate Header */}
        <div className="px-3 py-1.5 mb-1 rounded bg-slate-50 border border-slate-200">
          <p className="text-[10px] font-bold tracking-wider text-[#0B3C74] uppercase truncate">
            {navConfig.sectionTitle}
          </p>
          <p className="text-[9px] text-slate-500 font-medium truncate">
            {navConfig.roleTag}
          </p>
        </div>

        {/* Primary Role Items */}
        <div className="space-y-0.5">
          {navConfig.primaryItems.map(renderNavLink)}
        </div>

        {/* Secondary Context Items (if role has them) */}
        {navConfig.secondaryItems.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-100 space-y-0.5">
            <div className="px-3 py-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
              {navConfig.secondaryTitle}
            </div>
            {navConfig.secondaryItems.map(renderNavLink)}
          </div>
        )}
      </div>

      {/* Minimized Officer Profile & Sign Out Bar */}
      <div className="p-2 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-sm shrink-0">
            {user?.emoji || "👮"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">
              {user?.name || "Officer"}
            </p>
            <p className="text-[9px] text-slate-500 leading-tight truncate">
              {user?.roleTitle || "City Operations"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          title="Sign Out Session"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition shrink-0 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3 h-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

