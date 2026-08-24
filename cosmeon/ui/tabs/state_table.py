from __future__ import annotations
"""
ui/tabs/state_table.py
======================
Tab 5: Structured state table and execution telemetry log.
Satisfies PS-06 requirements: state table with timestamps, regions, risk status.
"""
import pandas as pd
import streamlit as st


def render(db_logs: pd.DataFrame, results: dict | None) -> None:
    """Render the state table and pipeline execution logs."""
    st.subheader(
        "Structured Data Store & Execution Telemetry",
        help="Satisfies PS-06 requirements for event history tracking and chronological logs."
    )

    if db_logs.empty:
        st.info("No pipeline runs logged yet. Run the pipeline to populate the state table.")
    else:
        st.dataframe(db_logs, use_container_width=True, hide_index=True)

    if results:
        st.markdown("##### Execution Log")
        log_text = "\n".join(results.get("run_logs", []))
        st.code(log_text, language="shell")
