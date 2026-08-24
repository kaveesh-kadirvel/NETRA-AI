"""
COSMEON — Streamlit Entry Point
================================
Thin orchestrator: wires UI modules, session state, and the pipeline runner.
All heavy computation stays in core/ and pipeline/.
Run: streamlit run streamlit/app.py
"""
import math
import pandas as pd
import streamlit as st

# ── Page config must be the FIRST Streamlit call ─────────────────────────────
st.set_page_config(
    page_title="NETRA.AI Insight Engine",
    layout="wide",
    page_icon="🌊",
    initial_sidebar_state="expanded",
)

from cosmeon.ui.theme   import inject_theme
from cosmeon.ui.sidebar import get_sidebar_config
from cosmeon.ui.banner  import render_banner
from cosmeon.ui.tabs    import (
    spatial_map, sar_analysis, vegetation,
    risk_severity, confidence, state_table,
    api_endpoint, ai_analyst, pdf_report,
)
from cosmeon.pipeline.runner import run as run_pipeline, build_state_record

# ── Inject CSS + platform header ─────────────────────────────────────────────
inject_theme()

# ── Session state initialisation ─────────────────────────────────────────────
_DEFAULTS = {
    "results":       None,
    "last_click":    None,
    "drawn_bounds":  None,
    "db_logs":       pd.DataFrame(),
}
for key, default in _DEFAULTS.items():
    if key not in st.session_state:
        st.session_state[key] = default

# ── Sidebar controls ──────────────────────────────────────────────────────────
cfg = get_sidebar_config(drawn_bounds=st.session_state.drawn_bounds)

# ── Pipeline execution ────────────────────────────────────────────────────────
if cfg["run"]:
    with st.spinner("📡 Processing distributed geospatial data (tileScale memory partitioning active)…"):
        try:
            results = run_pipeline(cfg)
            # Append to state table
            st.session_state.db_logs = pd.concat(
                [st.session_state.db_logs, build_state_record(results)],
                ignore_index=True,
            )
            st.session_state.results = results
            st.success("✅ Memory-safe distributed computation complete.")
        except RuntimeError as exc:
            st.error(f"❌ Pipeline error: {exc}")
            st.session_state.results = None

# ── Summary banner ────────────────────────────────────────────────────────────
if st.session_state.results:
    render_banner(st.session_state.results)

# ── Map centre helper (used by all map tabs) ──────────────────────────────────
def _map_state():
    if st.session_state.results:
        bounds = st.session_state.results["bounds"]
    elif st.session_state.drawn_bounds:
        b = st.session_state.drawn_bounds
        bounds = [[b["min_lat"], b["min_lon"]], [b["max_lat"], b["max_lon"]]]
    else:
        bounds = [[cfg["min_lat"], cfg["min_lon"]], [cfg["max_lat"], cfg["max_lon"]]]

    c_lat = (bounds[0][0] + bounds[1][0]) / 2
    c_lon = (bounds[0][1] + bounds[1][1]) / 2
    lat_d = abs(bounds[1][0] - bounds[0][0])
    lon_d = abs(bounds[1][1] - bounds[0][1])
    max_d = max(lat_d, lon_d)
    zoom  = int(math.log2(360 / max_d)) + 1 if max_d > 0 else 10
    return c_lat, c_lon, max(1, min(zoom, 18)), bounds


c_lat, c_lon, zoom, bounds = _map_state()

# ── Tab panels ────────────────────────────────────────────────────────────────
tabs = st.tabs([
    "🗺️ Spatial Insights",
    "📊 Core Analysis",
    "🌿 Vegetation (NDVI)",
    "🧠 Risk & Severity",
    "💯 Confidence Engine",
    "🗄️ State Table & Logs",
    "💻 REST API Endpoint",
    "💬 Generative AI",
    "📄 PDF Report Gen",
])

with tabs[0]:
    new_drawn, new_click = spatial_map.render(
        results=st.session_state.results,
        last_click=st.session_state.last_click,
        drawn_bounds=st.session_state.drawn_bounds,
    )
    if new_drawn is not None:
        st.session_state.drawn_bounds = new_drawn
        st.session_state.results = None
        st.rerun()
    if new_click is not None:
        st.session_state.last_click = new_click
        st.rerun()

with tabs[1]:
    sar_analysis.render(st.session_state.results, bounds, c_lat, c_lon, zoom)

with tabs[2]:
    vegetation.render(st.session_state.results, bounds, c_lat, c_lon, zoom)

with tabs[3]:
    risk_severity.render(st.session_state.results)

with tabs[4]:
    confidence.render(st.session_state.results, bounds, c_lat, c_lon, zoom)

with tabs[5]:
    state_table.render(st.session_state.db_logs, st.session_state.results)

with tabs[6]:
    api_endpoint.render(st.session_state.results)

with tabs[7]:
    ai_analyst.render(st.session_state.results)

with tabs[8]:
    pdf_report.render(st.session_state.results)

# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown(
    """
    <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0 14px;">
    <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#475569;">
      <span>NETRA.AI INTELLIGENCE ENGINE · SENTINEL FUSION</span>
      <span>tileScale=16 · bestEffort=True · KeyError Immunity</span>
    </div>
    """,
    unsafe_allow_html=True,
)
