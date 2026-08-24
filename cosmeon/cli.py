import sys
import json
import math
import time
import random
import logging
import traceback
from datetime import datetime
import os

# Ensure the project root is in sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

# Silence noisy loggers
logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.ERROR)
logging.getLogger('urllib3').setLevel(logging.ERROR)

# ── GEE import guard ───────────────────────────────────────────────────────────
# If earthengine-api is not installed or GEE auth fails,
# the CLI falls back to a deterministic mock payload so the UI always works.
GEE_AVAILABLE = False
try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    sys.stderr.write("[WARN] earthengine-api not installed — running in DEMO mode with seeded data.\n")

# ── AOI area helper ────────────────────────────────────────────────────────────
def _aoi_km2(min_lon, min_lat, max_lon, max_lat):
    w_km = (max_lon - min_lon) * 111 * math.cos(math.radians((min_lat + max_lat) / 2))
    h_km = (max_lat - min_lat) * 111
    return w_km * h_km

# ── Demo / mock payload generator ─────────────────────────────────────────────
def _mock_results(cfg: dict) -> dict:
    """
    Returns a realistic seeded result dict that mirrors the live GEE output schema.
    All values are derived from the AOI geometry so they scale realistically.
    """
    min_lon  = cfg.get("min_lon", 77.0)
    min_lat  = cfg.get("min_lat", 18.0)
    max_lon  = cfg.get("max_lon", 77.5)
    max_lat  = cfg.get("max_lat", 18.5)
    aoi_km2  = _aoi_km2(min_lon, min_lat, max_lon, max_lat)

    # Seed RNG from bbox for determinism — same AOI always gives same result
    seed = int(abs(min_lon * 1000 + min_lat * 1000 + max_lon + max_lat))
    rng  = random.Random(seed)

    flood_frac   = rng.uniform(0.05, 0.25)
    ndvi_frac    = rng.uniform(0.10, 0.40)
    severity     = rng.uniform(30, 75)

    water_area   = round(aoi_km2 * flood_frac, 2)
    ndvi_area    = round(aoi_km2 * ndvi_frac, 2)
    yield_tons   = round(ndvi_area * rng.uniform(1.5, 3.5), 1)
    confidence   = round(rng.uniform(0.72, 0.93), 3)

    logs = [
        f"[{time.strftime('%H:%M:%S')}] SYS_INIT: Booting NETRA.AI Demo Engine. AOI: {aoi_km2:.1f} km²",
        f"[{time.strftime('%H:%M:%S')}] DEMO MODE: earthengine-api not configured — using seeded ARD.",
        f"[{time.strftime('%H:%M:%S')}] SAR INGEST: Simulated Sentinel-1 backscatter processed.",
        f"[{time.strftime('%H:%M:%S')}] MOISTURE ANOMALY: {water_area:.2f} km² flagged with VV < -2.0 dB.",
        f"[{time.strftime('%H:%M:%S')}] OPTICAL INGEST: Simulated Sentinel-2 NDVI computed.",
        f"[{time.strftime('%H:%M:%S')}] NITROGEN DEFICIT: NDVI drop > 12% detected in {ndvi_area:.2f} km².",
        f"[{time.strftime('%H:%M:%S')}] YIELD MODEL: Projected yield depletion = {yield_tons:.1f} Tons.",
        f"[{time.strftime('%H:%M:%S')}] ENSEMBLE: Bayesian fusion confidence = {confidence*100:.1f}%.",
        f"[{time.strftime('%H:%M:%S')}] COMPLETE: Prescription payload ready. Severity = {severity:.1f}/100.",
    ]

    return {
        "success": True,
        "demo_mode": True,
        "metrics": {
            "flood_area":        water_area,
            "ndvi_loss_area":    ndvi_area,
            "exposed_pop":       yield_tons,
            "peak_confidence":   confidence,
            "severity_score":    round(severity, 1),
            "severity_breakdown": {
                "moisture_deficit": round(rng.uniform(3, 8), 2),
                "nitrogen_stress":  round(rng.uniform(4, 9), 2),
                "yield_risk":       round(rng.uniform(2, 7), 2),
            },
            "new_flood_anomaly": round(water_area * 0.7, 2),
            "sar_mean":          round(rng.uniform(-3.5, -1.5), 3),
            "sar_stddev":        round(rng.uniform(0.5, 1.5), 3),
            "ndvi_mean":         round(rng.uniform(-0.25, -0.08), 4),
            "aoi_km2":           round(aoi_km2, 2),
            "run_logs":          logs,
            "bounds":            [[min_lat, min_lon], [max_lat, max_lon]],
            "threshold":         cfg.get("threshold", -2.0),
            "ndvi_thresh":       cfg.get("ndvi_thresh", -0.12),
        },
        "tiles": {},  # No real tile URLs in demo mode
        "bbox_str":    f"[{min_lon:.2f}, {min_lat:.2f}, {max_lon:.2f}, {max_lat:.2f}]",
        "aoi_km2":     round(aoi_km2, 2),
        "n_pre_s1":    rng.randint(4, 12),
        "n_post_s1":   rng.randint(3, 10),
        "n_pre_s2":    rng.randint(2, 8),
        "n_post_s2":   rng.randint(2, 6),
        "used_cloud":  cfg.get("cloud_pct", 25),
        "pre_start_s": str(cfg.get("pre_start", "2024-01-01")),
        "pre_end_s":   str(cfg.get("pre_end",   "2024-01-31")),
        "post_start_s":str(cfg.get("post_start","2024-02-01")),
        "post_end_s":  str(cfg.get("post_end",  "2024-02-28")),
        "scale":       cfg.get("scale", 150),
    }

# ── Live GEE pipeline ──────────────────────────────────────────────────────────
def _live_results(cfg: dict) -> dict:
    from cosmeon.config import init_gee
    from cosmeon.pipeline.runner import run as run_pipeline
    from cosmeon.core.satellite import get_tile_url

    init_gee()
    results = run_pipeline(cfg)

    tiles = {}
    sar_vis      = {"min": -25, "max": 0, "palette": ["#0a0e1a", "#2d4a6e", "#a8c7e8"]}
    flood_vis    = {"palette": ["#00d4ff"], "opacity": 0.85}
    opt_water_vis= {"palette": ["#8b5cf6"], "opacity": 0.6}
    veg_loss_vis = {"palette": ["#ff6b35"], "opacity": 0.7}
    conf_vis     = {"min": 0, "max": 1, "palette": ["#1a1a2e", "#4a4a8c", "#ffffff"]}
    ndvi_diff_vis= {"min": -0.5, "max": 0.5, "palette": ["#ef4444", "#f97316", "#fef3c7", "#86efac", "#16a34a"]}

    if results.get("pre_s1"):   tiles["pre_s1"]       = get_tile_url(results["pre_s1"].select("VV"),    sar_vis)
    if results.get("post_s1"):  tiles["post_s1"]      = get_tile_url(results["post_s1"].select("VV"),   sar_vis)
    if results.get("flood"):    tiles["flood"]        = get_tile_url(results["flood"].selfMask(),        flood_vis)
    if results.get("ndvi_available"):
        if results.get("optical_flood"): tiles["optical_flood"] = get_tile_url(results["optical_flood"].selfMask(), opt_water_vis)
        if results.get("ndvi_loss"):     tiles["ndvi_loss"]     = get_tile_url(results["ndvi_loss"].selfMask(),     veg_loss_vis)
        if results.get("ndvi_diff"):     tiles["ndvi_diff"]     = get_tile_url(results["ndvi_diff"],               ndvi_diff_vis)
    if results.get("confidence"): tiles["confidence"] = get_tile_url(results["confidence"],             conf_vis)

    return {
        "success": True,
        "metrics": {
            "flood_area":        results.get("flood_area", 0),
            "ndvi_loss_area":    results.get("ndvi_loss_area", 0),
            "exposed_pop":       results.get("exposed_pop", 0),
            "peak_confidence":   results.get("peak_confidence", 0),
            "severity_score":    results.get("severity_score", 0),
            "severity_breakdown":results.get("severity_breakdown", {}),
            "new_flood_anomaly": results.get("new_flood_anomaly", 0),
            "sar_mean":          results.get("sar_mean"),
            "sar_stddev":        results.get("sar_stddev"),
            "ndvi_mean":         results.get("ndvi_mean"),
            "aoi_km2":           results.get("aoi_km2", 0),
            "run_logs":          results.get("run_logs", []),
            "bounds":            results.get("bounds", []),
            "threshold":         results.get("threshold", 0),
            "ndvi_thresh":       results.get("ndvi_thresh", 0),
        },
        "tiles":      tiles,
        "bbox_str":   results.get("bbox_str", "N/A"),
        "aoi_km2":    results.get("aoi_km2", 0),
        "n_pre_s1":   results.get("n_pre_s1", 0),
        "n_post_s1":  results.get("n_post_s1", 0),
        "n_pre_s2":   results.get("n_pre_s2", 0),
        "n_post_s2":  results.get("n_post_s2", 0),
        "used_cloud": results.get("used_cloud", 0),
        "pre_start_s":results.get("pre_start_s", "N/A"),
        "pre_end_s":  results.get("pre_end_s",   "N/A"),
        "post_start_s":results.get("post_start_s","N/A"),
        "post_end_s": results.get("post_end_s",  "N/A"),
        "scale":      results.get("scale", 0),
    }

# ── Entry point ────────────────────────────────────────────────────────────────
def process():
    try:
        raw = sys.stdin.read()
        cfg = json.loads(raw)

        # Normalise date fields
        for field in ["pre_start", "pre_end", "post_start", "post_end"]:
            if field in cfg and isinstance(cfg[field], str):
                try:
                    cfg[field] = datetime.strptime(cfg[field], "%Y-%m-%d").date()
                except ValueError:
                    pass  # Leave as-is if parsing fails

        if GEE_AVAILABLE:
            output = _live_results(cfg)
        else:
            output = _mock_results(cfg)

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({
            "success":   False,
            "error":     str(e),
            "traceback": traceback.format_exc(),
        }))

if __name__ == "__main__":
    process()
