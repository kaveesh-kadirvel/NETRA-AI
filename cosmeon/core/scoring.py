from __future__ import annotations
"""
core/scoring.py
===============
Pure Python severity engine and confidence labelling.
No GEE calls, no Streamlit — fully unit-testable.
"""
from cosmeon.config import (
    SEVERITY_CRITICAL, SEVERITY_HIGH, SEVERITY_MODERATE, SEVERITY_LOW,
    COLOUR_CRITICAL, COLOUR_HIGH, COLOUR_MODERATE, COLOUR_LOW, COLOUR_MINIMAL,
)


def compute_severity(
    flood_km2: float,
    ndvi_km2: float,
    aoi_km2: float,
    sar_mean: float | None,
    ndvi_mean: float | None,
    exposed_pop: int,
) -> tuple[float, dict]:
    """
    5-factor weighted severity index (0–100).

    Weights:
        30% — flood fraction of AOI
        20% — NDVI loss fraction of AOI
        20% — population exposure fraction (ref: 500 000 people)
        15% — SAR backscatter intensity score
        15% — NDVI intensity score

    Returns:
        (severity_score, breakdown_dict)
    """
    flood_frac = min(flood_km2 / max(aoi_km2, 1), 1.0)
    ndvi_frac  = min(ndvi_km2  / max(aoi_km2, 1), 1.0)
    pop_frac   = min(exposed_pop / 500_000, 1.0)
    sar_score  = min(max((-(sar_mean  or 0) / 6.0)  * 100, 0), 100)
    ndvi_score = min(max((-(ndvi_mean or 0) / 0.5)  * 100, 0), 100)

    score = round(
        min(
            0.30 * flood_frac * 100
            + 0.20 * ndvi_frac  * 100
            + 0.20 * pop_frac   * 100
            + 0.15 * sar_score
            + 0.15 * ndvi_score,
            100.0,
        ),
        1,
    )

    breakdown = {
        "flood": round(flood_frac * 100, 1),
        "ndvi":  round(ndvi_frac  * 100, 1),
        "pop":   round(pop_frac   * 100, 1),
        "sar":   round(sar_score,        1),
        "ndvi_s": round(ndvi_score,      1),
    }
    return score, breakdown


def severity_label(score: float) -> str:
    """Map a numeric severity score to a human-readable risk label."""
    if score >= SEVERITY_CRITICAL:
        return "CRITICAL"
    if score >= SEVERITY_HIGH:
        return "HIGH"
    if score >= SEVERITY_MODERATE:
        return "MODERATE"
    if score >= SEVERITY_LOW:
        return "LOW"
    return "MINIMAL"


def severity_color(score: float) -> str:
    """Return the hex colour corresponding to a severity score."""
    if score >= SEVERITY_CRITICAL:
        return COLOUR_CRITICAL
    if score >= SEVERITY_HIGH:
        return COLOUR_HIGH
    if score >= SEVERITY_MODERATE:
        return COLOUR_MODERATE
    if score >= SEVERITY_LOW:
        return COLOUR_LOW
    return COLOUR_MINIMAL
