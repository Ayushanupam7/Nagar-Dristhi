/**
 * Public evidence images mapping according to issue type.
 * Supports public assets placed in frontend/public:
 * - /evidence_pothole.jpg
 * - /evidence_damaged_road.jpg
 * - /evidence_missing_divider.jpg
 * - /evidence_damaged_signboard.jpg
 * - /evidence_waterlogging.jpg
 */

export const EVIDENCE_MAP = {
  POTHOLE: "/evidence_pothole.jpg",
  DAMAGED_ROAD: "/evidence_damaged_road.jpg",
  ROAD_DAMAGE: "/evidence_damaged_road.jpg",
  BITUMEN_EROSION: "/evidence_damaged_road.jpg",
  CRACK: "/evidence_damaged_road.jpg",
  MISSING_DIVIDER: "/evidence_missing_divider.jpg",
  DIVIDER: "/evidence_missing_divider.jpg",
  DAMAGED_SIGNBOARD: "/evidence_damaged_signboard.jpg",
  SIGNBOARD: "/evidence_damaged_signboard.jpg",
  WATERLOGGING: "/evidence_waterlogging.jpg",
  WATER_STAGNATION: "/evidence_waterlogging.jpg",
};

/**
 * Returns the correct public evidence image URL for a given issue or defect event.
 * Priority:
 * 1. Valid non-generic local evidence path in public/
 * 2. Exact or substring match on issue_type against EVIDENCE_MAP
 * 3. Default fallback to /evidence_pothole.jpg
 */
export function getDetectionEvidenceImage(issue) {
  if (!issue) return "/evidence_pothole.jpg";

  const explicitUrl = issue.before_evidence_url || issue.evidence_url;

  // If already set to a valid local public asset (starts with /evidence_)
  if (explicitUrl && typeof explicitUrl === "string" && explicitUrl.startsWith("/evidence_")) {
    return explicitUrl;
  }

  // If it is a custom URL that is not the generic unsplash fallback
  if (
    explicitUrl &&
    typeof explicitUrl === "string" &&
    !explicitUrl.includes("photo-1515162816999") &&
    (explicitUrl.startsWith("http://") || explicitUrl.startsWith("https://") || explicitUrl.startsWith("/"))
  ) {
    return explicitUrl;
  }

  const rawType = (issue.issue_type || issue.event_type || issue.type || "").toUpperCase();

  if (rawType in EVIDENCE_MAP) {
    return EVIDENCE_MAP[rawType];
  }

  if (rawType.includes("POTHOLE")) return "/evidence_pothole.jpg";
  if (rawType.includes("DIVIDER") || rawType.includes("MEDIAN") || rawType.includes("BARRIER")) {
    return "/evidence_missing_divider.jpg";
  }
  if (rawType.includes("SIGN") || rawType.includes("BOARD")) {
    return "/evidence_damaged_signboard.jpg";
  }
  if (rawType.includes("WATER") || rawType.includes("DRAIN") || rawType.includes("FLOOD")) {
    return "/evidence_waterlogging.jpg";
  }
  if (
    rawType.includes("ROAD") ||
    rawType.includes("BITUMEN") ||
    rawType.includes("CRACK") ||
    rawType.includes("SURFACE") ||
    rawType.includes("EROSION")
  ) {
    return "/evidence_damaged_road.jpg";
  }

  return "/evidence_pothole.jpg";
}
