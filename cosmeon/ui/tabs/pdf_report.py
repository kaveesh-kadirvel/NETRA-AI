from __future__ import annotations
"""
ui/tabs/pdf_report.py
=====================
Tab 8: Native PDF report generator using fpdf.
"""
import datetime
import streamlit as st


def render(results: dict | None) -> None:
    """Render the PDF report generation panel."""
    if not results:
        st.info("🚀 Run the pipeline first to enable PDF report generation.")
        return

    st.subheader("Generate Assessment Report (PDF)")
    st.markdown(
        '<div class="info-box">Requires the <code>fpdf</code> library — '
        'install with <code>pip install fpdf</code> if not present.</div>',
        unsafe_allow_html=True,
    )

    if not st.button("⬇️ Generate Native PDF Report", use_container_width=True):
        return

    try:
        from fpdf import FPDF
    except ImportError:
        st.error("⚠️ Library 'fpdf' not found. Run `pip install fpdf` to enable PDF generation.")
        return

    r   = results
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M UTC")

    pdf = FPDF()
    pdf.add_page()

    # ── Header ───────────────────────────────────────────────────
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "NETRA.AI CLIMATE RISK ENGINE", ln=True, align="C")
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Automated Intelligence Assessment", ln=True, align="C")
    pdf.set_font("Arial", "", 10)
    pdf.cell(
        0, 10,
        f"Post-event: {r.get('post_start_s', 'N/A')} to {r.get('post_end_s', 'N/A')} | Generated: {now}",
        ln=True, align="C",
    )
    pdf.ln(10)

    # ── Geographic Area ───────────────────────────────────────────
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Geographic Impact Area", ln=True)
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 10, f"Bounding Box: {r.get('bbox_str', 'N/A')}", ln=True)
    pdf.ln(5)

    # ── Executive Summary ─────────────────────────────────────────
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Executive Summary", ln=True)
    pdf.set_font("Arial", "", 10)
    summary = (
        f"Analysis of the study area ({r.get('aoi_km2', 0):,.0f} km2) using multi-source "
        f"satellite telemetry reveals {r.get('flood_area', 0):.1f} km2 of flood extent and "
        f"{r.get('ndvi_loss_area', 0):.1f} km2 of agricultural loss. "
        f"Integration with demographic data indicates {r.get('exposed_pop', 0):,} individuals exposed. "
        f"Probabilistic confidence peaked at {r.get('peak_confidence', 0)}%. "
        f"Severity Index: {r.get('severity_score', 0)}/100."
    )
    pdf.multi_cell(0, 8, summary)
    pdf.ln(10)

    # ── Metrics Table ─────────────────────────────────────────────
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Key Quantitative Metrics", ln=True)
    pdf.set_font("Arial", "", 10)
    metrics = [
        ("Flooded Area",       f"{r.get('flood_area', 0):.2f} km2",       f"SAR VV threshold {r.get('threshold', 0)} dB"),
        ("Vegetation Damage",  f"{r.get('ndvi_loss_area', 0):.2f} km2",   f"NDVI drop threshold {r.get('ndvi_thresh', 0):.2f}"),
        ("Exposed Population", f"{r.get('exposed_pop', 0):,} ppl",        "WorldPop 100m integration"),
        ("Anomalous Flood",    f"{r.get('new_flood_anomaly', 0):.2f} km2","JRC predictive history mapping"),
        ("Peak Confidence",    f"{r.get('peak_confidence', 0)}%",         "Ensemble fusion overlap (>95%)"),
        ("Severity Index",     f"{r.get('severity_score', 0)}/100",       "Dynamic 5-factor composite"),
    ]
    for label, value, note in metrics:
        pdf.cell(50, 10, label, border=1)
        pdf.cell(40, 10, value, border=1)
        pdf.cell(100, 10, note, border=1)
        pdf.ln()
    pdf.ln(10)

    # ── Data Provenance ───────────────────────────────────────────
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Data Provenance", ln=True)
    pdf.set_font("Arial", "", 10)
    prov = [
        ("Sentinel-1 SAR Base",  f"{r.get('n_pre_s1', 'N/A')} scenes ({r.get('pre_start_s', '')} – {r.get('pre_end_s', '')})"),
        ("Sentinel-1 SAR Post",  f"{r.get('n_post_s1', 'N/A')} scenes ({r.get('post_start_s', '')} – {r.get('post_end_s', '')})"),
        ("Sentinel-2 Opt Base",  f"{r.get('n_pre_s2', 'N/A')} scenes (Cloud ≤ {r.get('used_cloud', 'N/A')}%)"),
        ("Sentinel-2 Opt Post",  f"{r.get('n_post_s2', 'N/A')} scenes (Cloud ≤ {r.get('used_cloud', 'N/A')}%)"),
        ("Processing Scale",     f"{r.get('scale', 'N/A')} m spatial resolution"),
    ]
    for label, value in prov:
        pdf.cell(55, 10, label, border=1)
        pdf.cell(135, 10, value, border=1)
        pdf.ln()

    # ── Output ────────────────────────────────────────────────────
    out_path = "/tmp/Climate_Risk_Report.pdf"
    pdf.output(out_path)

    with open(out_path, "rb") as f:
        pdf_bytes = f.read()

    st.download_button(
        label="📥 Save PDF to Computer",
        data=pdf_bytes,
        file_name=f"Climate_Risk_Report_{now.replace(':', '').replace(' ', '_')}.pdf",
        mime="application/pdf",
        use_container_width=True,
    )
    st.success("✅ PDF generated! Click the button above to save.")
