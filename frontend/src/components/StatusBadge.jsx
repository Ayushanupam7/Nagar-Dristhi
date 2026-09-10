import React from "react";
import { CheckCircle2, AlertTriangle, Clock, Wrench, ShieldCheck, Search } from "lucide-react";

export default function StatusBadge({ status }) {
  const normalized = status?.toUpperCase() || "DETECTED";

  const config = {
    DETECTED: {
      label: "DETECTED",
      style: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock
    },
    VERIFIED: {
      label: "VERIFIED",
      style: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-300",
      icon: ShieldCheck
    },
    PRIORITIZED: {
      label: "PRIORITIZED",
      style: "bg-purple-50 text-purple-700 border-purple-200",
      icon: AlertTriangle
    },
    ASSIGNED: {
      label: "ASSIGNED",
      style: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: Wrench
    },
    REPAIRED: {
      label: "REPAIRED",
      style: "bg-teal-50 text-teal-700 border-teal-200",
      icon: CheckCircle2
    },
    RECHECKED: {
      label: "RECHECKED",
      style: "bg-cyan-50 text-cyan-800 border-cyan-200",
      icon: Search
    },
    RESOLVED: {
      label: "RESOLVED",
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: CheckCircle2
    }
  };

  const current = config[normalized] || config.DETECTED;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${current.style}`}>
      <Icon className="w-3 h-3" />
      <span>{current.label}</span>
    </span>
  );
}
