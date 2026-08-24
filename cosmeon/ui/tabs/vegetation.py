from __future__ import annotations
"""
ui/tabs/vegetation.py
=====================
Tab 2: NDVI vegetation change map.
"""
import streamlit as st
import folium
from streamlit_folium import st_folium

from cosmeon.core.satellite import get_tile_url


def render(results: dict | None, bounds: list, c_lat: float, c_lon: float, zoom: int) -> None:
    """Render the NDVI vegetation loss change map."""
    if not results:
        st.info("🚀 Run the pipeline to visualise vegetation health changes.")
        return

    if not results.get("ndvi_available"):
        st.warning(
            "⚠️ Optical data unavailable (all scenes obscured by cloud). "
            "NDVI analysis requires at least one clear Sentinel-2 scene. "
            "Try adjusting the date range or increasing the cloud cover threshold."
        )
        return

    st.subheader(
        "Vegetation Status (NDVI Change Map)",
        help="Multispectral analysis showing where crop health crashed due to submergence. "
             "Bivariate mask excludes oceans and permanent lakes."
    )

    m = folium.Map(location=[c_lat, c_lon], zoom_start=zoom, tiles="CartoDB dark_matter")
    m.fit_bounds(bounds)
    folium.TileLayer(
        tiles=get_tile_url(
            results["ndvi_diff"],
            {"min": -0.5, "max": 0.5,
             "palette": ["#ef4444", "#f97316", "#fef3c7", "#86efac", "#16a34a"]},
        ),
        attr="GEE",
    ).add_to(m)
    st_folium(m, height=450, use_container_width=True, key="v_map", returned_objects=[])
