"""
cosmeon/pixel_grid.py
======================
Fetches a coarse SAR + NDVI pixel grid from GEE for a given AOI.
Returns JSON array of {lat, lon, sar_vv, ndvi} per cell.
Used by the frontend AgriHeatmapLayer to render a REAL spatial heatmap.
"""
from __future__ import annotations
import sys
import json
import os
import math

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

GEE_OK = False
try:
    import ee
    GEE_OK = True
except ImportError:
    pass

# ── Deterministic fallback grid (if GEE unavailable) ──────────────────────────
def _seeded_grid(min_lon, min_lat, max_lon, max_lat, rows=25, cols=25):
    seed = abs(round(min_lat * 1000 + min_lon * 1000))
    cells = []
    for r in range(rows):
        for c in range(cols):
            lat = min_lat + (r + 0.5) * (max_lat - min_lat) / rows
            lon = min_lon + (c + 0.5) * (max_lon - min_lon) / cols
            idx = r * cols + c
            # Simple deterministic hash
            h = math.sin(seed + idx * 127.1) * 43758.5453
            v = h - math.floor(h)
            h2 = math.sin(seed + idx * 311.7) * 12345.678
            v2 = h2 - math.floor(h2)
            sar_vv  = -3.0 * v           # -3 to 0 dB (water deficit range)
            ndvi    = -0.3 * v2          # -0.3 to 0 (crop stress range)
            cells.append({"lat": round(lat, 5), "lon": round(lon, 5),
                          "sar_vv": round(sar_vv, 3), "ndvi": round(ndvi, 4),
                          "demo": True})
    return cells

# ── Live GEE pixel grid ────────────────────────────────────────────────────────
def _live_grid(min_lon, min_lat, max_lon, max_lat, post_start, post_end,
               sar_thresh=-2.0, ndvi_thresh=-0.12, cloud_pct=25, scale=500):
    from cosmeon.config import init_gee
    init_gee()

    aoi = ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])

    # ── Sentinel-1 SAR VV mean (post-period) ──────────────────────────────
    s1 = (
        ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
        .filterBounds(aoi)
        .filterDate(post_start, post_end)
        .select('VV')
        .mean()
        .clip(aoi)
    )

    # ── Sentinel-2 NDVI mean (post-period) ────────────────────────────────
    s2 = (
        ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(aoi)
        .filterDate(post_start, post_end)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_pct))
        .map(lambda img: img.normalizedDifference(['B8', 'B4']).rename('NDVI'))
        .mean()
        .clip(aoi)
    )

    # Stack bands
    stack = s1.rename('SAR_VV').addBands(s2.rename('NDVI'))

    # Sample at grid points
    samples = stack.sample(
        region=aoi,
        scale=scale,          # metres per sample point
        numPixels=625,        # ~25x25 grid max
        seed=42,
        geometries=True,
        dropNulls=True,
    )

    features = samples.getInfo()['features']
    cells = []
    for f in features:
        coords = f['geometry']['coordinates']
        props  = f['properties']
        cells.append({
            "lat":    round(coords[1], 5),
            "lon":    round(coords[0], 5),
            "sar_vv": round(props.get('SAR_VV', 0), 3),
            "ndvi":   round(props.get('NDVI', 0), 4),
            "demo":   False,
        })
    return cells


def process():
    try:
        raw = sys.stdin.read()
        cfg = json.loads(raw)

        min_lon     = cfg.get("min_lon",    76.0)
        min_lat     = cfg.get("min_lat",    18.0)
        max_lon     = cfg.get("max_lon",    77.0)
        max_lat     = cfg.get("max_lat",    19.0)
        post_start  = cfg.get("post_start", "2024-02-01")
        post_end    = cfg.get("post_end",   "2024-02-28")

        if GEE_OK:
            cells = _live_grid(
                min_lon, min_lat, max_lon, max_lat,
                post_start=str(post_start),
                post_end=str(post_end),
                sar_thresh=cfg.get("threshold", -2.0),
                ndvi_thresh=cfg.get("ndvi_thresh", -0.12),
                cloud_pct=cfg.get("cloud_pct", 25),
                scale=max(cfg.get("scale", 150), 500),  # sample at min 500m for speed
            )
        else:
            cells = _seeded_grid(min_lon, min_lat, max_lon, max_lat)

        print(json.dumps({"success": True, "cells": cells}))

    except Exception as e:
        import traceback
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }))


if __name__ == "__main__":
    process()
