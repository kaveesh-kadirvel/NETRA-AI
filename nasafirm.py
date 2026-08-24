# test_nasa_apis.py
import requests
import os

# ── Load from .env safely (never hardcode) ──────────────────────
from dotenv import load_dotenv
load_dotenv()

FIRMS_KEY = os.getenv("NASA_FIRMS_MAP_KEY")
NASA_USER  = os.getenv("NASA_EARTHDATA_USERNAME")
NASA_PASS  = os.getenv("NASA_EARTHDATA_PASSWORD")

print("=" * 55)
print("  COSMEON — NASA API Connection Tests")
print("=" * 55)

# ────────────────────────────────────────────────────────────────
# TEST 1: NASA FIRMS Map Key Validation
# Checks if your FIRMS key is active and valid
# ────────────────────────────────────────────────────────────────
print("\n📡 Test 1: NASA FIRMS Key Validation...")
try:
    url = f"https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY={FIRMS_KEY}"
    r   = requests.get(url, timeout=10)

    if r.status_code == 200:
        data = r.json()
        print(f"  ✅ FIRMS Key is VALID!")
        print(f"  📊 Transactions today:    {data.get('current_transactions', 'N/A')}")
        print(f"  📊 Max transactions/day:  {data.get('transaction_limit', 'N/A')}")
    else:
        print(f"  ❌ Key validation failed. Status: {r.status_code}")
except Exception as e:
    print(f"  ❌ Error: {e}")

# ────────────────────────────────────────────────────────────────
# TEST 2: FIRMS — Fetch Real Flood/Fire Data for Assam
# Returns actual active event coordinates as CSV
# ────────────────────────────────────────────────────────────────
print("\n🌍 Test 2: FIRMS Active Data — Assam, India (last 7 days)...")
try:
    # Bounding box: Assam [west,south,east,north]
    bbox = "89.7,24.1,96.0,28.2"

    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv"
        f"/{FIRMS_KEY}/VIIRS_SNPP_NRT/{bbox}/7"
    )
    r = requests.get(url, timeout=15)

    if r.status_code == 200:
        lines = r.text.strip().split("\n")
        print(f"  ✅ FIRMS data fetched successfully!")
        print(f"  📊 Records returned: {len(lines) - 1} events")  # minus header
        if len(lines) > 1:
            print(f"\n  📋 Header columns:")
            print(f"  {lines[0]}")
            print(f"\n  🔥 First data row (sample):")
            print(f"  {lines[1]}")
        else:
            print("  ℹ️  No active events in this region right now (that's fine!)")
    else:
        print(f"  ❌ Failed. Status: {r.status_code}")
        print(f"  Response: {r.text[:200]}")
except Exception as e:
    print(f"  ❌ Error: {e}")

# ────────────────────────────────────────────────────────────────
# TEST 3: NASA Earthdata Login (username + password auth)
# Tests if your Earthdata credentials are valid
# ────────────────────────────────────────────────────────────────
print("\n🔐 Test 3: NASA Earthdata Login...")
try:
    r = requests.get(
        "https://urs.earthdata.nasa.gov/api/users/tokens",
        auth=(NASA_USER, NASA_PASS),
        timeout=10
    )
    if r.status_code == 200:
        tokens = r.json()
        print(f"  ✅ Earthdata credentials are VALID!")
        print(f"  👤 Username: {NASA_USER}")
        print(f"  🔑 Active tokens: {len(tokens)}")
    elif r.status_code == 401:
        print(f"  ❌ Invalid credentials — check username/password in .env")
    else:
        print(f"  ⚠️  Unexpected status: {r.status_code}")
except Exception as e:
    print(f"  ❌ Error: {e}")

# ────────────────────────────────────────────────────────────────
# TEST 4: Open-Meteo Rainfall (no key needed — always works)
# ────────────────────────────────────────────────────────────────
print("\n🌧️  Test 4: Open-Meteo Rainfall — Guwahati, Assam...")
try:
    r = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude":      26.18,
            "longitude":     91.74,
            "daily":         "precipitation_sum",
            "past_days":     7,
            "forecast_days": 1,
            "timezone":      "Asia/Kolkata"
        },
        timeout=10
    )
    data     = r.json()
    dates    = data["daily"]["time"]
    rainfall = data["daily"]["precipitation_sum"]
    total    = sum(v for v in rainfall if v is not None)

    print(f"  ✅ Open-Meteo is working!")
    print(f"  📍 Location: Guwahati, Assam (26.18°N, 91.74°E)")
    print(f"  🌧️  Last 7 days rainfall breakdown:")
    for date, mm in zip(dates, rainfall):
        bar = "█" * int((mm or 0) / 3)
        print(f"     {date}  {str(mm or 0).rjust(6)} mm  {bar}")
    print(f"  💧 Total 7-day rainfall: {total:.1f} mm")
except Exception as e:
    print(f"  ❌ Error: {e}")

# ────────────────────────────────────────────────────────────────
# SUMMARY
# ────────────────────────────────────────────────────────────────
print("\n" + "=" * 55)
print("  All tests complete.")
print("  If all 4 show ✅ — you are 100% ready for hackathon!")
print("=" * 55)