"""
COSMEON — Central Config
========================
All constants, GEE project ID, and thresholds live here.
Import this module first; it authenticates Google Earth Engine once.
"""
import os
import ee

# ── GEE Project ──────────────────────────────────────────────────────────────
GEE_PROJECT = os.getenv("GEE_PROJECT_ID", "sublime-etching-453915-q9")


def init_gee() -> None:
    """Authenticate + initialize Earth Engine. Safe to call multiple times."""
    try:
        ee.Initialize(project=GEE_PROJECT)
    except Exception as exc:
        raise RuntimeError(
            f"Earth Engine init failed: {exc}\n"
            "Run `earthengine authenticate` first."
        ) from exc


# ── Default Thresholds (sidebar defaults) ────────────────────────────────────
SAR_THRESHOLD_DEFAULT: float = -2.0      # dB drop that defines a flood pixel
NDVI_THRESH_DEFAULT: float  = -0.12     # NDVI drop indicating vegetation loss
CLOUD_PCT_DEFAULT: int      = 25        # Max Sentinel-2 cloud cover %
SAR_CONF_DEFAULT: float     = 0.90      # SAR baseline confidence weight
OPT_CONF_DEFAULT: float     = 0.80      # Optical baseline confidence weight
SCALE_DEFAULT: int          = 150       # Processing scale in metres

# ── GEE Dataset IDs ──────────────────────────────────────────────────────────
S1_COLLECTION    = "COPERNICUS/S1_GRD"
S2_COLLECTION    = "COPERNICUS/S2_SR_HARMONIZED"
JRC_DATASET      = "JRC/GSW1_4/GlobalSurfaceWater"
DEM_DATASET      = "USGS/SRTMGL1_003"
WORLDPOP_DATASET = "WorldPop/GP/100m/pop"

# ── Severity Thresholds ───────────────────────────────────────────────────────
SEVERITY_CRITICAL = 80
SEVERITY_HIGH     = 60
SEVERITY_MODERATE = 40
SEVERITY_LOW      = 20

# ── Colour Palette ────────────────────────────────────────────────────────────
COLOUR_CRITICAL = "#ef4444"
COLOUR_HIGH     = "#f97316"
COLOUR_MODERATE = "#f59e0b"
COLOUR_LOW      = "#84cc16"
COLOUR_MINIMAL  = "#22c55e"
