"""Risk scoring module — pure Python, no GEE dependency."""

def compute_risk_score(
    flood_pct: float,
    pop_density_km2: float,
    elev_vuln_index: float,
    rainfall_mm_7d: float,
) -> float:
    """Returns a 0–100 composite risk score."""
    f = min(flood_pct / 100, 1.0)
    p = min(pop_density_km2 / 5000, 1.0)
    e = min(elev_vuln_index, 1.0)
    r = min(rainfall_mm_7d / 300, 1.0)
    score = (0.40 * f + 0.25 * p + 0.20 * e + 0.15 * r) * 100
    return round(score, 2)


def classify_risk(score: float) -> str:
    if score >= 76: return 'CRITICAL'
    if score >= 51: return 'HIGH'
    if score >= 26: return 'MEDIUM'
    return 'LOW'
