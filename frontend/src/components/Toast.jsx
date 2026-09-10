import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { useFleet } from "../context/FleetContext";

export default function ToastContainer() {
  const { toasts } = useFleet();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-16 right-4 z-[10000] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          warning: AlertTriangle,
          error: AlertCircle,
          success: CheckCircle2,
          info: Info,
        };
        const Icon = icons[toast.type] || Info;

        const borderStyles = {
          warning: "border-amber-500/60 bg-gray-900/95 text-amber-300",
          error: "border-red-500/60 bg-gray-900/95 text-red-300",
          success: "border-emerald-500/60 bg-gray-900/95 text-emerald-300",
          info: "border-blue-500/60 bg-gray-900/95 text-blue-300",
        };

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-auto ${
              borderStyles[toast.type] || borderStyles.info
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-gray-200 leading-snug">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
