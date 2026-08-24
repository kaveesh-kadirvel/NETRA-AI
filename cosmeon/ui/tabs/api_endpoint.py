from __future__ import annotations
"""
ui/tabs/api_endpoint.py
=======================
Tab 6: REST API JSON payload viewer + download.
Satisfies PS-06: "Provide an API endpoint for retrieving processed insights programmatically."
"""
import json
import datetime
import streamlit as st
from cosmeon.core.scoring import severity_label


def render(results: dict | None) -> None:
    """Render the JSON API payload viewer and download button."""
    st.subheader(
        "Programmatic JSON Endpoint",
        help="Satisfies PS-06: API endpoint for retrieving insights programmatically."
    )

    if not results:
        st.info("🚀 Run the pipeline to generate the API payload.")
        return

    payload = {
        "meta": {
            "timestamp": datetime.datetime.now().isoformat(),
            "provider":  "NETRA.AI API v1",
        },
        "request_params": {
            "bbox":       results.get("bbox_str", ""),
            "pre_dates":  [results.get("pre_start_s", ""), results.get("pre_end_s", "")],
            "post_dates": [results.get("post_start_s", ""), results.get("post_end_s", "")],
        },
        "insight_payload": {
            "risk_status":    severity_label(results.get("severity_score", 0)),
            "severity_index": results.get("severity_score", 0),
            "metrics": {
                "flood_extent_km2":      round(results.get("flood_area",         0), 2),
                "anomalous_flood_km2":   round(results.get("new_flood_anomaly",  0), 2),
                "agricultural_loss_km2": round(results.get("ndvi_loss_area",     0), 2),
                "population_exposed":    results.get("exposed_pop",              0),
                "model_confidence_pct":  results.get("peak_confidence",          0),
            },
        },
    }

    json_str = json.dumps(payload, indent=2)
    st.code(json_str, language="json")
    st.download_button(
        label="⬇️ Download JSON Payload",
        data=json_str,
        file_name="cosmeon_api_response.json",
        mime="application/json",
    )
