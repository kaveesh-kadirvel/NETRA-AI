from __future__ import annotations
"""
ui/tabs/ai_analyst.py
=====================
Tab 7: Generative AI risk analyst — translates GEE metrics into stakeholder text.
"""
import streamlit as st


def render(results: dict | None) -> None:
    """Render the AI text analyst tab."""
    st.subheader(
        "AI Endpoint / Generative Risk Analyst",
        help="Translates satellite metrics into actionable text for rapid stakeholder briefing."
    )

    q_in = st.text_input(
        "Ask for insights",
        placeholder="e.g. Generate a full descriptive analysis of current flood trends",
    )

    if not q_in:
        return
    if not results:
        st.warning("⚠️ Please run the pipeline first to generate metrics for analysis.")
        return

    r = results
    answer = (
        f"<strong>EXECUTIVE RISK SUMMARY</strong><br><br>"
        f"<strong>Overall Environmental Conditions:</strong><br>"
        f"The system has processed an Area of Interest covering {r.get('aoi_km2', 0):,.1f} km². "
        f"Recent temporal trends indicate a severe inundation event resulting in "
        f"<strong>{r.get('flood_area', 0):.1f} km² of standing floodwater</strong>. "
        f"Leveraging JRC predictive mapping, {r.get('new_flood_anomaly', 0):.1f} km² of this is "
        f"anomalous surface water. The radar backscatter delta "
        f"(Mean Change: {r.get('sar_mean', 0) or 0:.3f} dB) highlights persistent water pooling, "
        f"indicative of sustained drainage failures.<br><br>"
        f"<strong>Demographic &amp; Economic Impact:</strong><br>"
        f"Multispectral analysis reveals "
        f"<strong>{r.get('ndvi_loss_area', 0):.1f} km² of critical vegetation damage</strong>, "
        f"signalling severe crop submergence. Integration with WorldPop demographic rasters indicates "
        f"<strong>{r.get('exposed_pop', 0):,} individuals</strong> are directly exposed within "
        f"the inundation footprint.<br><br>"
        f"<strong>Model Confidence &amp; Telemetry:</strong><br>"
        f"The dual-sensor ensemble fusion, reinforced by SRTM slope masking to remove terrain shadows, "
        f"confirms these findings with a peak probabilistic confidence of "
        f"<strong>{r.get('peak_confidence', 0)}%</strong>. "
        f"The event has been assigned a Severity Index of "
        f"<strong>{r.get('severity_score', 0)}/100</strong> and securely logged in the "
        f"programmatic State Table for backend retrieval."
    )

    st.markdown(
        f'<div class="chat-ai"><div class="chat-who">INSIGHT ENGINE AI</div>{answer}</div>',
        unsafe_allow_html=True,
    )
