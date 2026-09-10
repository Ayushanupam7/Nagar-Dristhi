from typing import Dict, Any, Tuple
from app.config import settings


def calculate_priority_score(
    confidence: float,
    severity: int,
    traffic_level: str = "HIGH",
    safety_risk: str = "HIGH",
    confirmations_count: int = 1
) -> Tuple[float, str, Dict[str, float]]:
    """
    Transparent, non-blackbox AI Priority Scoring Engine.
    Normalized from 0 to 100.
    Returns: (score, level, factors_breakdown)
    """
    # 1. Confidence component (0 to 100)
    conf_val = min(max(confidence * 100.0, 0.0), 100.0)
    
    # 2. Severity component (1 to 10 -> 10 to 100)
    sev_val = min(max(severity * 10.0, 10.0), 100.0)
    
    # 3. Traffic volume mapping
    traffic_map = {
        "LOW": 30.0,
        "MEDIUM": 60.0,
        "HIGH": 85.0,
        "EXTREME": 100.0,
        "SEVERE": 95.0
    }
    traf_val = traffic_map.get(traffic_level.upper(), 70.0)
    
    # 4. Safety risk mapping
    safety_map = {
        "LOW": 25.0,
        "MEDIUM": 50.0,
        "HIGH": 80.0,
        "CRITICAL": 100.0
    }
    safety_val = safety_map.get(safety_risk.upper(), 75.0)
    
    # 5. Independent confirmations factor
    if confirmations_count <= 1:
        verif_val = 40.0
    elif confirmations_count == 2:
        verif_val = 80.0
    else:
        verif_val = 100.0

    # Configurable weights (sum = 100)
    w_conf = settings.WEIGHT_CONFIDENCE / 100.0
    w_sev = settings.WEIGHT_SEVERITY / 100.0
    w_traf = settings.WEIGHT_TRAFFIC / 100.0
    w_safe = settings.WEIGHT_SAFETY / 100.0
    w_verif = settings.WEIGHT_CONFIRMATIONS / 100.0

    weighted_conf = round(conf_val * w_conf, 2)
    weighted_sev = round(sev_val * w_sev, 2)
    weighted_traf = round(traf_val * w_traf, 2)
    weighted_safe = round(safety_val * w_safe, 2)
    weighted_verif = round(verif_val * w_verif, 2)

    total_score = round(weighted_conf + weighted_sev + weighted_traf + weighted_safe + weighted_verif, 1)
    total_score = min(max(total_score, 0.0), 100.0)

    # Categorize level
    if total_score >= 81.0:
        level = "CRITICAL"
    elif total_score >= 61.0:
        level = "HIGH"
    elif total_score >= 31.0:
        level = "MEDIUM"
    else:
        level = "LOW"

    factors = {
        "confidence": weighted_conf,
        "severity": weighted_sev,
        "traffic": weighted_traf,
        "safety": weighted_safe,
        "verification": weighted_verif
    }

    return total_score, level, factors
