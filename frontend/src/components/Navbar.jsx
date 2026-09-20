import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, Bus as BusIcon, RefreshCw, Globe, LogOut, User, ChevronDown, Bell, AlertTriangle } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import TricolorBar from "./TricolorBar";

export default function Navbar() {
  const { summary, refreshData, loading, user, logout, isAuthenticated, selectedRegion, setRegion, issues, setSelectedIssue, triggerDummyAlarm } = useFleet();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alarmMenuOpen, setAlarmMenuOpen] = useState(false);
  const navigate = useNavigate();

  const criticalList = (issues || []).filter(
    (i) => (i.priority_level === "CRITICAL" || (i.priority_score && i.priority_score >= 80)) && i.status !== "RESOLVED"
  );

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs flex flex-col select-none">
      {/* Official Government of India Tricolor Accent Band & Loader */}
      <TricolorBar height="h-0.5" />

      {/* Main Government Header - Compact h-12 */}
      <div className="h-12 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2.5">
        {/* Left: Official Government Seal, Platform Title & Public Portal link */}
        <div className="flex items-center gap-2">
          {/* Official Emblem Badge */}
          <Link to="/command" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-[#0B3C74] border border-amber-400/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-4 h-4 text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" strokeWidth="1.2" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>

            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-black text-sm tracking-tight text-[#0B3C74]">
                नगर दृष्टि
              </span>
              <span className="text-slate-300 text-xs">|</span>
              <span className="font-bold text-xs tracking-wider text-slate-800 hidden sm:inline">
                NAGAR DRISHTI
              </span>
              <span className="bg-blue-50 text-[#0B3C74] border border-blue-200 text-[9px] font-mono px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                {user?.roleTitle ? user.roleTitle.split(" ")[0].toUpperCase() : "HQ"}
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Compact Status Badges & Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* All-India Regional Transit Scope Selector */}
          <div className="flex items-center gap-1 px-2 h-7 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 shadow-2xs whitespace-nowrap">
            <Globe className="w-3 h-3 text-[#0B3C74] shrink-0" />
            <span className="text-slate-500 font-medium text-[11px] hidden xl:inline">Scope:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-transparent font-bold text-[#0B3C74] focus:outline-none cursor-pointer text-xs pr-1"
              title="Filter Fleet Operations across All 28 Indian States and Metros"
            >
              <option value="ALL_INDIA">🇮🇳 All India (All 28 States &amp; UTs)</option>
              <optgroup label="Maharashtra Metropolitan Hubs">
                <option value="MH_PUNE">Pune (PMC / PMPML)</option>
                <option value="MH_MUMBAI">Mumbai (BEST / MSRTC)</option>
              </optgroup>
              <optgroup label="Major States &amp; Metropolitan Hubs">
                <option value="DL_DELHI">Delhi (DTC / NCT)</option>
                <option value="KA_BENGALURU">Bengaluru (BMTC / Karnataka)</option>
                <option value="TN_CHENNAI">Chennai (MTC / Tamil Nadu)</option>
                <option value="TG_HYDERABAD">Hyderabad (TSRTC / Telangana)</option>
                <option value="GJ_AHMEDABAD">Ahmedabad (AMTS / Gujarat)</option>
                <option value="WB_KOLKATA">Kolkata (WBTC / West Bengal)</option>
                <option value="RJ_JAIPUR">Jaipur (JCTSL / Rajasthan)</option>
                <option value="UP_LUCKNOW">Lucknow (UPSRTC / Uttar Pradesh)</option>
                <option value="KL_KOCHI">Kochi (KSRTC / Kerala)</option>
                <option value="MP_BHOPAL">Bhopal (BCLL / Madhya Pradesh)</option>
                <option value="PB_CHANDIGARH">Chandigarh (CTU / Punjab)</option>
                <option value="AP_VIZAG">Visakhapatnam (APSRTC / Andhra Pradesh)</option>
                <option value="BR_PATNA">Patna (BSRTC / Bihar)</option>
                <option value="OD_BHUBANESWAR">Bhubaneswar (Mo Bus / Odisha)</option>
                <option value="AS_GUWAHATI">Guwahati (ASTC / Assam)</option>
                <option value="HR_GURUGRAM">Gurugram (GMCBL / Haryana)</option>
                <option value="JH_RANCHI">Ranchi (JRNMT / Jharkhand)</option>
                <option value="CG_RAIPUR">Raipur (RMC / Chhattisgarh)</option>
                <option value="UK_DEHRADUN">Dehradun (UTC / Uttarakhand)</option>
                <option value="HP_SHIMLA">Shimla (HRTC / Himachal Pradesh)</option>
                <option value="GA_PANAJI">Panaji (KTCL / Goa)</option>
                <option value="JK_SRINAGAR">Srinagar (JKSRTC / J&amp;K)</option>
                <option value="SK_GANGTOK">Gangtok (SNT / Sikkim)</option>
                <option value="TR_AGARTALA">Agartala (TRTC / Tripura)</option>
                <option value="MN_IMPHAL">Imphal (MST / Manipur)</option>
                <option value="ML_SHILLONG">Shillong (MTC / Meghalaya)</option>
                <option value="MZ_AIZAWL">Aizawl (MST / Mizoram)</option>
                <option value="NL_KOHIMA">Kohima (NST / Nagaland)</option>
                <option value="AR_ITANAGAR">Itanagar (APSTS / Arunachal)</option>
              </optgroup>
            </select>
          </div>

          {/* Supabase Cloud Live Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 h-7 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold">SUPABASE CLOUD</span>
            <span className="text-emerald-600 text-[9px] bg-emerald-100/80 px-1 py-0.2 rounded font-semibold">ap-south-1</span>
          </div>

          {/* Active Fleet Indicator */}
          <div className="hidden md:flex items-center gap-1 px-2 h-7 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 whitespace-nowrap">
            <BusIcon className="w-3 h-3 text-[#0B3C74] shrink-0" />
            <span className="text-slate-500 text-[11px]">Fleet:</span>
            <span className="font-bold text-slate-900 font-mono text-xs">
              {summary.active_buses || 22}/{summary.total_buses || 24}
            </span>
          </div>

          {/* SIH Live Incident Alarm Simulator Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setAlarmMenuOpen(!alarmMenuOpen);
                setAlertsOpen(false);
                setProfileOpen(false);
              }}
              className="flex items-center gap-1 px-2 h-7 rounded-md bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer active:scale-95 whitespace-nowrap"
              title="Trigger Live SIH 26124 Emergency Incident Alarm"
            >
              <Bell className="w-3 h-3 text-yellow-300 shrink-0" />
              <span className="tracking-wide">Alarm</span>
              <ChevronDown className="w-2.5 h-2.5 text-red-200 shrink-0" />
            </button>

            {alarmMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-slate-950 text-white rounded-xl shadow-2xl border border-red-500/50 p-3 z-50 animate-scaleUp font-mono whitespace-normal overflow-hidden">
                <div className="flex items-center justify-between border-b border-red-900/60 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
                      Simulate SIH Incident
                    </span>
                  </div>
                  <span className="text-[10px] text-yellow-400 font-bold px-1.5 py-0.5 rounded bg-black/60 border border-yellow-500/30">
                    Live Demo
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerDummyAlarm("HIT_AND_RUN");
                      setAlarmMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 border border-red-700/50 transition cursor-pointer group flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-red-200 group-hover:text-white">
                      <span>🚗 Hit-and-Run Tracking</span>
                      <span className="text-[10px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded font-mono">
                        ANPR 94.2%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal font-sans">
                      Offending vehicle MH 19 6996 tracked with ByteTrack + GPS
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerDummyAlarm("PEDESTRIAN_RISK");
                      setAlarmMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/70 border border-amber-700/50 transition cursor-pointer group flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-200 group-hover:text-white">
                      <span>🚸 Vulnerable Pedestrians</span>
                      <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                        School Zone
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal font-sans">
                      4 school children crossing with rapid 42 km/h vehicle approach
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerDummyAlarm("RASH_DRIVING");
                      setAlarmMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-orange-950/50 hover:bg-orange-900/70 border border-orange-700/50 transition cursor-pointer group flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-orange-200 group-hover:text-white">
                      <span>⚡ Rash Driving &amp; BRTS</span>
                      <span className="text-[10px] bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded font-mono">
                        68 km/h
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal font-sans">
                      Motorcycle incursion in segregated bus lane (MH 14 DE 4567)
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Critical Alerts Indicator & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setAlertsOpen(!alertsOpen);
                setAlarmMenuOpen(false);
                setProfileOpen(false);
              }}
              className="hidden sm:flex items-center gap-1 px-2 h-7 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
              title="Click to view Active Critical Alerts"
            >
              <ShieldAlert className="w-3 h-3 text-rose-600 animate-pulse shrink-0" />
              <span className="text-rose-600 font-semibold text-[11px]">Critical:</span>
              <span className="font-bold font-mono text-rose-800 text-xs">
                {criticalList.length}
              </span>
            </button>

            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-rose-200 p-3.5 z-50 animate-scaleUp whitespace-normal overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1 font-mono">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Critical Alerts ({criticalList.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Live Telemetry</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {criticalList.length > 0 ? (
                    criticalList.slice(0, 5).map((iss) => (
                      <div
                        key={iss.id}
                        onClick={() => {
                          setSelectedIssue(iss);
                          setAlertsOpen(false);
                        }}
                        className="p-2.5 rounded-lg bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200/80 transition cursor-pointer text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#0B3C74]">{iss.issue_code}</span>
                          <span className="font-mono font-bold text-rose-800 text-[10px] bg-rose-200/80 px-1.5 py-0.5 rounded">
                            Sev {iss.severity}/10
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 truncate text-[11px]">{iss.issue_type.replace(/_/g, " ")}</p>
                        <p className="text-slate-500 text-[10px] truncate">{iss.location_name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-slate-500">No unresolved critical alerts.</p>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-200 text-center">
                  <Link
                    to="/roads"
                    onClick={() => setAlertsOpen(false)}
                    className="text-[11px] font-bold text-[#0B3C74] hover:underline"
                  >
                    Open Road Intelligence Center &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={refreshData}
            disabled={loading}
            title="Refresh Real-Time Feeds"
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition shadow-2xs cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Officer Profile & Sign Out Dropdown (Only Profile Avatar) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              title={user?.name ? `${user.name} (${user.email})` : "Officer Account"}
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-400 transition cursor-pointer focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-[#0B3C74] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs border border-white">
                {user?.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "CR"}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-9 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 animate-fadeIn space-y-2.5 whitespace-normal">
                <div className="pb-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{user?.email}</p>
                  <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#0B3C74] border border-blue-200 font-bold">
                    {user?.department}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <Link
                    to="/"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span>Public Home Portal</span>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-700 hover:bg-rose-50 transition font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
