from __future__ import annotations
"""
pipeline/runner.py
==================
Orchestrates all core modules into a single `run()` call.
Returns the canonical `results` dict consumed by the UI layer.
No Streamlit imports.
"""
import math
import time
import datetime
import pandas as pd

import ee

from cosmeon.config import init_gee
from cosmeon.core.satellite import (
    get_aoi, s1_collection, s2_collection,
    get_tile_url, sample_pixel,
)
from cosmeon.core.detection import (
    detect_sar_flood, detect_optical_flood,
    detect_ndvi_loss, compute_ensemble,
)
from cosmeon.core.enrichment import (
    compute_area_stats, compute_population_exposure, compute_signal_stats,
)
from cosmeon.core.scoring import compute_severity, severity_label


# ── Zero-image fallback factory ───────────────────────────────────────────────

def _zero_image(aoi: ee.Geometry, name: str) -> ee.Image:
    return ee.Image.constant(0).clip(aoi).rename(name)


# ── AOI area calculation (flat-earth approximation) ───────────────────────────

def _aoi_km2(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> float:
    w_km = (max_lon - min_lon) * 111 * math.cos(math.radians((min_lat + max_lat) / 2))
    h_km = (max_lat - min_lat) * 111
    return w_km * h_km


# ── Main pipeline entry point ─────────────────────────────────────────────────

def run(cfg: dict) -> dict:
    """
    Execute the full COSMEON satellite analysis pipeline.

    Args:
        cfg: Dict produced by `ui.sidebar.get_sidebar_config()` containing:
            min_lon, min_lat, max_lon, max_lat  — bounding box
            pre_start, pre_end              — pre-event date strings (YYYY-MM-DD)
            post_start, post_end            — post-event date strings
            threshold       — SAR dB drop threshold (negative float)
            ndvi_thresh     — NDVI drop threshold (negative float)
            cloud_pct       — max Sentinel-2 cloud cover %
            sar_conf_base   — SAR confidence weight
            opt_conf_base   — optical confidence weight
            scale           — processing scale in metres
            bounds          — [[min_lat, min_lon], [max_lat, max_lon]]

    Returns:
        Canonical results dict consumed by all UI tab renderers.
        Raises RuntimeError on unrecoverable GEE or data errors.
    """
    init_gee()

    min_lon  = cfg["min_lon"]
    min_lat  = cfg["min_lat"]
    max_lon  = cfg["max_lon"]
    max_lat  = cfg["max_lat"]
    scale    = cfg.get("scale", 150)
    threshold     = cfg.get("threshold", -2.0)
    ndvi_thresh   = cfg.get("ndvi_thresh", -0.12)
    cloud_pct     = cfg.get("cloud_pct", 25)
    sar_conf_base = cfg.get("sar_conf_base", 0.90)
    opt_conf_base = cfg.get("opt_conf_base", 0.80)

    # Support multiple date naming conventions
    pre_start_s  = str(cfg.get("pre_start_s") or cfg.get("pre_start"))
    pre_end_s    = str(cfg.get("pre_end_s") or cfg.get("pre_end"))
    post_start_s = str(cfg.get("post_start_s") or cfg.get("post_start"))
    post_end_s   = str(cfg.get("post_end_s") or cfg.get("post_end"))
    bbox_str     = f"[{min_lon:.2f}, {min_lat:.2f}, {max_lon:.2f}, {max_lat:.2f}]"
    aoi_km2_val  = _aoi_km2(min_lon, min_lat, max_lon, max_lat)

    # Auto-scale: prevent GEE timeout for large AOIs
    if aoi_km2_val > 100000 and scale < 1000:
        scale = 1000
    elif aoi_km2_val > 50000 and scale < 500:
        scale = 500
    elif aoi_km2_val > 10000 and scale < 300:
        scale = 300

    t0 = time.time()
    run_logs: list[str] = []

    def _log(msg: str) -> None:
        entry = f"[{time.strftime('%H:%M:%S')}] {msg}"
        run_logs.append(entry)
        print(entry)

    _log(f"SYS_INIT: Booting Insight Engine. AOI: {aoi_km2_val:.1f} km² | Scale: {scale}m")

    aoi = get_aoi(min_lon, min_lat, max_lon, max_lat)

    # ── 1. SAR Collection ─────────────────────────────────────────────────────
    _log("INGEST: Requesting Sentinel-1 GRD Archive…")
    _pre_s1_col  = s1_collection(pre_start_s,  pre_end_s,  aoi)
    _post_s1_col = s1_collection(post_start_s, post_end_s, aoi)
    n_pre_s1  = _pre_s1_col.size().getInfo()
    n_post_s1 = _post_s1_col.size().getInfo()

    if n_pre_s1 == 0 or n_post_s1 == 0:
        raise RuntimeError(
            f"Missing SAR scenes (pre={n_pre_s1}, post={n_post_s1}). "
            "Try expanding the date range."
        )

    pre_s1  = _pre_s1_col.median().clip(aoi)
    post_s1 = _post_s1_col.median().clip(aoi)
    _log(f"INGEST: SAR ready — pre={n_pre_s1} scenes, post={n_post_s1} scenes")

    # ── 2. SAR Soil Moisture Detection ────────────────────────────────────────────────
    flood_mask, sar_diff = detect_sar_flood(pre_s1, post_s1, aoi, threshold)
    _log("COMPUTE: Moisture anomalies extracted. Topographic noise smoothed.")

    # ── 3. Optical Collection (with cloud-tier fallback) ──────────────────────
    _log("INGEST: Requesting Sentinel-2 Harmonised Archive…")
    ndvi_available = False
    used_cloud = cloud_pct
    n_pre_s2 = n_post_s2 = 0
    pre_s2_med = post_s2_med = None

    for cloud_tier in [cloud_pct, min(cloud_pct + 20, 80), 90]:
        _pre_s2  = s2_collection(pre_start_s,  pre_end_s,  aoi, cloud_tier)
        _post_s2 = s2_collection(post_start_s, post_end_s, aoi, cloud_tier)
        cnt_pre  = _pre_s2.size().getInfo()
        cnt_post = _post_s2.size().getInfo()
        if cnt_pre > 0 and cnt_post > 0:
            ndvi_available = True
            used_cloud = cloud_tier
            n_pre_s2, n_post_s2 = cnt_pre, cnt_post
            pre_s2_med  = _pre_s2.median().clip(aoi)
            post_s2_med = _post_s2.median().clip(aoi)
            _log(f"INGEST: Optical ready — pre={cnt_pre}, post={cnt_post} (cloud≤{cloud_tier}%)")
            break

    if not ndvi_available:
        _log("WARNING: Optical data obscured. Proceeding SAR-only.")

    # ── 4. Optical Detection (or zero fallbacks) ──────────────────────────────
    if ndvi_available:
        optical_flood, ndwi_post = detect_optical_flood(pre_s2_med, post_s2_med, aoi)
        ndvi_loss, ndvi_diff     = detect_ndvi_loss(pre_s2_med, post_s2_med, aoi, ndvi_thresh)
    else:
        optical_flood = _zero_image(aoi, "optical_flood").toInt()
        ndwi_post     = None
        ndvi_diff     = _zero_image(aoi, "NDVI_diff")
        ndvi_loss     = _zero_image(aoi, "ndvi_loss").toInt()

    # ── 5. Ensemble Confidence ────────────────────────────────────────────────
    ensemble, confidence, peak_confidence = compute_ensemble(
        flood_mask, optical_flood, sar_conf_base, opt_conf_base
    )

    # ── 6. Area + Population Statistics ──────────────────────────────────────
    _log("EXTERNAL: Correlating dynamic crop boundaries…")
    area_stats = compute_area_stats(flood_mask, ndvi_loss, aoi, scale)
    sar_area       = area_stats["sar_area"]
    ndvi_loss_area = area_stats["ndvi_loss_area"]
    perm_water_area = area_stats["perm_water_area"]
    new_flood_anomaly = max(0, sar_area - perm_water_area)

    exposed_pop = compute_population_exposure(flood_mask, aoi)

    # ── 7. Signal Statistics ──────────────────────────────────────────────────
    sig_stats = compute_signal_stats(sar_diff, ndvi_diff, aoi, scale, ndvi_available)
    sar_mean    = sig_stats["sar_mean"]
    sar_stddev  = sig_stats["sar_stddev"]
    ndvi_mean   = sig_stats["ndvi_mean"]

    # ── 8. Severity Scoring ───────────────────────────────────────────────────
    severity_score, severity_breakdown = compute_severity(
        sar_area, ndvi_loss_area, aoi_km2_val, sar_mean, ndvi_mean, exposed_pop
    )
    risk_label = severity_label(severity_score)
    _log(f"SYS_OUT: Prescription complete — {risk_label} ({severity_score}/100) in {time.time()-t0:.1f}s")

    # ── 9. Frontend NextJS Integration ────────────────────────────────────────
    import os, uuid, requests
    PIPELINE_SECRET = os.getenv('PIPELINE_SECRET', 'cosmeon-secret-2026')
    INGEST_URL      = os.getenv('NEXTJS_INGEST_URL', 'http://localhost:3000/api/pipeline/ingest')

    payload = dict(
        runId           = str(uuid.uuid4()),
        eventDate       = datetime.datetime.now(datetime.timezone.utc).isoformat(),
        aoiName         = 'Streamlit Dashboard AOI',
        scene           = {
            'name': 'Interactive User Run',
            'bbox': [min_lon, min_lat, max_lon, max_lat],
            'date': post_end_s,
            'cloudCover': cloud_pct,
            'resolution': scale
        },
        districtResults = [{
            'districtId': f'custom-aoi-{int(time.time())}',
            'name': 'Custom Selected Region',
            'state': 'Manual Input',
            'riskScore': severity_score,
            'riskLevel': severity_label(severity_score),
            'floodPctDistrict': min((sar_area / max(aoi_km2_val, 1)) * 100, 100),
            'affectedPopEst': exposed_pop,
            'confidenceScore': peak_confidence / 100.0,
            'detectionMethod': 'ENSEMBLE_STREAMLIT',
            'changeFromPrevKm2': float(new_flood_anomaly),
            'floodGeometry': {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, max_lat],
                    [max_lon, max_lat],
                    [max_lon, min_lat],
                    [min_lon, min_lat],
                    [min_lon, max_lat]
                ]]
            },
            'metadata': {
                'floodBbox': [min_lon, min_lat, max_lon, max_lat],
                'analysisWindow': f'{post_start_s}/{post_end_s}',
                'geeProject': 'cosmeon-interactive',
            },
            'enrichment': {
                'rainfallSource': 'Interactive Trigger',
                'popDensityKm2': exposed_pop / max(aoi_km2_val, 1)
            },
            'geeMetrics': {
                'sar_flood_km2': sar_area,
                'ndwi_flood_km2': ndvi_loss_area,
                'gee_pop_at_risk': exposed_pop
            },
            'liveWeather': {
                'tempC': 0, 'humidity': 0, 'windKmh': 0
            },
            'status': 'active' if severity_score >= 50 else 'monitoring'
        }],
        logs = run_logs
    )

    try:
        r = requests.post(
            INGEST_URL, json=payload,
            headers={'x-pipeline-secret': PIPELINE_SECRET, 'Content-Type': 'application/json'},
            timeout=2
        )
        r.raise_for_status()
        _log("INTEGRATION: ✅ Automatically synced results to NextJS Dashboard Database.")
    except Exception as ex:
        _log(f"INTEGRATION: ⚠️ Optional sync to NextJS failed ({ex}). Is the webserver up at :3000?")

    # ── 10. Assemble canonical results dict ────────────────────────────────────
    return {
        # GEE Image objects (used by map renderers)
        "pre_s1":       pre_s1,
        "post_s1":      post_s1,
        "sar_diff":     sar_diff,
        "flood":        flood_mask,
        "ndvi_available": ndvi_available,
        "optical_flood":  optical_flood,
        "ndwi_post":    ndwi_post,
        "ndvi_diff":    ndvi_diff,
        "ndvi_loss":    ndvi_loss,
        "ensemble":     ensemble,
        "confidence":   confidence,
        # Scalar metrics
        "flood_area":       sar_area,
        "ndvi_loss_area":   ndvi_loss_area,
        "sar_mean":         sar_mean,
        "sar_stddev":       sar_stddev,
        "ndvi_mean":        ndvi_mean,
        "severity_score":   severity_score,
        "severity_breakdown": severity_breakdown,
        "exposed_pop":      exposed_pop,
        "new_flood_anomaly": new_flood_anomaly,
        "peak_confidence":  peak_confidence,
        "aoi_km2":          aoi_km2_val,
        # Run parameters (for report/API tabs)
        "scale":       scale,
        "threshold":   threshold,
        "ndvi_thresh": ndvi_thresh,
        "n_pre_s1":    n_pre_s1,
        "n_post_s1":   n_post_s1,
        "n_pre_s2":    n_pre_s2,
        "n_post_s2":   n_post_s2,
        "used_cloud":  used_cloud,
        "pre_start_s":  pre_start_s,
        "pre_end_s":    pre_end_s,
        "post_start_s": post_start_s,
        "post_end_s":   post_end_s,
        "run_logs":  run_logs,
        "bbox_str":  bbox_str,
        "bounds":    cfg.get("bounds", [[min_lat, min_lon], [max_lat, max_lon]]),
        "sar_conf_base": sar_conf_base,
        "opt_conf_base": opt_conf_base,
    }


# ── State Table Builder ───────────────────────────────────────────────────────

def build_state_record(results: dict) -> pd.DataFrame:
    """Create a single-row DataFrame row to append to the session state table."""
    return pd.DataFrame([{
        "Timestamp":         datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Region_BBox":       results["bbox_str"],
        "Risk_Status":       severity_label(results["severity_score"]),
        "Severity_Index":    results["severity_score"],
        "Exposed_Population": results["exposed_pop"],
        "Flood_km2":         round(results["flood_area"],        2),
        "Agri_Damage_km2":   round(results["ndvi_loss_area"],    2),
        "Predictive_Anomaly": round(results["new_flood_anomaly"], 2),
    }])
