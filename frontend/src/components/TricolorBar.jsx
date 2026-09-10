import React from "react";
import { useFleet } from "../context/FleetContext";

/**
 * Official Government of India Tricolor Ribbon & Dynamic Loader
 * 
 * - When loading (used as loader): Streams actively towards the right with an animated
 *   saffron-white-green gradient and energized runner beam.
 * - When idle: Displays the authentic static tricolor or ambient rightward flow if configured.
 * - Can be placed on headers, cards, modals, or as a global route transition indicator.
 */
export default function TricolorBar({
  loading: explicitLoading,
  height = "h-1",
  alwaysAnimate = false,
  className = "",
}) {
  let fleet = null;
  try {
    fleet = useFleet();
  } catch {
    fleet = null;
  }

  const isLoading =
    explicitLoading !== undefined
      ? Boolean(explicitLoading)
      : Boolean(fleet?.isPageLoading || fleet?.loading);

  const shouldAnimate = alwaysAnimate || isLoading;

  return (
    <div
      className={`relative ${height} w-full overflow-hidden shrink-0 select-none bg-slate-100 ${className}`}
      role="progressbar"
      aria-label="National Portal Tricolor Indicator"
      aria-busy={isLoading}
    >
      {isLoading ? (
        // Active Rightward Loader Mode
        <div className="relative w-full h-full tricolor-loading-flow">
          <div className="tricolor-loading-runner" />
        </div>
      ) : alwaysAnimate ? (
        // Ambient Continuous Rightward Flow
        <div className="relative w-full h-full tricolor-ambient-flow" />
      ) : (
        // Official Static Tricolor (Saffron - White - Green)
        <div className="flex w-full h-full">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-white" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>
      )}
    </div>
  );
}
