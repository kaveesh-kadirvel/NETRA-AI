"""Expose all tab modules for clean imports in app.py."""
from cosmeon.ui.tabs import spatial_map     # noqa: F401
from cosmeon.ui.tabs import sar_analysis    # noqa: F401
from cosmeon.ui.tabs import vegetation      # noqa: F401
from cosmeon.ui.tabs import risk_severity   # noqa: F401
from cosmeon.ui.tabs import confidence      # noqa: F401
from cosmeon.ui.tabs import state_table     # noqa: F401
from cosmeon.ui.tabs import api_endpoint    # noqa: F401
from cosmeon.ui.tabs import ai_analyst      # noqa: F401
from cosmeon.ui.tabs import pdf_report      # noqa: F401

__all__ = [
    "spatial_map", "sar_analysis", "vegetation",
    "risk_severity", "confidence", "state_table",
    "api_endpoint", "ai_analyst", "pdf_report",
]
