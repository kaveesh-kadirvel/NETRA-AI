<div align="center">

<br />

```
███╗   ██╗███████╗████████╗██████╗  █████╗     █████╗ ██╗
████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗   ██╔══██╗██║
██╔██╗ ██║█████╗     ██║   ██████╔╝███████║   ███████║██║
██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══██║   ██╔══██║██║
██║ ╚████║███████╗   ██║   ██║  ██║██║  ██║   ██║  ██║██║
╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  ╚═╝╚═╝
```

### **NETRA.AI — Near-Earth Telemetry & Resource Agronomy**

### **Satellite Data → Insight Engine → Precision Yield Optimization**

*"We don’t just show you a map of a farm. We tell you exactly where nitrogen is depleted, where water is pooling, and how much yield is at risk — powered by the eye in the sky."*

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Google Earth Engine](https://img.shields.io/badge/Google_Earth_Engine-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://earthengine.google.com)

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/CyberJarvis/Refactor_PS06/pulls)
[![Build Status](https://img.shields.io/badge/Build-Passing-22C55E?style=flat-square)](https://github.com/CyberJarvis/Refactor_PS06)
[![Problem Statement](https://img.shields.io/badge/PS--06-AgriTech_Precision_Farming-0D7377?style=flat-square)]()

</div>

---

# 🌾 What is NETRA.AI?

**NETRA.AI (Near-Earth Telemetry & Resource Agronomy)** is a full-stack **Precision Resource Optimizer** built for **HackX 4.0 — Problem Statement DOM-06 (AgriTech)**.

Modern agriculture is flying blind. Farmers and large-scale agricultural networks attempt to maximize yield using guesswork and fragmented local weather data, resulting in massive fertilizer waste, unrecognized water deficits, and avoidable crop failure.

NETRA.AI closes this gap by building an **automated pipeline** that transforms open satellite data (Sentinel-1 SAR, Sentinel-2 Optical) and live weather APIs (Open-Meteo) into **structured, sub-meter precision farming insights** — complete with real-time dashboards, nitrogen deficit maps, yield depletion scores, and auto-generated prescriptive PDFs.

No mock data. No manual interpretation. Just automated agronomy truth.

---

# 🚀 Core Capabilities

| Capability                                  | Status | Implementation               |
| ------------------------------------------- | ------ | ---------------------------- |
| Satellite ingestion (Sentinel-1/2, Landsat) | ✅      | Google Earth Engine pipeline |
| Soil Saturation & Moisture Detection        | ✅      | VV backscatter algorithms    |
| Nitrogen Stress / Vitality Tracking         | ✅      | Multi-spectral NDVI indices  |
| Crop Yield Depletion Estimation             | ✅      | WorldPop / Baseline Overlay  |
| Square-Meter Resolution Precision           | ✅      | 10m-30m Focal Smoothing      |
| Generative AI Agronomist                    | ✅      | Groq + Llama 3.3 LLM Chatbot |
| Real-Time Weather Integration               | ✅      | Open-Meteo live API          |
| Structured state tables                     | ✅      | MongoDB schemas              |
| REST API (15+ endpoints)                    | ✅      | Next.js API routes           |
| Interactive dashboard                       | ✅      | Real-time KPI + maps         |
| Auto PDF reports                            | ✅      | Python-based generation      |
| Pipeline audit logs                         | ✅      | Full trace logging           |

---

# 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NETRA.AI INTELLIGENCE ENGINE                 │
├────────────────┬──────────────────────────────┬─────────────────────┤
│  INGESTION     │     CORE PROCESSING           │   PRESENTATION      │
│  LAYER         │     ENGINE (Python)           │   LAYER (Next.js)   │
├────────────────┼──────────────────────────────┼─────────────────────┤
│ Sentinel-1 SAR │ detection.py  → SAR moisture │ Dashboard + Maps    │
│ Sentinel-2 MSI │ enrichment.py → Yield base   │ District registry   │
│ Landsat 8 / 9  │ scoring.py    → Deficit Loss │ PDF reports         │
│ CHIRPS Rain    │ runner.py     → GEE Bridge   │ REST APIs           │
│ Live Weather   │                              │ MongoDB Atlas       │
│                │                              │                     │
└────────────────┴──────────────────────────────┴─────────────────────┘
```

---

# 🧠 Agronomy Algorithms

## 1. SAR Soil Saturation (Sentinel-1)

Water absorbs radar energy. When VV backscatter drops significantly between pre- and post-harvest scenes, extreme water pooling or soil saturation is present.

```
Moisture Deficit IF: pre_VV − post_VV > threshold (-2.0 dB)
```

Slope filtering removes mountainous shadow artifacts.

---

## 2. Optical NDVI Vitality Logging (Sentinel-2)

Tracks nitrogen deficiencies, disease, or post-harvest biomass drops.

```
NDVI = (NIR − Red) / (NIR + Red)
Nitrate Stress IF: NDVI Drop > threshold (-12%)
```

Cloud masking applied automatically (configured to <25% coverage).

---

## 3. Ensemble Yield Optimizer

```
confidence =
    (SAR_confidence × 0.50) +
    (Optical_confidence × 0.30) +
    (Weather_weight × 0.20)
```

Combines data to generate a centralized **Yield Depletion Index (0-100)** to trigger automated fertilizer advisories.

---

# 📡 API Overview

All endpoints prefixed with `/api`.

### Insights

* `GET /api/insights/latest`
* `GET /api/seed` (Mock Data Seeder for 20 Farm Plots)
* `POST /api/studio/run` (Triggers Python Intelligence Engine)

### Farm Tracking

* `GET /api/farms`
* `GET /api/farms/[id]`

### Real-Time Weather

* `GET /api/weather` (Open-Meteo Integration)

---

# 📁 Project Structure

```
netra_ai/
├── app/                      # Next.js App Router (Dashboard UI)
├── components/               # React Native UI components
├── lib/                      # MongoDB models (FarmPlot, PlotHealthLog)
├── cosmeon/                  # Python processing engine (GEE Bridge)
│   ├── pipeline/
│   ├── core/
│   └── cli.py
└── start_netra.sh            # One-click bootloader
```

---

# ⚙️ Getting Started

## Prerequisites

* Node.js ≥ 18
* Python ≥ 3.10
* MongoDB Atlas
* Google Earth Engine project

---

## 1. Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

---

## 2. Configure Environment

```bash
cp .env.sample .env.local
```

Fill:

```env
MONGODB_URI=
GEE_PROJECT_ID=
PIPELINE_SECRET=
```

---

## 3. Seed Farm Data

Populates the dashboard with 20 Pan-India precision farms out of the box.
```bash
curl http://localhost:3000/api/seed
```

---

## 4. Run

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🔍 Core Data Model

### FarmPlot & PlotHealthLog

```typescript
{
  polygon: { type: "Polygon", coordinates: [...] },
  cropType: "WHEAT" | "RICE" | "CORN",
  metrics: {
    ndvi: 0.85,          // Nitrogen health
    ndmi: 0.40,          // Water tracking
    nitrogenReq: 120.5,  // Fertilizer Required
    waterDeficit: 10.2   // Irrigation Required
  }
}
```

---

# 📜 License

MIT License.

---

<div align="center">

### **NETRA.AI**

*Translating square-meter satellite telemetry into maximum agricultural yield.*

</div>
