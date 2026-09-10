from typing import Dict, Any, List


class BaseTracker:
    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raise NotImplementedError


class VehicleTracker(BaseTracker):
    """
    Vehicle detection and tracking abstraction.
    Supports ByteTrack or Centroid tracking with vehicle classification.
    """
    def __init__(self):
        self.active_tracks = {}
        self.next_track_id = 1001

    def count_vehicles(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate vehicle counts by classification."""
        counts = {"cars": 0, "bikes": 0, "buses": 0, "trucks": 0}
        for det in detections:
            cls = det.get("class", "").lower()
            if cls in counts:
                counts[cls] += 1
            elif cls == "motorcycle":
                counts["bikes"] += 1
            else:
                counts["cars"] += 1
        
        total = sum(counts.values())
        congestion = min(100.0, total * 3.5)
        density = "LOW"
        if congestion > 75:
            density = "SEVERE"
        elif congestion > 50:
            density = "HIGH"
        elif congestion > 25:
            density = "MEDIUM"

        return {
            "counts": counts,
            "total_vehicles": total,
            "congestion_percent": round(congestion, 1),
            "traffic_density": density
        }
