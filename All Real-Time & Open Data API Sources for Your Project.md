# **All Real-Time & Open Data API Sources for Your Project**

Here's every data source you'll need, organized by layer.

---

## **1\. SATELLITE IMAGERY SOURCES**

### **Google Earth Engine (GEE) — YOUR PRIMARY SOURCE**

* **URL:** https://earthengine.google.com  
* **Access:** Free, sign up tonight  
* **What you get:** Sentinel-1, Sentinel-2, Landsat-8/9 all pre-indexed  
* **API type:** Python SDK (`earthengine-api`, `geemap`)  
* **Why use it:** No manual downloads, petabyte-scale, cloud-based processing

import ee  
ee.Authenticate()  
ee.Initialize()  
sentinel2 \= ee.ImageCollection("COPERNICUS/S2\_SR")  
sentinel1 \= ee.ImageCollection("COPERNICUS/S1\_GRD")  
landsat8  \= ee.ImageCollection("LANDSAT/LC08/C02/T1\_L2")

---

### **Copernicus Open Access Hub (Direct Sentinel Download)**

* **URL:** https://scihub.copernicus.eu  
* **Access:** Free account registration  
* **API type:** REST API \+ Python (`sentinelsat` library)  
* **Use when:** You need raw `.SAFE` files for local processing

from sentinelsat import SentinelAPI  
api \= SentinelAPI('user', 'password', 'https://scihub.copernicus.eu/dhus')

---

### **AWS Open Data — Sentinel & Landsat**

* **Sentinel-2:** `s3://sentinel-s2-l2a`  
* **Landsat:** `s3://usgs-landsat`  
* **URL:** https://registry.opendata.aws  
* **Access:** Fully public, no auth needed for read  
* **Use when:** You want fast S3 streaming without GEE quotas

---

### **USGS EarthExplorer — Landsat**

* **URL:** https://earthexplorer.usgs.gov  
* **API:** https://m2m.cr.usgs.gov/api/docs/json  
* **Access:** Free USGS account  
* **Use for:** Landsat historical archives going back to 1972

---

## **2\. RAINFALL & WEATHER DATA**

### **CHIRPS — Climate Hazards Group Rainfall (Historical \+ Near Real-Time)**

* **URL:** https://www.chc.ucsb.edu/data/chirps  
* **GEE Dataset:** `"UCSB-CHG/CHIRPS/DAILY"`  
* **Resolution:** 0.05° (\~5km), daily  
* **Best for:** Rainfall-triggered flood correlation

chirps \= ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")

---

### **NASA GPM (Global Precipitation Measurement) — Near Real-Time**

* **URL:** https://gpm.nasa.gov/data  
* **GEE Dataset:** `"NASA/GPM_L3/IMERG_V06"`  
* **Latency:** \~4 hours after observation  
* **Resolution:** 0.1°, 30-minute intervals  
* **Best for:** Active flood event monitoring

gpm \= ee.ImageCollection("NASA/GPM\_L3/IMERG\_V06")

---

### **Open-Meteo — Free Weather API (No API Key Required)**

* **URL:** https://api.open-meteo.com  
* **Access:** Completely free, no signup  
* **What you get:** Current \+ forecast rainfall, temperature, wind

import requests  
url \= "https://api.open-meteo.com/v1/forecast"  
params \= {  
    "latitude": 26.14,  
    "longitude": 91.74,  
    "daily": "precipitation\_sum",  
    "past\_days": 10  
}  
response \= requests.get(url, params=params)

This is your **easiest rainfall integration** — zero setup, works instantly.

---

### **IMD (India Meteorological Department)**

* **URL:** https://mausam.imd.gov.in  
* **API:** Limited public API, but gridded rainfall data downloadable as NetCDF  
* **Best for:** India-specific rainfall validation

---

## **3\. ELEVATION & TERRAIN DATA**

### **SRTM 30m Digital Elevation Model**

* **GEE Dataset:** `"USGS/SRTMGL1_003"`  
* **Resolution:** 30 meters  
* **What you get:** Elevation, slope, aspect — critical for flood path modeling

dem \= ee.Image("USGS/SRTMGL1\_003")  
slope \= ee.Terrain.slope(dem)

---

### **NASADEM (Higher Accuracy Alternative to SRTM)**

* **GEE Dataset:** `"NASA/NASADEM_HGT/001"`  
* **Use this** if you want more accurate elevation data than SRTM

---

### **Copernicus DEM (Best Available Free DEM)**

* **GEE Dataset:** `"COPERNICUS/DEM/GLO30"`  
* **Resolution:** 30 meters globally  
* **This is the most accurate free global DEM available right now**

---

## **4\. POPULATION DENSITY DATA**

### **WorldPop — Population Density Rasters**

* **URL:** https://www.worldpop.org/geodata  
* **GEE Dataset:** `"WorldPop/GP/100m/pop"`  
* **Resolution:** 100 meters  
* **What you get:** Per-pixel population count — overlay with flood mask to get affected population

population \= ee.ImageCollection("WorldPop/GP/100m/pop") \\  
               .filter(ee.Filter.eq('year', 2020)) \\  
               .first()

---

### **GPW (Gridded Population of the World) — NASA SEDAC**

* **URL:** https://sedac.ciesin.columbia.edu/data/collection/gpw-v4  
* **GEE Dataset:** `"CIESIN/GPWv411/GPW_Population_Density"`  
* **Resolution:** \~1km  
* **Alternative to WorldPop**, slightly coarser but globally consistent

---

## **5\. ADMINISTRATIVE BOUNDARIES (FOR DISTRICT-LEVEL REPORTS)**

### **GADM — Global Administrative Boundaries**

* **URL:** https://gadm.org/download\_country.html  
* **Format:** GeoJSON / Shapefile  
* **What you get:** Country → State → District boundaries  
* **Download India districts tonight:** gadm.org → India → Level 2

---

### **Datameet India GeoJSON (India-Specific, Highly Recommended)**

* **URL:** https://github.com/datameet/maps  
* **What you get:** Clean GeoJSON for all Indian states and districts  
* **This is better than GADM for India specifically**

---

### **FAO GAUL — UN Administrative Boundaries**

* **GEE Dataset:** `"FAO/GAUL/2015/level2"`  
* **Use this inside GEE** for instant district-level spatial joins without uploading your own GeoJSON

districts \= ee.FeatureCollection("FAO/GAUL/2015/level2") \\  
              .filter(ee.Filter.eq('ADM0\_NAME', 'India'))

---

## **6\. LAND USE & INFRASTRUCTURE**

### **OpenStreetMap via Overpass API**

* **URL:** https://overpass-api.de  
* **Access:** Free, no key needed  
* **What you get:** Roads, buildings, hospitals, schools — overlay with flood zones

import overpy  
api \= overpy.API()  
result \= api.query("""  
    area\[name="Assam"\]-\>.searchArea;  
    (node\["amenity"="hospital"\](area.searchArea););  
    out body;  
""")

---

### **ESA WorldCover — Land Use Classification**

* **GEE Dataset:** `"ESA/WorldCover/v200"`  
* **Resolution:** 10 meters  
* **What you get:** Urban, agriculture, wetland, forest classification  
* **Use for:** Identifying flood-exposed infrastructure and farmland

---

## **7\. FLOOD-SPECIFIC DATASETS**

### **Global Surface Water Explorer (JRC)**

* **GEE Dataset:** `"JRC/GSW1_4/GlobalSurfaceWater"`  
* **What you get:** Historical water occurrence per pixel (1984–present)  
* **This is gold** — use it as your baseline "normal water" vs "flood water" comparator

gsw \= ee.Image("JRC/GSW1\_4/GlobalSurfaceWater")  
water\_occurrence \= gsw.select('occurrence')

---

### **VIIRS Flood Product — NASA Near Real-Time**

* **URL:** https://floodmap.modaps.eosdis.nasa.gov  
* **Access:** Free, direct download  
* **Latency:** \~6 hours after satellite pass  
* **Use for:** Validating your own flood detection output

---

### **Dartmouth Flood Observatory**

* **URL:** https://floodobservatory.colorado.edu  
* **What you get:** Historical flood event database with coordinates, dates, severity  
* **Use for:** Picking training events and validating change detection logic

---

## **8\. QUICK REFERENCE TABLE**

| Data Type | Source | GEE Dataset String | Free? |
| ----- | ----- | ----- | ----- |
| Sentinel-2 Optical | Copernicus/GEE | `COPERNICUS/S2_SR` | ✅ |
| Sentinel-1 SAR | Copernicus/GEE | `COPERNICUS/S1_GRD` | ✅ |
| Landsat 8/9 | USGS/GEE | `LANDSAT/LC08/C02/T1_L2` | ✅ |
| Rainfall Daily | CHIRPS/GEE | `UCSB-CHG/CHIRPS/DAILY` | ✅ |
| Rainfall Realtime | NASA GPM/GEE | `NASA/GPM_L3/IMERG_V06` | ✅ |
| Rainfall API | Open-Meteo | REST API | ✅ |
| Elevation | Copernicus DEM | `COPERNICUS/DEM/GLO30` | ✅ |
| Population | WorldPop/GEE | `WorldPop/GP/100m/pop` | ✅ |
| Historical Water | JRC/GEE | `JRC/GSW1_4/GlobalSurfaceWater` | ✅ |
| District Boundaries | FAO GAUL/GEE | `FAO/GAUL/2015/level2` | ✅ |
| Land Cover | ESA WorldCover | `ESA/WorldCover/v200` | ✅ |
| Infrastructure | OpenStreetMap | Overpass API | ✅ |
| Flood Validation | VIIRS NASA | Direct download | ✅ |

---

## **TONIGHT'S ACTION ITEMS**

Everything above is **100% free and accessible right now.** Your single most important setup task tonight is:

1. **Register on Google Earth Engine** — everything else flows through it  
2. **Download India district GeoJSON** from Datameet GitHub  
3. **Pick your flood event** (Assam 2022 or Kerala 2018 recommended)  
4. **Test one GEE script** that pulls Sentinel-2 and computes NDWI

Do those four things and tomorrow morning your team hits the ground running instead of spending 3 hours on setup. Want me to write the starter GEE scripts for any of these?

