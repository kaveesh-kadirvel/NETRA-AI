import ee

ee.Initialize(project='sublime-etching-453915-q9')
print("✅ Earth Engine Connected!")

aoi = ee.Geometry.Rectangle([89.7, 24.1, 96.0, 28.2])  # Assam, India

# ── SATELLITE IMAGERY ────────────────────────────────────────────────
s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')  # ✅ Updated name
        .filterBounds(aoi)
        .filterDate('2022-06-01', '2022-08-01')
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
        .first())
print("✅ Sentinel-2:", s2.get('system:index').getInfo())

s1 = (ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(aoi)
        .filterDate('2022-06-01', '2022-08-01')
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .first())
print("✅ Sentinel-1 SAR:", s1.get('system:index').getInfo())

# ── ELEVATION ────────────────────────────────────────────────────────
dem = ee.ImageCollection('COPERNICUS/DEM/GLO30').filterBounds(aoi).first()
print("✅ Copernicus DEM:", dem.bandNames().getInfo())

# ── POPULATION ───────────────────────────────────────────────────────
pop = (ee.ImageCollection('WorldPop/GP/100m/pop')
         .filter(ee.Filter.eq('year', 2020))
         .filterBounds(aoi)
         .first())
print("✅ WorldPop:", pop.bandNames().getInfo())

# ── RAINFALL ─────────────────────────────────────────────────────────
chirps = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
            .filterDate('2022-06-01', '2022-06-15')
            .filterBounds(aoi)
            .first())
print("✅ CHIRPS Rainfall:", chirps.bandNames().getInfo())

# ── HISTORICAL WATER BASELINE ────────────────────────────────────────
jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
print("✅ JRC Water:", jrc.bandNames().getInfo())

# ── LAND COVER ───────────────────────────────────────────────────────
lc = ee.ImageCollection('ESA/WorldCover/v200').first()
print("✅ ESA WorldCover:", lc.bandNames().getInfo())

# ── DISTRICT BOUNDARIES ──────────────────────────────────────────────
assam = (ee.FeatureCollection('FAO/GAUL/2015/level2')
           .filter(ee.Filter.eq('ADM1_NAME', 'Assam')))
print("✅ Assam Districts:", assam.size().getInfo(), "districts found")

print()
print("=" * 50)
print("🚀 ALL SYSTEMS GO — Ready for hackathon tomorrow!")
print("=" * 50)
