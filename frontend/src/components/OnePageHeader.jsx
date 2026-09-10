import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, ArrowRight, Activity, ChevronRight, Bus, Building2, User } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import TricolorBar from "./TricolorBar";

export default function OnePageHeader() {
  const { isAuthenticated, user } = useFleet();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* 1. Official Government of India Tricolor Ribbon & Loader */}
      <TricolorBar />

      {/* 2. Main Navigation Bar */}
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 font-bold" style={{ color: "#0B3C74", WebkitTextFillColor: "#0B3C74" }}>
                INDIA
              </span>
            </div>
            <p className="text-[10px] font-medium leading-tight" style={{ color: "#1E293B", WebkitTextFillColor: "#1E293B" }}>
              AI-Powered Mobile Urban Intelligence Platform • Government of India
            </p>
          </div>
        </Link>

        {/* Navigation Links: Home, About Us, Tech, Impact */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-700">
          <button
            onClick={() => scrollToSection("home")}
            className="hover:text-[#0B3C74] transition py-1 cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("about")}
            className="hover:text-[#0B3C74] transition py-1 cursor-pointer"
          >
            About Us
          </button>
          <button
            onClick={() => scrollToSection("technology")}
            className="hover:text-[#0B3C74] transition py-1 cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("impact")}
            className="hover:text-[#0B3C74] transition py-1 cursor-pointer"
          >
            Citizen Impact
          </button>
        </nav>

        {/* Sign In Option for Central Command */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900">{user.name}</span>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">● Central Session Active</span>
              </div>
              <button
                onClick={() => navigate("/command")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3C74] hover:bg-[#072850] text-white text-xs font-semibold shadow-xs transition active:scale-95 border border-[#0B3C74]"
              >
                <Activity className="w-3.5 h-3.5 text-blue-200" />
                <span>Enter Central Command</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B3C74] hover:bg-[#072850] text-white text-xs font-semibold shadow-xs transition active:scale-95 border border-[#0B3C74]"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Sign In for Central</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
