import React from "react";

export default function PriorityBadge({ score, level }) {
  const getStyle = () => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300";
      case "HIGH":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {score !== undefined ? `${Math.round(score)}` : ""} {level || "NORMAL"}
    </span>
  );
}
