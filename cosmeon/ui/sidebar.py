from __future__ import annotations
"""
ui/sidebar.py
=============
Renders all sidebar controls and returns a typed config dict.
Centralises all st.sidebar.* calls so app.py stays clean.
"""
import math
import datetime
import streamlit as st
from cosmeon.config import (
    SAR_THRESHOLD_DEFAULT, NDVI_THRESH_DEFAULT, CLOUD_PCT_DEFAULT,
    SAR_CONF_DEFAULT, OPT_CONF_DEFAULT, SCALE_DEFAULT,
)


def get_sidebar_config(drawn_bounds: dict | None = None) -> dict:
    """
    Render sidebar widgets and return a config dict consumed by pipeline/runner.run().

    Returns:
        dict with keys:
            pre_start_s, pre_end_s, post_start_s, post_end_s  (str, YYYY-MM-DD)
            min_lon, min_lat, max_lon, max_lat                 (float)
            threshold, ndvi_thresh, cloud_pct                  (float/int)
            sar_conf_base, opt_conf_base                       (float)
            scale                                              (int)
            run                                                (bool — button clicked)
            bounds           [[min_lat,min_lon],[max_lat,max_lon]]
    """
    st.sidebar.markdown("### 📅 Temporal Data Ingestion")
    c1, c2 = st.sidebar.columns(2)
    pre_start  = c1.date_input("Pre start",  datetime.date(2022, 5,  1),
                               help="Start of baseline (normal conditions). Keep 1–3 months.")
    pre_end    = c2.date_input("Pre end",    datetime.date(2022, 5, 31),
                               help="End of baseline period.")
    post_start = c1.date_input("Post start", datetime.date(2022, 6,  1),
                               help="Crisis period start date.")
    post_end   = c2.date_input("Post end",   datetime.date(2022, 6, 30),
                               help="Crisis period end date.")

    st.sidebar.markdown("### 🎛️ Algorithm Parameters")
    sar_conf_base = st.sidebar.slider(
        "SAR Baseline Confidence", 0.5, 1.0, SAR_CONF_DEFAULT, 0.01,
        help="Radar penetrates clouds. Sets base trust in radar detection."
    )
    opt_conf_base = st.sidebar.slider(
        "Optical Baseline Confidence", 0.5, 1.0, OPT_CONF_DEFAULT, 0.01,
        help="Optical is vulnerable to haze. Sets base trust for optical layers."
    )

    st.sidebar.markdown("### ⚙️ Thresholds")
    threshold = st.sidebar.slider(
        "SAR Water Threshold (VV dB drop)", -6.0, -0.5, SAR_THRESHOLD_DEFAULT, 0.1,
        help="Open water scatters radar away. A drop larger than this defines a flood pixel."
    )
    ndvi_thresh = st.sidebar.slider(
        "NDVI Agricultural Loss (drop)", -0.3, 0.0, NDVI_THRESH_DEFAULT, 0.01,
        help="Negative NDVI change indicates crop submergence or vegetation death."
    )
    cloud_pct = st.sidebar.slider(
        "Max Optical Cloud Cover (%)", 5, 80, CLOUD_PCT_DEFAULT, 5,
        help="Excludes heavily obscured Sentinel-2 scenes prior to compositing."
    )

    st.sidebar.markdown("### 🗺️ Geographic AOI")
    aoi_mode = st.sidebar.radio(
        "AOI selection", ["Draw on map", "Manual coordinates"], index=0,
        help="Interactive boundary definition."
    )

    if aoi_mode == "Manual coordinates":
        mc1, mc2 = st.sidebar.columns(2)
        min_lon = mc1.number_input("Min lon", value=89.7, format="%.2f")
        max_lon = mc2.number_input("Max lon", value=96.0, format="%.2f")
        min_lat = mc1.number_input("Min lat", value=24.1, format="%.2f")
        max_lat = mc2.number_input("Max lat", value=28.2, format="%.2f")
    else:
        min_lon, max_lon, min_lat, max_lat = 89.7, 96.0, 24.1, 28.2
        if drawn_bounds:
            min_lon = drawn_bounds["min_lon"]
            max_lon = drawn_bounds["max_lon"]
            min_lat = drawn_bounds["min_lat"]
            max_lat = drawn_bounds["max_lat"]
        st.sidebar.markdown(
            '<div class="info-box" style="font-size:.74rem;">'
            '📌 Draw a rectangle on the Spatial Insights tab, then click Run.</div>',
            unsafe_allow_html=True,
        )

    st.sidebar.markdown("### ⚡ Execution")
    scale = st.sidebar.slider(
        "Processing scale (m)", 30, 500, SCALE_DEFAULT, 10,
        help="Higher scale = faster + less memory. Lower scale = higher resolution."
    )
    run_clicked = st.sidebar.button("🚀 Ingest & Process Data", use_container_width=True)

    # Build bounds list for map centering
    bounds = [[min_lat, min_lon], [max_lat, max_lon]]

    return {
        "pre_start_s":  pre_start.strftime("%Y-%m-%d"),
        "pre_end_s":    pre_end.strftime("%Y-%m-%d"),
        "post_start_s": post_start.strftime("%Y-%m-%d"),
        "post_end_s":   post_end.strftime("%Y-%m-%d"),
        "min_lon": min_lon,
        "min_lat": min_lat,
        "max_lon": max_lon,
        "max_lat": max_lat,
        "threshold":     threshold,
        "ndvi_thresh":   ndvi_thresh,
        "cloud_pct":     cloud_pct,
        "sar_conf_base": sar_conf_base,
        "opt_conf_base": opt_conf_base,
        "scale":  scale,
        "run":    run_clicked,
        "bounds": bounds,
    }
