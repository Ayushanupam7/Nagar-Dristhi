import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFleet, DEMO_USERS } from "../context/FleetContext";
import TricolorBar from "../components/TricolorBar";

/**
 * Resolves user role and target dashboard based on officer email or identifier.
 * Roles and scopes are determined by the backend / credentials.
 */
function resolveOfficerRole(identifier) {
  const id = (identifier || "").toLowerCase().trim();

  if (id.includes("pwd") || id.includes("road") || id.includes("infra") || id.includes("vikram")) {
    return {
      user: DEMO_USERS.PWD_ENGINEER,
      targetRoute: "/roads", // Road & Infrastructure Dashboard
    };
  }

  if (id.includes("transport") || id.includes("fleet") || id.includes("pmpml") || id.includes("bus") || id.includes("ajay")) {
    return {
      user: DEMO_USERS.TRANSPORT_OFFICER,
      targetRoute: "/buses", // Fleet Operations Dashboard
    };
  }

  if (id.includes("admin") || id.includes("sys") || id.includes("bel") || id.includes("anand") || id.includes("root")) {
    return {
      user: DEMO_USERS.SYSTEM_ADMIN,
      targetRoute: "/settings", // System Administration
    };
  }

  // Default: Municipal Control Room -> Pune City Operations Dashboard
  return {
    user: DEMO_USERS.MUNICIPAL_CONTROL,
    targetRoute: "/command", // Pune City Dashboard
  };
}

export default function AuthPage() {
  const { login, isAuthenticated, user } = useFleet();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("control.hq@pmc.gov.in");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const target =
        user?.role === "PWD_ENGINEER"
          ? "/roads"
          : user?.role === "TRANSPORT_OFFICER"
          ? "/buses"
          : user?.role === "SYSTEM_ADMIN"
          ? "/settings"
          : "/command";
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Official Email or Officer ID.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    // Simulate authentic government SSO verification and role resolution
    setTimeout(() => {
      const { user: resolvedUser, targetRoute } = resolveOfficerRole(identifier);
      login(resolvedUser);
      setLoading(false);
      navigate(targetRoute);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-slate-900">
      {/* ── Top Header matching Public Page ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        {/* 1. Official Government of India Tricolor Ribbon & Loader */}
        <TricolorBar loading={loading} />

        {/* 2. Main Navigation Bar matching Public Page (h-16, max-w-7xl) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Seal */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#0B3C74] flex items-center justify-center text-amber-300 font-bold border-2 border-amber-400 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-amber-300" aria-label="National Emblem">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#0B3C74]">
                  नगर दृष्टि
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-bold text-sm tracking-wider text-slate-900">
                  NAGAR DRISHTI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 font-bold text-[#0B3C74]">
                  INDIA
                </span>
              </div>
              <p className="text-[10px] font-medium leading-tight text-slate-700">
                Urban Intelligence Platform • Government of India • Ministry of Housing &amp; Urban Affairs
              </p>
            </div>
          </Link>

          {/* Right link: Return to Public Portal */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0B3C74] hover:text-blue-800 transition py-1.5 px-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
          >
            ← Return to Public Portal
          </Link>
        </div>
      </header>

      {/* ── Main Login Section with Temporary Officer Reference Side Card ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-4xl flex flex-col md:flex-row items-stretch justify-center gap-6">

          {/* ── 1. Official Officer Login Form Card ── */}
          <div className="w-full md:w-1/2 bg-white border border-slate-300 rounded p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              {/* Title & Subtitle */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900 mb-1">
                  Officer Login
                </h1>
                <p className="text-xs text-slate-600">
                  Sign in to access Nagar Drishti
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Official Email / Officer ID */}
                <div>
                  <label
                    htmlFor="officer-id"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Official Email / Officer ID
                  </label>
                  <input
                    id="officer-id"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="officer@agency.gov.in"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0B3C74] transition"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="officer-pwd"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="officer-pwd"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0B3C74] transition"
                  />
                </div>

                {/* Simple Government Blue Login Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0B3C74] hover:bg-[#092e59] text-white font-semibold py-2.5 px-4 rounded text-xs tracking-wider transition uppercase cursor-pointer disabled:opacity-70"
                  >
                    {loading ? "AUTHENTICATING…" : "LOGIN"}
                  </button>
                </div>

                {/* Small Authorized Personnel Text */}
                <p className="text-[11px] text-slate-500 text-center pt-2">
                  Authorized government personnel only.
                </p>
              </form>
            </div>
          </div>

          {/* ── 2. Temporary Side Card: Supported Officer Logins ── */}
          <div className="w-full md:w-1/2 bg-slate-50 border border-slate-300 rounded p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header Badge & Title */}
              <div className="mb-4">
                <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-[#0B3C74] bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded mb-2">
                  Temporary Reference Directory
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Supported Officer Logins
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Role and geographic scope are automatically determined upon login. Click any entry to populate credentials:
                </p>
              </div>

              {/* Clickable Quick-Select Officer List */}
              <div className="space-y-2">
                {/* 1. Municipal Control Room */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier("control.hq@pmc.gov.in");
                    setPassword("admin123");
                  }}
                  className={`w-full text-left p-2.5 rounded border transition text-xs ${
                    identifier === "control.hq@pmc.gov.in"
                      ? "bg-white border-[#0B3C74] ring-1 ring-[#0B3C74]/20 shadow-xs"
                      : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Municipal Control Room
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      → Pune Dashboard
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 block mt-0.5">
                    control.hq@pmc.gov.in
                  </span>
                </button>

                {/* 2. PWD Chief Engineer */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier("pwd.chief@pmc.gov.in");
                    setPassword("admin123");
                  }}
                  className={`w-full text-left p-2.5 rounded border transition text-xs ${
                    identifier === "pwd.chief@pmc.gov.in"
                      ? "bg-white border-[#0B3C74] ring-1 ring-[#0B3C74]/20 shadow-xs"
                      : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      PWD Chief Engineer
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      → Roads Dashboard
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 block mt-0.5">
                    pwd.chief@pmc.gov.in
                  </span>
                </button>

                {/* 3. Transport Control Officer */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier("fleet.ctrl@pmpml.gov.in");
                    setPassword("admin123");
                  }}
                  className={`w-full text-left p-2.5 rounded border transition text-xs ${
                    identifier === "fleet.ctrl@pmpml.gov.in"
                      ? "bg-white border-[#0B3C74] ring-1 ring-[#0B3C74]/20 shadow-xs"
                      : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Transport Control Officer
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      → Fleet Dashboard
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 block mt-0.5">
                    fleet.ctrl@pmpml.gov.in
                  </span>
                </button>

                {/* 4. System Administrator */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier("sysadmin@bel.gov.in");
                    setPassword("admin123");
                  }}
                  className={`w-full text-left p-2.5 rounded border transition text-xs ${
                    identifier === "sysadmin@bel.gov.in"
                      ? "bg-white border-[#0B3C74] ring-1 ring-[#0B3C74]/20 shadow-xs"
                      : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      System Administrator
                    </span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      → Admin Settings
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 block mt-0.5">
                    sysadmin@bel.gov.in
                  </span>
                </button>
              </div>
            </div>

            {/* Side Card Footer Note */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Passcode: <strong className="font-mono text-slate-700">admin123</strong></span>
              <span className="text-slate-400">Click to auto-fill</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Government of India | Ministry of Housing &amp; Urban Affairs
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Nagar Drishti | Urban Intelligence Platform
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
          Version 1.0
        </p>
      </footer>
    </div>
  );
}
