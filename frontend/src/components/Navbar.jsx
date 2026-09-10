import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, Bus as BusIcon, RefreshCw, Globe, LogOut, User, ChevronDown } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import TricolorBar from "./TricolorBar";

export default function Navbar() {
  const { summary, refreshData, loading, user, logout, isAuthenticated, selectedRegion, setRegion, issues, setSelectedIssue } = useFleet();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
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
      <TricolorBar />

      {/* Main Government Header - Standard h-16 matching Public & Auth pages */}
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Official Government Seal, Platform Title & Public Portal link */}
        <div className="flex items-center gap-3">
          {/* Official Emblem Badge */}
          <Link to="/command" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#0B3C74] border-2 border-amber-400/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5 text-amber-300"
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

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base tracking-tight text-[#0B3C74]">
                  नगर दृष्टि
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-bold text-sm tracking-wider text-slate-900">
                  NAGAR DRISHTI
                </span>
                <span className="bg-blue-50 text-[#0B3C74] border border-blue-200 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  {user?.roleTitle ? user.roleTitle.split(" ")[0].toUpperCase() : "HQ"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block leading-tight">
                Urban Fleet AI Monitoring • Central Operations Command
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Compact Status Badges & Quick Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* All-India Regional Transit Scope Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#0B3C74] shrink-0" />
            <span className="text-slate-500 font-medium hidden lg:inline">Scope:</span>
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

          {/* Active Fleet Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <BusIcon className="w-3.5 h-3.5 text-[#0B3C74]" />
            <span className="text-slate-500">Fleet:</span>
            <span className="font-bold text-slate-900 font-mono">
              {summary.active_buses || 22}/{summary.total_buses || 24}
            </span>
          </div>

          {/* Critical Alerts Indicator & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setAlertsOpen(!alertsOpen);
                setProfileOpen(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 transition cursor-pointer shadow-2xs active:scale-95"
              title="Click to view Active Critical Alerts"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="text-rose-600 font-semibold">Critical:</span>
              <span className="font-bold font-mono text-rose-800">
                {criticalList.length}
              </span>
            </button>

            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-rose-200 p-3.5 z-50 animate-scaleUp">
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
            className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Officer Profile & Sign Out Dropdown (Only Profile Avatar) */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              title={user?.name ? `${user.name} (${user.email})` : "Officer Account"}
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-400 transition cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B3C74] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs border-2 border-white">
                {user?.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "CR"}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-11 w-64 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 animate-fadeIn space-y-2.5">
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
