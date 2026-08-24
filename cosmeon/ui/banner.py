"""
ui/banner.py
============
Renders the 5-metric summary card row and the severity progress bar.
Call render_banner(results) after a successful pipeline run.
"""
import streamlit as st
from cosmeon.core.scoring import severity_color, severity_label


def render_banner(results: dict) -> None:
    """Render the top-level 5-metric card row and environmental risk severity bar."""
    score = results.get("severity_score", 0)
    color = severity_color(score)
    label = severity_label(score)

    st.markdown(
        f"""
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:11px;margin-bottom:16px;">
          <div class="metric-card" title="Computed on valid landmasses only">
            <div class="metric-label">Flooded Area</div>
            <div class="metric-value">{results.get('flood_area',0):.1f}<span class="metric-unit">km²</span></div>
          </div>
          <div class="metric-card" title="NDVI drop below threshold">
            <div class="metric-label">Veg. Damage</div>
            <div class="metric-value">{results.get('ndvi_loss_area',0):.1f}<span class="metric-unit">km²</span></div>
          </div>
          <div class="metric-card" title="WorldPop 100m integration">
            <div class="metric-label">Pop. Exposed</div>
            <div class="metric-value" style="color:var(--warn);">{results.get('exposed_pop',0):,}<span class="metric-unit">ppl</span></div>
          </div>
          <div class="metric-card" title="Peak ensemble confidence">
            <div class="metric-label">Model Confidence</div>
            <div class="metric-value" style="color:var(--success);">{results.get('peak_confidence',0)}<span class="metric-unit">%</span></div>
          </div>
          <div class="metric-card" title="Weighted 5-factor severity">
            <div class="metric-label">Severity Index</div>
            <div class="metric-value" style="color:{color};">{score}<span class="metric-unit">/100</span></div>
          </div>
        </div>
        <div class="severity-container">
          <div class="severity-title">
            Environmental Risk State &nbsp;—&nbsp;
            <span style="color:{color};">{label}</span>
          </div>
          <div class="severity-bar-bg">
            <div class="severity-bar-fill"
                 style="width:{score}%;background:linear-gradient(90deg,#22c55e,#f59e0b,{color});transition:width 0.9s ease;">
            </div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
