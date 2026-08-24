from __future__ import annotations
"""
core/detection.py
=================
Flood and vegetation loss detection algorithms.
All functions operate on GEE Image objects and return GEE Images.
No Streamlit imports.
"""
import ee
from cosmeon.config import JRC_DATASET, DEM_DATASET


# ── Shared Masks ──────────────────────────────────────────────────────────────

def _get_land_mask(aoi: ee.Geometry) -> ee.Image:
    """
    Bivariate land mask:
    - Exclude pixels below sea level (DEM ≤ 0)
    - Exclude pixels classified as permanent water by JRC (occurrence ≥ 50%)
    Returns a binary mask image (1 = valid land).
    """
    dem = ee.Image(DEM_DATASET)
    jrc_water = ee.Image(JRC_DATASET).select("occurrence").unmask(0)
    return dem.gt(0).And(jrc_water.lt(50))


def _get_slope_mask() -> ee.Image:
    """Return a binary mask excluding slopes > 5° (removes mountain radar shadows)."""
    dem = ee.Image(DEM_DATASET)
    return ee.Terrain.slope(dem).lt(5)


# ── SAR Flood Detection ───────────────────────────────────────────────────────

def detect_sar_flood(
    pre_s1: ee.Image,
    post_s1: ee.Image,
    aoi: ee.Geometry,
    threshold: float,
) -> tuple[ee.Image, ee.Image]:
    """
    Detect flooded pixels from Sentinel-1 VV backscatter change.

    Args:
        pre_s1:    Pre-event SAR composite (clipped)
        post_s1:   Post-event SAR composite (clipped)
        aoi:       Area of interest geometry
        threshold: Negative dB drop that identifies water (e.g. -2.0)

    Returns:
        (flood_mask, sar_diff) — both as GEE Image objects
        flood_mask: Binary (1 = flooded), morphologically smoothed
        sar_diff:   Continuous VV change image in dB (named "SAR_diff")
    """
    valid_sar = pre_s1.select(0).mask().And(post_s1.select(0).mask())
    sar_diff = post_s1.subtract(pre_s1).updateMask(valid_sar).rename("SAR_diff")

    land_mask  = _get_land_mask(aoi)
    slope_mask = _get_slope_mask()

    raw_flood = (
        sar_diff.lt(threshold)
        .And(slope_mask)
        .And(land_mask)
        .updateMask(valid_sar)
    )
    # Morphological smoothing on binary layer (memory-efficient vs float smoothing)
    flood_mask = raw_flood.focal_mode(radius=30, units="meters").toInt().rename("flood")

    return flood_mask, sar_diff


# ── Optical (NDWI) Flood Detection ───────────────────────────────────────────

def detect_optical_flood(
    pre_s2: ee.Image,
    post_s2: ee.Image,
    aoi: ee.Geometry,
) -> tuple[ee.Image, ee.Image]:
    """
    Detect flooded pixels from Sentinel-2 NDWI.
    NDWI = (Green - NIR) / (Green + NIR) > 0 → water.

    Returns:
        (optical_flood_mask, ndwi_post) — both GEE Images
    """
    valid_opt = pre_s2.select("NIR").mask().And(post_s2.select("NIR").mask())
    land_mask = _get_land_mask(aoi)

    ndwi_post = post_s2.normalizedDifference(["Green", "NIR"]).updateMask(valid_opt).rename("NDWI_post")
    raw_opt = ndwi_post.gt(0.0).And(land_mask).updateMask(valid_opt)
    optical_flood = raw_opt.focal_mode(radius=30, units="meters").toInt().rename("optical_flood")

    return optical_flood, ndwi_post


# ── NDVI Vegetation Loss Detection ───────────────────────────────────────────

def detect_ndvi_loss(
    pre_s2: ee.Image,
    post_s2: ee.Image,
    aoi: ee.Geometry,
    ndvi_thresh: float,
) -> tuple[ee.Image, ee.Image]:
    """
    Detect agricultural loss from NDVI drop between pre- and post-event.

    Returns:
        (ndvi_loss_mask, ndvi_diff) — both GEE Images
        ndvi_loss_mask: Binary (1 = significant vegetation loss), smoothed
        ndvi_diff:      Continuous NDVI change image (named "NDVI_diff")
    """
    valid_opt = pre_s2.select("NIR").mask().And(post_s2.select("NIR").mask())
    land_mask = _get_land_mask(aoi)

    ndvi_pre  = pre_s2.normalizedDifference(["NIR", "Red"]).updateMask(valid_opt).rename("NDVI_pre")
    ndvi_post = post_s2.normalizedDifference(["NIR", "Red"]).updateMask(valid_opt).rename("NDVI_post")
    ndvi_diff = ndvi_post.subtract(ndvi_pre).updateMask(valid_opt).rename("NDVI_diff")

    raw_loss  = ndvi_diff.lt(ndvi_thresh).And(land_mask).updateMask(valid_opt)
    ndvi_loss = raw_loss.focal_mode(radius=30, units="meters").toInt().rename("ndvi_loss")

    return ndvi_loss, ndvi_diff


# ── Ensemble Confidence Fusion ────────────────────────────────────────────────

def compute_ensemble(
    flood_mask: ee.Image,
    optical_flood: ee.Image,
    sar_conf_base: float,
    opt_conf_base: float,
) -> tuple[ee.Image, ee.Image, float]:
    """
    Fuse SAR and optical flood masks into an ensemble confidence layer.
    Uses Bayesian combination for overlap zones.
    """
    sar_conf_layer = flood_mask.multiply(sar_conf_base)
    opt_conf_layer = optical_flood.multiply(opt_conf_base)
    
    # Probabilistic OR: 1 - (1-P1)*(1-P2)
    peak = 1.0 - (1.0 - sar_conf_base) * (1.0 - opt_conf_base)
    
    overlap = flood_mask.And(optical_flood).rename("ensemble")
    # Base confidence is the max of either, but overlap boosts to peak
    confidence = sar_conf_layer.max(opt_conf_layer).where(overlap, peak).rename("confidence")
    
    return overlap, confidence, float(peak)
