from __future__ import annotations
"""
ui/tabs/spatial_map.py
======================
Tab 0: Interactive flood map with pixel inspector.
"""
import math
import streamlit as st
import folium
from folium.plugins import Draw, MousePosition
from streamlit_folium import st_folium

from cosmeon.core.satellite import get_tile_url, sample_pixel


def _map_center(bounds: list) -> tuple[float, float, int, list]:
    """Compute centre lat/lon and appropriate zoom from bounds."""
    c_lat = (bounds[0][0] + bounds[1][0]) / 2
    c_lon = (bounds[0][1] + bounds[1][1]) / 2
    lat_diff = abs(bounds[1][0] - bounds[0][0])
    lon_diff = abs(bounds[1][1] - bounds[0][1])
    max_diff = max(lat_diff, lon_diff)
    zoom = int(math.log2(360 / max_diff)) + 1 if max_diff > 0 else 10
    return c_lat, c_lon, max(1, min(zoom, 18)), bounds


def render(results: dict | None, last_click, drawn_bounds: dict | None) -> tuple:
    """
    Render Tab 0.

    Returns:
        (new_drawn_bounds, new_last_click) — both may be None if unchanged
    """
    bounds = results["bounds"] if results else (
        [[drawn_bounds["min_lat"], drawn_bounds["min_lon"]],
         [drawn_bounds["max_lat"], drawn_bounds["max_lon"]]]
        if drawn_bounds else [[24.1, 89.7], [28.2, 96.0]]
    )
    c_lat, c_lon, zoom, _ = _map_center(bounds)

    st.subheader(
        "Interactive Pixel Inspector",
        help="Click anywhere to sample raw satellite values. "
             "Straight edges indicate orbital swath boundaries."
    )

    m = folium.Map(location=[c_lat, c_lon], zoom_start=zoom,
                   tiles="CartoDB dark_matter", prefer_canvas=True)
    m.fit_bounds(bounds)
    MousePosition(position="bottomleft", separator=" | ", prefix="Lat/Lon:").add_to(m)

    if results:
        # SAR radar layer
        folium.TileLayer(
            tiles=get_tile_url(results["post_s1"].select("VV"),
                               {"min": -25, "max": 0, "palette": ["#0a0e1a", "#2d4a6e", "#a8c7e8"]}),
            name="SAR Radar", attr="GEE", overlay=True,
        ).add_to(m)
        # SAR flood extent
        folium.TileLayer(
            tiles=get_tile_url(results["flood"].selfMask(),
                               {"palette": ["#00d4ff"], "opacity": 0.85}),
            name="SAR Flood Extent", attr="GEE", overlay=True,
        ).add_to(m)
        if results.get("ndvi_available"):
            folium.TileLayer(
                tiles=get_tile_url(results["optical_flood"].selfMask(),
                                   {"palette": ["#8b5cf6"], "opacity": 0.6}),
                name="Optical Water", attr="GEE", overlay=True, show=False,
            ).add_to(m)
            folium.TileLayer(
                tiles=get_tile_url(results["ndvi_loss"].selfMask(),
                                   {"palette": ["#ff6b35"], "opacity": 0.7}),
                name="Vegetation Damage", attr="GEE", overlay=True, show=False,
            ).add_to(m)
        folium.LayerControl(collapsed=False).add_to(m)
    else:
        Draw(
            draw_options={"polyline": False, "polygon": False, "circle": False,
                          "marker": False, "circlemarker": False, "rectangle": True},
            edit_options={"edit": False},
        ).add_to(m)
        folium.LayerControl().add_to(m)

    map_data = st_folium(m, height=530, use_container_width=True,
                         key="main_map", returned_objects=["last_clicked", "all_drawings"])

    new_drawn_bounds = None
    new_last_click   = None

    # Handle drawn rectangle → update AOI
    if map_data and map_data.get("all_drawings"):
        geom = map_data["all_drawings"][-1].get("geometry", {})
        if geom.get("type") == "Polygon":
            coords = geom["coordinates"][0]
            candidate = {
                "min_lon": min(p[0] for p in coords),
                "max_lon": max(p[0] for p in coords),
                "min_lat": min(p[1] for p in coords),
                "max_lat": max(p[1] for p in coords),
            }
            if candidate != drawn_bounds:
                new_drawn_bounds = candidate

    # Handle pixel click → sample
    if results and map_data and map_data.get("last_clicked"):
        click = (map_data["last_clicked"]["lng"], map_data["last_clicked"]["lat"])
        if click != last_click:
            new_last_click = click

    # Render pixel inspector card
    if results and last_click:
        lng, lat = last_click
        with st.spinner("🔍 Sampling pixel…"):
            pre_v  = sample_pixel(results["pre_s1"],  lng, lat, "VV")
            post_v = sample_pixel(results["post_s1"], lng, lat, "VV")
            ndwi_v = (sample_pixel(results["ndwi_post"], lng, lat, "NDWI_post")
                      if results.get("ndvi_available") and results.get("ndwi_post") else None)
            ndv_v  = (sample_pixel(results["ndvi_diff"], lng, lat, "NDVI_diff")
                      if results.get("ndvi_available") else None)
            sar_d  = (post_v - pre_v) if (pre_v and post_v) else None

        thr = results.get("threshold", -2.0)
        nthr = results.get("ndvi_thresh", -0.12)
        st.markdown(
            f"""
            <div class="pixel-card">
              <div style="font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--muted);margin-bottom:9px;">
                📍 {lat:.5f}, {lng:.5f}
              </div>
              <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:9px;">
                <div><div class="pixel-field-label">Pre-SAR VV</div>
                  <div class="pixel-field-value">{f'{pre_v:.2f} dB' if pre_v else 'N/A'}</div></div>
                <div><div class="pixel-field-label">Post-SAR VV</div>
                  <div class="pixel-field-value">{f'{post_v:.2f} dB' if post_v else 'N/A'}</div></div>
                <div><div class="pixel-field-label">SAR Change</div>
                  <div class="pixel-field-value"
                       style="color:{'#00d4ff' if sar_d and sar_d < thr else '#e2e8f0'};">
                    {f'{sar_d:.2f} dB' if sar_d else 'N/A'}</div></div>
                <div><div class="pixel-field-label">Opt. Water (NDWI)</div>
                  <div class="pixel-field-value"
                       style="color:{'#8b5cf6' if ndwi_v and ndwi_v > 0 else '#e2e8f0'};">
                    {f'{ndwi_v:.3f}' if ndwi_v else 'N/A'}</div></div>
                <div><div class="pixel-field-label">Veg Loss (NDVI Δ)</div>
                  <div class="pixel-field-value"
                       style="color:{'#ef4444' if ndv_v and ndv_v < nthr else '#22c55e'};">
                    {f'{ndv_v:.3f}' if ndv_v else 'N/A'}</div></div>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    return new_drawn_bounds, new_last_click
