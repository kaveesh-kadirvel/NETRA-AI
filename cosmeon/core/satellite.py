"""
core/satellite.py
=================
Pure GEE satellite collection helpers.
No Streamlit imports — safe to unit-test or use from CLI.
"""
import ee
from cosmeon.config import S1_COLLECTION, S2_COLLECTION


def get_aoi(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> ee.Geometry:
    """Return an Earth Engine Rectangle for the given bounding box."""
    return ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])


def mask_s2_clouds(image: ee.Image) -> ee.Image:
    """Remove cloud and cirrus pixels from a Sentinel-2 scene using QA60 band."""
    qa = image.select("QA60")
    cloud_mask  = qa.bitwiseAnd(1 << 10).eq(0)
    cirrus_mask = qa.bitwiseAnd(1 << 11).eq(0)
    return image.updateMask(cloud_mask.And(cirrus_mask))


def s1_collection(start: str, end: str, aoi: ee.Geometry) -> ee.ImageCollection:
    """Return Sentinel-1 GRD IW VV scenes filtered to AOI and date range."""
    return (
        ee.ImageCollection(S1_COLLECTION)
        .filterBounds(aoi)
        .filterDate(start, end)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .select(["VV"])
    )


def s2_collection(
    start: str,
    end: str,
    aoi: ee.Geometry,
    max_cloud: int,
) -> ee.ImageCollection:
    """Return cloud-masked Sentinel-2 SR scenes with Green, Red, NIR bands."""
    return (
        ee.ImageCollection(S2_COLLECTION)
        .filterBounds(aoi)
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", max_cloud))
        .map(mask_s2_clouds)
        .select(["B3", "B4", "B8"], ["Green", "Red", "NIR"])
    )


def get_tile_url(image: ee.Image, vis_params: dict) -> str:
    """Return a slippy-map tile URL for a GEE image (used by Folium layers)."""
    return image.getMapId(vis_params)["tile_fetcher"].url_format


def sample_pixel(img: ee.Image, lng: float, lat: float, band: str):
    """
    Sample a single pixel value from a GEE image at (lng, lat).
    Returns None on failure (no data or out-of-bounds).
    """
    try:
        return img.sample(ee.Geometry.Point(lng, lat), scale=30).first().get(band).getInfo()
    except Exception:
        return None
