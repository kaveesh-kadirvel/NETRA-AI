# import ee

# # Initialize Earth Engine
# ee.Initialize()

# print("\n✅ Earth Engine Connected Successfully!\n")

# # ----------------------------------------
# # 1️⃣ Load a sample satellite image dataset
# # ----------------------------------------
# image = ee.Image("NASA/NASADEM_HGT/001")

# print("📡 Dataset Loaded:", image)

# # ----------------------------------------
# # 2️⃣ Get metadata about the dataset
# # ----------------------------------------
# info = image.getInfo()

# print("\n📊 FULL DATA STRUCTURE:\n")
# print(info)

# # ----------------------------------------
# # 3️⃣ Print basic properties nicely
# # ----------------------------------------
# print("\n📌 BASIC DETAILS:\n")

# print("Dataset ID:", info['id'])
# print("Type:", info['type'])
# print("Bands:", len(info['bands']))

# print("\nBand Names:")
# for band in info['bands']:
#     print("-", band['id'])

# print("\nProjection Info:")
# print(info['bands'][0]['crs'])

# print("\nResolution:")
# print(info['bands'][0]['dimensions'])

import ee

# Initialize with REAL project ID
ee.Initialize(project='sublime-etching-453915-q9')

print("✅ Earth Engine Connected!")

# Test elevation dataset
dem = ee.Image('USGS/SRTMGL1_003')
print("📡 DEM Bands:", dem.bandNames().getInfo())

# Define area of interest
aoi = ee.Geometry.Rectangle([89.7, 24.1, 96.0, 28.2])

# Sentinel-2 test
s2 = (ee.ImageCollection('COPERNICUS/S2_SR')
        .filterBounds(aoi)
        .filterDate('2022-06-01', '2022-08-01')
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
        .first())

print("🌍 Sentinel-2 Scene:", s2.get('system:index').getInfo())

print("\n🚀 Earth Engine FULLY WORKING!")