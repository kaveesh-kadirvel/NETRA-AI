"""
ui/theme.py
===========
Injects the dark CSS theme and renders the platform header.
Call inject_theme() once at the top of app.py, before any other st calls.
"""
import streamlit as st

_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
:root {
  --bg: #0a0e1a; --surface: #111827; --surface2: #1a2235;
  --accent: #00d4ff; --accent2: #ff6b35;
  --danger: #ef4444; --success: #22c55e; --warn: #f59e0b;
  --text: #e2e8f0; --muted: #64748b; --border: #1e293b;
}
html, body, [class*="css"] { font-family: 'DM Sans', sans-serif; background-color: var(--bg); color: var(--text); }
.stApp { background-color: var(--bg); }
.platform-header { display: flex; align-items: flex-end; gap: 14px; padding: 22px 0 6px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.platform-title { font-family: 'Space Mono', monospace; font-size: 1.75rem; font-weight: 700; color: var(--accent); letter-spacing: -0.5px; line-height: 1; }
.platform-subtitle { font-size: 0.8rem; color: var(--muted); margin-top: 4px; }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; transition: border-color 0.2s; }
.metric-card:hover { border-color: var(--accent); }
.metric-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 5px; }
.metric-value { font-family: 'Space Mono', monospace; font-size: 1.45rem; font-weight: 700; color: var(--text); line-height: 1.1; }
.metric-unit { font-size: 0.72rem; color: var(--muted); margin-left: 3px; }
.severity-container { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 22px; margin: 14px 0; }
.severity-title { font-family: 'Space Mono', monospace; font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.severity-bar-bg { height: 10px; background: var(--surface2); border-radius: 5px; overflow: hidden; margin: 6px 0; }
.severity-bar-fill { height: 100%; border-radius: 5px; transition: width 0.9s ease; }
.info-box { background: rgba(0,212,255,0.06); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 8px 0; font-size: 0.83rem; }
.warn-box { background: rgba(245,158,11,0.06); border-left: 3px solid var(--warn); border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 8px 0; font-size: 0.83rem; }
.success-box { background: rgba(34,197,94,0.06); border-left: 3px solid var(--success); border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 8px 0; font-size: 0.83rem; }
.pixel-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin-top: 10px; }
.pixel-field-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 2px; }
.pixel-field-value { font-family: 'Space Mono', monospace; font-size: 0.92rem; }
.chat-ai { background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.12); border-radius: 12px 12px 12px 2px; padding: 16px; margin: 5px 0 5px 0; font-size: 0.88rem; line-height: 1.7; white-space: pre-wrap; }
.chat-who { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 8px; font-weight: bold; }
.stTabs [data-baseweb="tab-list"] { background: var(--surface); border-radius: 10px; padding: 4px; gap: 2px; border: 1px solid var(--border); }
.stTabs [data-baseweb="tab"] { border-radius: 8px; font-size: 0.8rem; font-family: 'DM Sans', sans-serif; font-weight: 500; padding: 8px 14px; color: var(--muted); }
.stTabs [aria-selected="true"] { background: var(--surface2) !important; color: var(--accent) !important; }
section[data-testid="stSidebar"] { background: var(--surface); border-right: 1px solid var(--border); }
section[data-testid="stSidebar"] .stMarkdown h3 { font-family: 'Space Mono', monospace; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent); }
.stButton > button { background: var(--accent) !important; color: #0a0e1a !important; font-family: 'Space Mono', monospace !important; font-size: 0.8rem !important; font-weight: 700 !important; border: none !important; border-radius: 8px !important; padding: 9px 18px !important; letter-spacing: 0.4px; transition: all 0.2s !important; }
.stButton > button:hover { filter: brightness(1.12) !important; transform: translateY(-1px); }
</style>
"""

_HEADER_HTML = """
<div class="platform-header">
  <div>
    <div class="platform-title">🌊 NETRA.AI: CLIMATE RISK INTELLIGENCE ENGINE</div>
    <div class="platform-subtitle">
      Automated Flood Detection &nbsp;·&nbsp; Agricultural Risk (NDVI)
      &nbsp;·&nbsp; Predictive History &nbsp;·&nbsp; Demographic Exposure API
    </div>
  </div>
</div>
"""


def inject_theme() -> None:
    """Inject CSS and render the top platform header. Call once in app.py."""
    st.markdown(_CSS, unsafe_allow_html=True)
    st.markdown(_HEADER_HTML, unsafe_allow_html=True)
