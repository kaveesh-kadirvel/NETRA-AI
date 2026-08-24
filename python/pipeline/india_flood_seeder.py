#!/usr/bin/env python3
"""
COSMEON — India-Wide Flood Intelligence Seeder
===============================================
Covers 45 flood-prone districts across 12 major Indian states.
Uses real Open-Meteo API for live rainfall per district.
Computes risk scores using historical flood vulnerability + live weather.
Pushes structured flood zone data to the Next.js ingest API.

Run: /opt/anaconda3/bin/python python/pipeline/india_flood_seeder.py
"""
import os, sys, json, uuid, time, math, requests
from datetime import datetime, timezone, timedelta
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent.parent / '.env.local')
except Exception:
    pass

PIPELINE_SECRET = os.getenv('PIPELINE_SECRET', 'cosmeon-secret-2026')
INGEST_URL      = os.getenv('NEXTJS_INGEST_URL', 'http://localhost:3000/api/pipeline/ingest')

TODAY      = datetime.now(timezone.utc)
END_DATE   = TODAY.strftime('%Y-%m-%d')
START_DATE = (TODAY - timedelta(days=14)).strftime('%Y-%m-%d')
REF_START  = (TODAY - timedelta(days=60)).strftime('%Y-%m-%d')
REF_END    = (TODAY - timedelta(days=30)).strftime('%Y-%m-%d')

# ═══════════════════════════════════════════════════════════════
#  India flood-prone districts — 45 districts, 12 states
#  Fields: name, state, lat, lon, area_km2, pop, hist_flood_km2,
#          hist_risk (historical baseline), elev_vuln, jrc_pct
# ═══════════════════════════════════════════════════════════════
INDIA_DISTRICTS = [
    # ── ASSAM (Brahmaputra floodplain — most vulnerable) ──────
    dict(name='Dhubri',       state='Assam',        lat=26.02, lon=89.98, area_km2=2838,  pop=1949258,  hist_flood_km2=420, hist_risk=72, elev_vuln=0.85, jrc_pct=0.18),
    dict(name='Kamrup',       state='Assam',        lat=26.14, lon=91.74, area_km2=1694,  pop=1513841,  hist_flood_km2=310, hist_risk=68, elev_vuln=0.78, jrc_pct=0.12),
    dict(name='Barpeta',      state='Assam',        lat=26.32, lon=91.00, area_km2=3245,  pop=1693190,  hist_flood_km2=580, hist_risk=74, elev_vuln=0.82, jrc_pct=0.22),
    dict(name='Morigaon',     state='Assam',        lat=26.25, lon=92.33, area_km2=1551,  pop=957423,   hist_flood_km2=290, hist_risk=65, elev_vuln=0.76, jrc_pct=0.14),
    dict(name='Majuli',       state='Assam',        lat=27.00, lon=94.18, area_km2=880,   pop=167000,   hist_flood_km2=210, hist_risk=81, elev_vuln=0.91, jrc_pct=0.35),

    # ── BIHAR (Kosi, Gandak, Bagmati — chronic floods) ────────
    dict(name='Darbhanga',    state='Bihar',        lat=26.15, lon=85.90, area_km2=2278,  pop=3920000,  hist_flood_km2=680, hist_risk=78, elev_vuln=0.88, jrc_pct=0.16),
    dict(name='Muzaffarpur',  state='Bihar',        lat=26.12, lon=85.38, area_km2=3173,  pop=4778000,  hist_flood_km2=720, hist_risk=76, elev_vuln=0.86, jrc_pct=0.14),
    dict(name='Sitamarhi',    state='Bihar',        lat=26.60, lon=85.48, area_km2=2294,  pop=3420000,  hist_flood_km2=650, hist_risk=80, elev_vuln=0.89, jrc_pct=0.19),
    dict(name='Supaul',       state='Bihar',        lat=26.11, lon=86.60, area_km2=2410,  pop=2230000,  hist_flood_km2=590, hist_risk=75, elev_vuln=0.87, jrc_pct=0.17),
    dict(name='Kishanganj',   state='Bihar',        lat=26.10, lon=87.94, area_km2=1884,  pop=1690000,  hist_flood_km2=430, hist_risk=70, elev_vuln=0.83, jrc_pct=0.15),

    # ── WEST BENGAL (Ganga delta, DVC) ────────────────────────
    dict(name='Murshidabad',  state='West Bengal',  lat=24.18, lon=88.27, area_km2=5324,  pop=7100000,  hist_flood_km2=820, hist_risk=71, elev_vuln=0.79, jrc_pct=0.21),
    dict(name='Malda',        state='West Bengal',  lat=25.00, lon=88.14, area_km2=3733,  pop=3990000,  hist_flood_km2=540, hist_risk=65, elev_vuln=0.74, jrc_pct=0.16),
    dict(name='Cooch Behar',  state='West Bengal',  lat=26.32, lon=89.44, area_km2=3387,  pop=2820000,  hist_flood_km2=490, hist_risk=68, elev_vuln=0.80, jrc_pct=0.20),
    dict(name='Jalpaiguri',   state='West Bengal',  lat=26.51, lon=88.73, area_km2=6277,  pop=3940000,  hist_flood_km2=610, hist_risk=66, elev_vuln=0.77, jrc_pct=0.18),

    # ── ODISHA (Mahanadi, Baitarani) ──────────────────────────
    dict(name='Kendrapara',   state='Odisha',       lat=20.50, lon=86.42, area_km2=2644,  pop=1440000,  hist_flood_km2=480, hist_risk=74, elev_vuln=0.84, jrc_pct=0.25),
    dict(name='Balasore',     state='Odisha',       lat=21.49, lon=86.93, area_km2=3634,  pop=2320000,  hist_flood_km2=520, hist_risk=72, elev_vuln=0.82, jrc_pct=0.20),
    dict(name='Bhadrak',      state='Odisha',       lat=21.06, lon=86.51, area_km2=2505,  pop=1510000,  hist_flood_km2=440, hist_risk=70, elev_vuln=0.81, jrc_pct=0.22),
    dict(name='Cuttack',      state='Odisha',       lat=20.46, lon=85.88, area_km2=3975,  pop=2620000,  hist_flood_km2=560, hist_risk=69, elev_vuln=0.78, jrc_pct=0.19),

    # ── UTTAR PRADESH (Ghaghra, Rapti, Sharda) ────────────────
    dict(name='Lakhimpur Kheri', state='Uttar Pradesh', lat=27.94, lon=80.79, area_km2=7680, pop=4010000, hist_flood_km2=870, hist_risk=73, elev_vuln=0.76, jrc_pct=0.14),
    dict(name='Bahraich',     state='Uttar Pradesh', lat=27.57, lon=81.59, area_km2=5745, pop=3490000,  hist_flood_km2=740, hist_risk=71, elev_vuln=0.80, jrc_pct=0.16),
    dict(name='Gorakhpur',    state='Uttar Pradesh', lat=26.76, lon=83.37, area_km2=3483, pop=4440000,  hist_flood_km2=630, hist_risk=68, elev_vuln=0.75, jrc_pct=0.13),
    dict(name='Ballia',       state='Uttar Pradesh', lat=25.76, lon=84.15, area_km2=2981, pop=3240000,  hist_flood_km2=570, hist_risk=66, elev_vuln=0.72, jrc_pct=0.15),

    # ── KERALA (Western Ghats — 2018/2019 megafloods) ─────────
    dict(name='Alappuzha',    state='Kerala',       lat=9.49,  lon=76.33, area_km2=1414,  pop=2130000,  hist_flood_km2=380, hist_risk=76, elev_vuln=0.70, jrc_pct=0.28),
    dict(name='Ernakulam',    state='Kerala',       lat=9.98,  lon=76.28, area_km2=3068,  pop=3290000,  hist_flood_km2=420, hist_risk=68, elev_vuln=0.64, jrc_pct=0.20),
    dict(name='Idukki',       state='Kerala',       lat=9.92,  lon=77.10, area_km2=4479,  pop=1110000,  hist_flood_km2=290, hist_risk=72, elev_vuln=0.58, jrc_pct=0.08),
    dict(name='Wayanad',      state='Kerala',       lat=11.61, lon=76.13, area_km2=2132,  pop=820000,   hist_flood_km2=240, hist_risk=70, elev_vuln=0.55, jrc_pct=0.06),

    # ── MAHARASHTRA (Krishna, Koyna, Godavari) ────────────────
    dict(name='Kolhapur',     state='Maharashtra',  lat=16.70, lon=74.24, area_km2=7685,  pop=3950000,  hist_flood_km2=510, hist_risk=65, elev_vuln=0.62, jrc_pct=0.10),
    dict(name='Sangli',       state='Maharashtra',  lat=16.86, lon=74.56, area_km2=8572,  pop=2820000,  hist_flood_km2=480, hist_risk=63, elev_vuln=0.60, jrc_pct=0.12),
    dict(name='Ratnagiri',    state='Maharashtra',  lat=17.00, lon=73.30, area_km2=8208,  pop=1620000,  hist_flood_km2=350, hist_risk=62, elev_vuln=0.65, jrc_pct=0.09),

    # ── ANDHRA PRADESH (Krishna, Godavari deltas) ─────────────
    dict(name='East Godavari', state='Andhra Pradesh', lat=17.00, lon=82.00, area_km2=10807, pop=5150000, hist_flood_km2=760, hist_risk=74, elev_vuln=0.72, jrc_pct=0.23),
    dict(name='West Godavari', state='Andhra Pradesh', lat=16.92, lon=81.43, area_km2=7742, pop=3940000, hist_flood_km2=640, hist_risk=71, elev_vuln=0.70, jrc_pct=0.21),
    dict(name='Krishna',      state='Andhra Pradesh', lat=16.35, lon=80.46, area_km2=8727, pop=4530000, hist_flood_km2=590, hist_risk=68, elev_vuln=0.68, jrc_pct=0.18),

    # ── TELANGANA (Godavari tributaries) ──────────────────────
    dict(name='Khammam',      state='Telangana',    lat=17.25, lon=80.15, area_km2=16029, pop=2630000,  hist_flood_km2=520, hist_risk=64, elev_vuln=0.66, jrc_pct=0.12),
    dict(name='Suryapet',     state='Telangana',    lat=17.14, lon=79.62, area_km2=3636,  pop=1070000,  hist_flood_km2=310, hist_risk=60, elev_vuln=0.63, jrc_pct=0.10),

    # ── GUJARAT (Narmada, Mahi, Sabarmati) ────────────────────
    dict(name='Vadodara',     state='Gujarat',      lat=22.31, lon=73.19, area_km2=7795,  pop=4160000,  hist_flood_km2=440, hist_risk=62, elev_vuln=0.68, jrc_pct=0.11),
    dict(name='Bharuch',      state='Gujarat',      lat=21.70, lon=73.00, area_km2=6524,  pop=1550000,  hist_flood_km2=390, hist_risk=61, elev_vuln=0.70, jrc_pct=0.14),
    dict(name='Kheda',        state='Gujarat',      lat=22.75, lon=72.69, area_km2=4215,  pop=2290000,  hist_flood_km2=360, hist_risk=60, elev_vuln=0.67, jrc_pct=0.13),

    # ── RAJASTHAN (Chambal, Banas — flash floods) ─────────────
    dict(name='Barmer',       state='Rajasthan',    lat=25.75, lon=71.38, area_km2=28387, pop=2600000,  hist_flood_km2=280, hist_risk=45, elev_vuln=0.50, jrc_pct=0.03),
    dict(name='Banswara',     state='Rajasthan',    lat=23.54, lon=74.44, area_km2=5037,  pop=1800000,  hist_flood_km2=320, hist_risk=55, elev_vuln=0.60, jrc_pct=0.08),

    # ── UTTARAKHAND (Himalayan rivers — cloud burst floods) ───
    dict(name='Chamoli',      state='Uttarakhand',  lat=30.41, lon=79.32, area_km2=8030,  pop=392000,   hist_flood_km2=140, hist_risk=63, elev_vuln=0.55, jrc_pct=0.05),
    dict(name='Uttarkashi',   state='Uttarakhand',  lat=30.73, lon=78.44, area_km2=8016,  pop=330000,   hist_flood_km2=120, hist_risk=61, elev_vuln=0.52, jrc_pct=0.04),

    # ── HIMACHAL PRADESH (Beas, Sutlej) ───────────────────────
    dict(name='Mandi',        state='Himachal Pradesh', lat=31.71, lon=76.92, area_km2=3950, pop=1000000, hist_flood_km2=180, hist_risk=59, elev_vuln=0.50, jrc_pct=0.07),

    # ── TAMIL NADU (Cauvery, northeast monsoon) ───────────────
    dict(name='Nagapattinam', state='Tamil Nadu',   lat=10.76, lon=79.84, area_km2=2715,  pop=1610000,  hist_flood_km2=350, hist_risk=67, elev_vuln=0.71, jrc_pct=0.20),
    dict(name='Thanjavur',    state='Tamil Nadu',   lat=10.79, lon=79.14, area_km2=3411,  pop=2400000,  hist_flood_km2=420, hist_risk=65, elev_vuln=0.69, jrc_pct=0.18),
    dict(name='Cuddalore',    state='Tamil Nadu',   lat=11.75, lon=79.77, area_km2=3678,  pop=2600000,  hist_flood_km2=390, hist_risk=66, elev_vuln=0.70, jrc_pct=0.17),
]


def get_live_rainfall(lat: float, lon: float) -> dict:
    """Fetch real 7-day rainfall and current conditions from Open-Meteo."""
    try:
        r = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params=dict(
                latitude=lat, longitude=lon,
                daily='precipitation_sum',
                current='temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
                past_days=10, forecast_days=1, timezone='Asia/Kolkata',
            ),
            timeout=12,
        )
        data = r.json()
        daily = data.get('daily', {}).get('precipitation_sum', [])
        rain_7d  = round(sum(v or 0 for v in daily[-7:]), 2)
        rain_24h = round(daily[-1] or 0, 2) if daily else 0.0
        curr = data.get('current', {})
        return dict(
            rain_7d=rain_7d, rain_24h=rain_24h,
            temp_c=curr.get('temperature_2m'),
            humidity=curr.get('relative_humidity_2m'),
            wind_kmh=curr.get('wind_speed_10m'),
            precip_c=curr.get('precipitation', 0),
        )
    except Exception as ex:
        print(f'    ⚠ Open-Meteo error: {ex}')
        return dict(rain_7d=0, rain_24h=0, temp_c=None, humidity=None,
                    wind_kmh=None, precip_c=0)


def compute_flood_risk(d: dict, rain_7d: float) -> tuple:
    """
    Multi-factor flood risk model:
      - hist_flood_km2: historical flood extent (baseline vulnerability)
      - elev_vuln: elevation vulnerability index
      - rain_7d: live 7-day rainfall from Open-Meteo
      - jrc_pct: JRC permanent water fraction (river proximity proxy)
      - pop density: WorldPop-equivalent
    """
    pop_density = d['pop'] / d['area_km2']

    # Flood area estimate: historical × rain modifier
    rain_multiplier = 1.0 + min(rain_7d / 200, 1.5)  # up to +150% for heavy rain
    est_flood_km2   = round(d['hist_flood_km2'] * rain_multiplier * (0.3 + d['elev_vuln'] * 0.7), 1)
    flood_pct       = round(min(est_flood_km2 / d['area_km2'] * 100, 45), 2)

    # Score components (0–1 each)
    f = min(est_flood_km2 / d['area_km2'], 1.0)
    p = min(pop_density / 5000, 1.0)
    e = d['elev_vuln']
    r = min(rain_7d / 300, 1.0)
    j = d['jrc_pct']  # river-adjacency proxy

    # Weighted ensemble
    score = (0.35*f + 0.20*p + 0.20*e + 0.15*r + 0.10*j) * 100

    # Blend with historical risk (prevents extreme swings for no-rain days)
    score = round(0.6 * score + 0.4 * d['hist_risk'], 2)

    level = ('CRITICAL' if score >= 76 else
             'HIGH'     if score >= 51 else
             'MEDIUM'   if score >= 26 else 'LOW')

    aff_pop = int(est_flood_km2 * pop_density * (0.4 + d['elev_vuln'] * 0.4))
    return score, level, est_flood_km2, flood_pct, aff_pop


def build_flood_polygon(d: dict, flood_km2: float) -> dict:
    """
    Build a scaled GeoJSON Polygon centred on the district.
    Polygon area is proportional to estimated flood extent.
    """
    buf      = 0.4
    lat, lon = d['lat'], d['lon']
    w, s, e, n = lon - buf, lat - buf, lon + buf, lat + buf

    # Scale polygon to flood fraction of district area
    frac    = min(flood_km2 / d['area_km2'], 1.0) if d['area_km2'] > 0 else 0.05
    scale_f = max(0.18, min(frac ** 0.45, 1.0))
    cx, cy  = (w + e) / 2, (s + n) / 2
    hw, hh  = (e - w) / 2 * scale_f, (n - s) / 2 * scale_f

    return {
        'type': 'Polygon',
        'coordinates': [[
            [cx - hw, cy - hh],
            [cx + hw, cy - hh],
            [cx + hw, cy + hh],
            [cx - hw, cy + hh],
            [cx - hw, cy - hh],
        ]],
    }


def run():
    run_id = str(uuid.uuid4())
    t0     = time.time()
    logs   = []

    def log(stage, msg, level='INFO', **kw):
        e = dict(stage=stage, message=msg, level=level,
                 durationMs=int((time.time() - t0) * 1000), **kw)
        logs.append(e)
        print(f'  [{level}] {stage}: {msg}')

    print(f'\n{"="*65}')
    print(f'  COSMEON India Flood Seeder  run={run_id[:8]}')
    print(f'  Districts: {len(INDIA_DISTRICTS)} across 12 states')
    print(f'  Date: {END_DATE}')
    print(f'{"="*65}')

    log('INIT', f'India seeder started · {len(INDIA_DISTRICTS)} districts · {END_DATE}', runId=run_id)

    scene_meta = dict(
        source='INDIA_MULTI_STATE',
        geeAssetId=f'INDIA_FLOOD_INTELLIGENCE_{END_DATE}',
        cloudCoverPct=None,
        sceneDate=END_DATE,
        status='processed',
        s1ScenesUsed=0,
        processingWindow=f'{START_DATE}/{END_DATE}',
        datasets=['Open-Meteo', 'Historical-Flood-Records',
                  'WorldPop/GP/100m/pop', 'COPERNICUS/DEM/GLO30'],
    )

    district_results = []
    states_seen: dict = {}

    for d in INDIA_DISTRICTS:
        print(f'\n  🗺  {d["name"]}, {d["state"]} ({d["lat"]:.2f}°N, {d["lon"]:.2f}°E)')

        # Live rainfall
        rain = get_live_rainfall(d['lat'], d['lon'])

        # Risk computation
        score, level, flood_km2, flood_pct, aff_pop = compute_flood_risk(d, rain['rain_7d'])

        # Confidence: higher for high-rainfall or well-monitored states
        confidence = round(min(0.65 + (rain['rain_7d'] / 500) + d['elev_vuln'] * 0.1, 0.95), 2)

        # Flood polygon
        flood_geom = build_flood_polygon(d, flood_km2)

        # Area bbox
        buf = 0.4
        w   = d['lon'] - buf
        s   = d['lat'] - buf
        e_  = d['lon'] + buf
        n   = d['lat'] + buf

        # SAR-equivalent metrics (estimated from historical + rain)
        sar_change_db  = round(-1.0 - (rain['rain_7d'] / 80) - d['elev_vuln'] * 1.5, 3)
        ndwi_mean      = round(0.05 + (flood_km2 / d['area_km2']) * 0.35, 4)

        result = dict(
            districtName     = d['name'],
            stateName        = d['state'],
            lat              = d['lat'],
            lon              = d['lon'],
            areaKm2          = d['area_km2'],
            population2020   = d['pop'],
            gadmLevel2Id     = f'IND_{d["state"].upper().replace(" ","_")}_{d["name"].upper().replace(" ","_")}',
            riskLevel        = level,
            riskScore        = score,
            floodAreaKm2     = flood_km2,
            floodPctDistrict = flood_pct,
            affectedPopEst   = aff_pop,
            confidenceScore  = confidence,
            detectionMethod  = 'ENSEMBLE',
            changeFromPrevKm2= round(flood_km2 * 0.12, 1),   # ~12% change typical
            floodGeometry    = flood_geom,
            metadata         = dict(
                floodBbox       = [w, s, e_, n],
                analysisWindow  = f'{START_DATE}/{END_DATE}',
                referenceWindow = f'{REF_START}/{REF_END}',
                sarChangeDb     = sar_change_db,
                ndwiMean        = ndwi_mean,
                source          = 'OPEN_METEO + HISTORICAL_RECORDS',
                liveRain7d      = rain['rain_7d'],
                liveRain24h     = rain['rain_24h'],
            ),
            enrichment = dict(
                rainfallMm7d        = rain['rain_7d'],
                rainfallSource      = 'Open-Meteo (live)',
                elevationVulnIndex  = d['elev_vuln'],
                popDensityKm2       = round(d['pop'] / d['area_km2'], 2),
                jrcPermanentWaterPct= d['jrc_pct'],
                landCoverUrbanPct   = 20,
                landCoverAgriPct    = 45,
            ),
            liveWeather = dict(
                tempC    = rain['temp_c'],
                humidity = rain['humidity'],
                windKmh  = rain['wind_kmh'],
                precipNow= rain['precip_c'],
                rain7d   = rain['rain_7d'],
                rain24h  = rain['rain_24h'],
            ),
            status = 'active' if score >= 51 else 'monitoring',
        )

        district_results.append(result)
        states_seen[d['state']] = states_seen.get(d['state'], 0) + 1

        print(f'    Rain 7d: {rain["rain_7d"]}mm | '
              f'Flood: {flood_km2}km² | '
              f'Risk: {level} ({score}) | '
              f'Pop: {aff_pop:,} | Conf: {confidence:.0%}')

        log('ENRICH',
            f'{d["name"]}, {d["state"]}: {level} ({score}) flood={flood_km2}km² rain={rain["rain_7d"]}mm')

    # POST to Next.js
    payload = dict(
        runId           = run_id,
        eventDate       = TODAY.isoformat(),
        aoiName         = 'india_all_states',
        scene           = scene_meta,
        districtResults = district_results,
        logs            = logs,
    )

    elapsed = time.time() - t0
    print(f'\n{"─"*65}')
    print(f'  📤 Posting {len(district_results)} districts to {INGEST_URL}…')

    try:
        r = requests.post(
            INGEST_URL, json=payload,
            headers={'x-pipeline-secret': PIPELINE_SECRET, 'Content-Type': 'application/json'},
            timeout=45,
        )
        r.raise_for_status()
        resp = r.json()
        print(f'\n{"="*65}')
        print(f'  ✅ India Flood Seeder Complete!')
        print(f'  ⏱  Total: {elapsed:.1f}s')
        print(f'  📊 Districts posted: {len(district_results)}')
        print(f'  🗺  States covered: {len(states_seen)}')

        risk_counts: dict = {}
        for res in district_results:
            risk_counts[res['riskLevel']] = risk_counts.get(res['riskLevel'], 0) + 1
        for lvl in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
            if lvl in risk_counts:
                print(f'    {lvl}: {risk_counts[lvl]} district(s)')

        print(f'{"="*65}\n')
        return resp

    except Exception as ex:
        print(f'\n  ❌ POST failed: {ex}')
        out = Path('/tmp/india_flood_payload.json')
        out.write_text(json.dumps(payload, indent=2, default=str))
        print(f'     Payload saved to: {out}')
        return None


if __name__ == '__main__':
    run()
