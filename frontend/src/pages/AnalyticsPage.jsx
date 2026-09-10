import React from "react";
import { BarChart3, TrendingUp, CheckCircle2, ShieldCheck, Clock, Layers } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useFleet } from "../context/FleetContext";

export default function AnalyticsPage() {
  const { summary } = useFleet();

  const wardData = [
    { ward: "Zone 4 (Dhankawadi)", potholes: 5, waterlogging: 2, total: 7 },
    { ward: "PCMC Zone B", potholes: 3, waterlogging: 4, total: 7 },
    { ward: "Zone 5 (Shivajinagar)", potholes: 4, waterlogging: 1, total: 5 },
    { ward: "Zone 3 (Hadapsar)", potholes: 3, waterlogging: 2, total: 5 },
    { ward: "Zone 2 (Kothrud)", potholes: 2, waterlogging: 1, total: 3 },
    { ward: "Zone 1 (Nagar Rd)", potholes: 2, waterlogging: 0, total: 2 },
  ];

  return (
    <div className="p-5 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#0B3C74]" />
          Municipal Road Intelligence &amp; Fleet Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Defect density by administrative ward, verification latency, and Mean Time to Repair (MTTR)
        </p>
      </div>

      {/* Top 4 Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Mean Time to Detect (MTTD)</span>
          <p className="text-3xl font-bold font-mono text-emerald-700 mt-1">18.5 mins</p>
          <span className="text-[10px] text-slate-500 mt-1 block">From defect emergence to 1st bus pass</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Mean Time to Verify (MTTV)</span>
          <p className="text-3xl font-bold font-mono text-[#0B3C74] mt-1">32.0 mins</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Independent 2nd bus confirmation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Mean Time to Repair (MTTR)</span>
          <p className="text-3xl font-bold font-mono text-amber-700 mt-1">14.2 hrs</p>
          <span className="text-[10px] text-slate-500 mt-1 block">From work order dispatch to patch</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Multi-Bus Accuracy Rate</span>
          <p className="text-3xl font-bold font-mono text-purple-700 mt-1">98.4%</p>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Zero false-positive work orders</span>
        </div>
      </div>

      {/* Ward Defect Distribution Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-slate-900 font-mono uppercase">
          Defect Density by Municipal Ward &amp; Division
        </h2>
        <p className="text-[11px] text-slate-500">
          Enables city authorities to allocate asphalt resurfacing budgets to high-defect transit corridors
        </p>

        <div className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wardData}>
              <XAxis dataKey="ward" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", color: "#0F172A", fontSize: 12, borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Bar dataKey="potholes" name="Potholes" fill="#DC2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="waterlogging" name="Waterlogging" fill="#0284C7" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#475569" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
