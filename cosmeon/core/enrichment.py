"""
core/enrichment.py
==================
GEE-based statistical enrichment:
  - Pixel area statistics (flood km², vegetation loss km², permanent water)
  - WorldPop demographic exposure
  - Signal statistics (mean, stddev for SAR diff and NDVI diff)

Memory strategy: tileScale=16 + bestEffort=True on all reduceRegion calls
to bypass GEE user memory limits. DO NOT remove these params.
"""
import ee
from cosmeon.config import JRC_DATASET, WORLDPOP_DATASET


def compute_area_stats(
    flood_mask: ee.Image,
    ndvi_loss: ee.Image,
    aoi: ee.Geometry,
    scale: int,
) -> dict:
    """
    Calculate flood area, vegetation loss area, and permanent water area in km².

    Returns a dict with keys:
        sar_area      — SAR-detected flood extent (km²)
        ndvi_loss_area — NDVI-detected vegetation loss (km²)
        perm_water_area — JRC permanent water (km², used for anomaly calc)
    """
    jrc_water = ee.Image(JRC_DATASET).select("occurrence").unmask(0)
    historical_water = jrc_water.gt(80).toInt()
    px_area = ee.Image.pixelArea()

    stats = (
        flood_mask.multiply(px_area).rename("sar_area")
        .addBands(ndvi_loss.multiply(px_area).rename("veg_area"))
        .addBands(historical_water.multiply(px_area).rename("perm_water"))
        .reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=aoi,
            scale=scale,
            maxPixels=1e13,
            bestEffort=True,   # ← Memory safety
            tileScale=16,      # ← Distributed partitioning (critical)
        )
        .getInfo()
    )

    return {
        "sar_area":        (stats.get("sar_area")    or 0) / 1e6,
        "ndvi_loss_area":  (stats.get("veg_area")    or 0) / 1e6,
        "perm_water_area": (stats.get("perm_water")  or 0) / 1e6,
    }


def compute_population_exposure(
    flood_mask: ee.Image,
    aoi: ee.Geometry,
) -> int:
    """
    Count population pixels overlapping the flood mask using WorldPop 100m.
    tileScale=16 prevents population value inflation on large AOIs.

    Returns estimated exposed population (integer).
    """
    worldpop = (
        ee.ImageCollection(WORLDPOP_DATASET)
        .filter(ee.Filter.eq("year", 2020))
        .mosaic()
        .clip(aoi)
    )
    pop_exposed = worldpop.updateMask(flood_mask)
    pop_stats = pop_exposed.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=aoi,
        scale=100,
        maxPixels=1e13,
        bestEffort=True,   # ← Memory safety
        tileScale=16,      # ← Distributed partitioning (critical)
    ).getInfo()

    # WorldPop band name varies by collection version
    raw = (
        pop_stats.get("population")
        or pop_stats.get("constant")
        or (list(pop_stats.values())[0] if pop_stats.values() else 0)
    )
    return int(raw or 0)


def compute_signal_stats(
    sar_diff: ee.Image,
    ndvi_diff: ee.Image,
    aoi: ee.Geometry,
    scale: int,
    ndvi_available: bool,
) -> dict:
    """
    Compute mean and stddev for SAR dB change and NDVI change across AOI.

    Returns dict with: sar_mean, sar_stddev, ndvi_mean (None if no optical data).
    """
    base_img = sar_diff
    if ndvi_available:
        base_img = sar_diff.addBands(ndvi_diff)

    sig = base_img.reduceRegion(
        reducer=ee.Reducer.mean().combine(ee.Reducer.stdDev(), sharedInputs=True),
        geometry=aoi,
        scale=scale,
        maxPixels=1e13,
        bestEffort=True,  # ← Memory safety
        tileScale=16,     # ← Distributed partitioning (critical)
    ).getInfo()

    return {
        "sar_mean":    sig.get("SAR_diff_mean"),
        "sar_stddev":  sig.get("SAR_diff_stdDev"),
        "ndvi_mean":   sig.get("NDVI_diff_mean") if ndvi_available else None,
    }
