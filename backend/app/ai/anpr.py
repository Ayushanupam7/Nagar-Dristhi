from typing import Dict, Any


class PlateDetector:
    """Modular ANPR pipeline with OCR processor and explicit DEMO MODE tagging."""
    def __init__(self):
        self.is_demo = True

    def process_frame(self, frame_or_path: Any = None) -> Dict[str, Any]:
        return {
            "license_plate": "MH12AB1234",
            "ocr_confidence": 0.94,
            "vehicle_type": "MOTORCYCLE",
            "violation": "BUS_LANE_INTRUSION",
            "is_demo_mode": True,
            "system_note": "ANPR demonstration module active (Demo Mode)"
        }
