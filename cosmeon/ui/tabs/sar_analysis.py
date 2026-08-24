from __future__ import annotations
"""
ui/tabs/sar_analysis.py
=======================
Tab 1: Synchronised before / after SAR DualMap.
"""
import streamlit as st
import folium
from folium.plugins import DualMap
from streamlit_folium import st_folium

from cosmeon.core.satellite import get_tile_url


def render(results: dict | None, bounds: list, c_lat: float, c_lon: float, zoom: int) -> None:
    """Render the synchronised before/after SAR dual-panel map."""
    st.subheader(
        "Synchronised Before / After SAR Detection",
        help="Maps are mathematically locked — panning one pans the other."
    )
    if not results:
        st.info("🚀 Run the pipeline from the sidebar to visualise SAR change detection.")
        return

    vis = {"min": -25, "max": 0, "palette": ["#0a0e1a", "#1a3a5c", "#a8d8ea"]}
    dual = DualMap(location=[c_lat, c_lon], zoom_start=zoom, tiles=None)

    folium.TileLayer("CartoDB dark_matter", attr="CartoDB").add_to(dual.m1)
    folium.TileLayer("CartoDB dark_matter", attr="CartoDB").add_to(dual.m2)
    folium.TileLayer(
        tiles=get_tile_url(results["pre_s1"].select("VV"), vis),
        attr="GEE", name="Pre-Event SAR",
    ).add_to(dual.m1)
    folium.TileLayer(
        tiles=get_tile_url(results["post_s1"].select("VV"), vis),
        attr="GEE", name="Post-Event SAR",
    ).add_to(dual.m2)

    dual.m1.fit_bounds(bounds)
    dual.m2.fit_bounds(bounds)
    st_folium(dual, height=450, use_container_width=True, key="dual_map", returned_objects=[])
