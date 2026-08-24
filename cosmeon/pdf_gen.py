import sys
import json
import datetime
from fpdf import FPDF
import os

def generate_pdf():
    try:
        # 1. Read input JSON from stdin
        input_data = sys.stdin.read()
        r = json.loads(input_data)
        metrics = r.get('metrics', {})
        
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M UTC")

        pdf = FPDF()
        pdf.add_page()

        # Header
        pdf.set_font("Arial", 'B', 20)
        pdf.cell(0, 15, "NETRA.AI CLIMATE RISK ENGINE", ln=True, align="C")
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Automated Intelligence Assessment", ln=True, align="C")
        pdf.set_font("Arial", '', 10)
        pdf.cell(0, 10, f"Post-event: {r.get('post_start_s', 'N/A')} to {r.get('post_end_s', 'N/A')} | Generated: {now}", ln=True, align="C")
        pdf.ln(15)

        # Geographic area
        pdf.set_font("Arial", 'B', 14)
        pdf.set_text_color(10, 22, 40)
        pdf.cell(0, 10, "Geographic Impact Area", ln=True)
        pdf.set_font("Arial", '', 11)
        pdf.set_text_color(51, 65, 85)
        pdf.cell(0, 10, f"Bounding Box Coordinates: {r.get('bbox_str', 'N/A')}", ln=True)
        pdf.ln(10)

        # Executive Summary
        pdf.set_font("Arial", 'B', 14)
        pdf.set_text_color(10, 22, 40)
        pdf.cell(0, 10, "Executive Summary", ln=True)
        pdf.set_font("Arial", '', 11)
        pdf.set_text_color(51, 65, 85)
        
        summary = (f"Analysis of the study area ({r.get('aoi_km2', 0):,.0f} km2) utilizing multi-source satellite telemetry reveals "
                   f"{metrics.get('flood_area', 0):.1f} km2 of flood extent and {metrics.get('ndvi_loss_area', 0):.1f} km2 of agricultural loss. "
                   f"Integration with demographic data indicates {int(metrics.get('exposed_pop', 0)):,} individuals exposed. "
                   f"The probabilistic confidence peaked dynamically at {metrics.get('peak_confidence', 0) * 100:.1f}%. "
                   f"The derived Severity Index is {metrics.get('severity_score', 0):.1f}/100.")
        pdf.multi_cell(0, 8, summary)
        pdf.ln(15)

        # Quantitative Metrics Table
        pdf.set_font("Arial", 'B', 14)
        pdf.set_text_color(10, 22, 40)
        pdf.cell(0, 10, "Key Quantitative Metrics", ln=True)
        pdf.ln(2)
        
        header_color = (241, 245, 249)
        pdf.set_fill_color(*header_color)
        pdf.set_font("Arial", 'B', 10)
        
        metrics_list = [
            ("Flooded Area", f"{metrics.get('flood_area', 0):.2f} km2", f"SAR VV threshold {metrics.get('threshold', -2.0):.1f} dB"),
            ("Vegetation Damage", f"{metrics.get('ndvi_loss_area', 0):.2f} km2", f"NDVI drop threshold {metrics.get('ndvi_thresh', -0.12):.2f}"),
            ("Exposed Population", f"{int(metrics.get('exposed_pop', 0)):,} ppl", "WorldPop 100m Integration"),
            ("Anomalous Flood", f"{metrics.get('new_flood_anomaly', 0):.2f} km2", "JRC Predictive History mapping"),
            ("Peak Confidence", f"{metrics.get('peak_confidence', 0) * 100:.1f}%", "Ensemble fusion overlap (>95%)"),
            ("Severity Index", f"{metrics.get('severity_score', 0):.1f}/100", "Dynamic 5-factor composite")
        ]

        for m in metrics_list:
            pdf.set_font("Arial", 'B', 10)
            pdf.cell(55, 12, m[0], border=1)
            pdf.set_font("Arial", '', 10)
            pdf.cell(45, 12, m[1], border=1)
            pdf.cell(90, 12, m[2], border=1)
            pdf.ln()

        pdf.ln(15)

        # Provenance Table
        pdf.set_font("Arial", 'B', 14)
        pdf.set_text_color(10, 22, 40)
        pdf.cell(0, 10, "Data Provenance", ln=True)
        pdf.ln(2)

        prov = [
            ("Sentinel-1 SAR Base", f"{r.get('n_pre_s1', 0)} scenes ({r.get('pre_start_s', 'N/A')} - {r.get('pre_end_s', 'N/A')})"),
            ("Sentinel-1 SAR Post", f"{r.get('n_post_s1', 0)} scenes ({r.get('post_start_s', 'N/A')} - {r.get('post_end_s', 'N/A')})"),
            ("Sentinel-2 Opt Base", f"{r.get('n_pre_s2', 0)} scenes (Cloud limit: {r.get('used_cloud', 0)}%)"),
            ("Sentinel-2 Opt Post", f"{r.get('n_post_s2', 0)} scenes (Cloud limit: {r.get('used_cloud', 0)}%)"),
            ("Processing Scale", f"{r.get('scale', 0)} m spatial resolution")
        ]

        for p in prov:
            pdf.set_font("Arial", 'B', 10)
            pdf.cell(55, 12, p[0], border=1)
            pdf.set_font("Arial", '', 10)
            pdf.cell(135, 12, p[1], border=1)
            pdf.ln()

        # Output to temp file
        import tempfile
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        pdf.output(temp_file.name)
        temp_file.close()
        
        # Print path to stdout for NextJS to read
        print(temp_file.name)

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
