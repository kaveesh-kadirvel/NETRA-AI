from __future__ import annotations
"""
ui/tabs/risk_severity.py
========================
Tab 3: Severity score display and predictive anomaly panel.
"""
import streamlit as st
from cosmeon.core.scoring import severity_color, severity_label


def render(results: dict | None) -> None:
    """Render the severity score panel with predictive (JRC) anomaly metrics."""
    if not results:
        st.info("🚀 Run the pipeline to see the risk and severity analysis.")
        return

    score = results.get("severity_score", 0)
    color = severity_color(score)
    label = severity_label(score)

    # Large score display
    st.markdown(
        f"""
        <div style="text-align:center;padding:28px 0;">
          <div style="font-family:'Space Mono';font-size:4.5rem;font-weight:700;color:{color};">
            {score}
          </div>
          <div style="color:var(--muted);letter-spacing:3px;">{label} RISK STATE</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.subheader(
        "5-Factor Extensible Risk Model",
        help="Combines Flood Extent, Demographic Exposure, Veg Loss, SAR Intensity, and NDVI Delta."
    )

    c1, c2 = st.columns(2)
    c1.metric(
        "Historical Flood Anomaly (JRC Dataset)",
        f"{results.get('new_flood_anomaly', 0):.1f} km²",
        help="Total flood area minus areas classified as permanent historical water by JRC.",
    )
    c2.metric(
        "Total Population Exposed",
        f"{results.get('exposed_pop', 0):,}",
        help="Calculated by isolating WorldPop 100m pixels within the SAR flood mask.",
    )

    # Factor breakdown
    bd = results.get("severity_breakdown", {})
    if bd:
        st.markdown("##### Factor Breakdown")
        cols = st.columns(5)
        factors = [
            ("Flood Extent", bd.get("flood", 0)),
            ("NDVI Loss",    bd.get("ndvi",  0)),
            ("Pop. Exposure", bd.get("pop",  0)),
            ("SAR Score",    bd.get("sar",   0)),
            ("NDVI Score",   bd.get("ndvi_s", 0)),
        ]
        for col, (name, val) in zip(cols, factors):
            col.metric(name, f"{val:.1f} / 100")
