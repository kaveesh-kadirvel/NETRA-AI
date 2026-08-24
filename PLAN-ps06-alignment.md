# PLAN: PS-06 Alignment & Gap Resolution
**Project:** COSMEON Climate Risk Intelligence Engine  
**Created:** 2026-02-28  
**Goal:** Ensure EVERY requirement in PS_06.md is implemented, working end-to-end, and demonstrable.

---

## 📋 Requirement Scorecard

| # | Requirement | Status | Gap |
|---|---|---|---|
| R1 | Ingest satellite imagery (S1, S2, Landsat) | ✅ Done | None |
| R2 | Automated flood detection (image processing / ML) | ✅ Done | gee_runner.py has full SAR+NDWI |
| R3 | Change detection (historical vs recent) | ⚠️ Partial | `changeFromPrevKm2` TODO in gee_runner.py |
| R4 | Structured output (area stats, district summaries, labels) | ✅ Done | None |
| R5 | State table (timestamps, regions, risk status) | ✅ Done | None |
| R6 | Detailed logs (ingestion, processing, detection) | ⚠️ Critical | Logs page shows HARDCODED mock data |
| R7 | External datasets (rainfall, elevation, population) | ✅ Done | None |
| R8 | Predictive modeling (forecast flood risk) | ❌ Missing | Entirely unimplemented |
| R9 | API endpoint for processed insights | ✅ Done | None |
| R10 | Interactive dashboard (affected zones over time) | ✅ Done | None |
| R11 | Confidence scoring | ✅ Done | None |

**Score: 8/11 requirements met. 3 need work.**

---

## 🎯 Phase 1 — Critical Fixes (Must-Have for demo)

### TASK 1.1 — Fix Logs Page (R6)
**File:** `app/logs/page.tsx`  
**Problem:** Page uses `MOCK_LOGS` const array. The backend (`/api/pipeline/logs`) is fully functional but never called.  
**Fix:** Replace hardcoded MOCK_LOGS with `useSWR('/api/pipeline/logs', fetcher)`. Show real DB logs when available, fall back to mock when DB is empty.  
**Effort:** Small (2–3 hours)  
**Impact:** HIGH — this is a specific PS-06 requirement: "Provide detailed logs demonstrating data ingestion, processing steps, and detection outputs"

### TASK 1.2 — Fix Change Detection in gee_runner.py (R3)
**File:** `python/pipeline/gee_runner.py` (line 468)  
**Problem:** `change_km2 = round(gee['sar_flood_km2'] - 0, 2) # TODO: compare to previous run`  
**Fix:** Before computing stats, query the last RiskEvent for each district from MongoDB (or a local cache file) to compute real delta.  
**Effort:** Small (1–2 hours)  
**Impact:** MEDIUM — strengthens automated change detection story

---

## 🎯 Phase 2 — Predictive Modeling (R8 — Missing Feature)

### TASK 2.1 — Implement Flood Risk Forecasting
**Problem:** No forward-looking prediction exists. Only retrospective analysis.  
**Approach:** Use Open-Meteo's 3-day forecast data (already fetched via `forecast_days=3`) to project risk scores 24h, 48h, 72h ahead.

**Implementation Plan:**
1. **New API route:** `GET /api/insights/forecast`
   - Fetch Open-Meteo forecast for all 5 districts
   - Apply existing `computeRiskScore()` formula to forecast rainfall values
   - Return `{ district, day1Risk, day2Risk, day3Risk, trend }` per district
   
2. **New Dashboard Component:** `ForecastPanel.tsx`
   - 3-day risk forecast cards per district
   - "Risk increasing / decreasing / stable" trend indicator
   - Uses forecast rainfall from Open-Meteo `forecast_days=3`

3. **Add to Dashboard page** (`app/page.tsx`) between WeatherPanel and TrendChart

**Why this works:** Open-Meteo already returns `forecast_days` data — we just need to run the risk formula against forecast values instead of historical ones. This is simple but scientifically valid linear extrapolation.

**Effort:** Medium (1 day)  
**Impact:** CRITICAL — directly satisfies R8 with zero new external dependencies

---

## 🎯 Phase 3 — Polish & Presentability

### TASK 3.1 — Reports Page: Dynamic Report Generation (Enhancement)
**File:** `app/reports/page.tsx`  
**Problem:** Shows 4 hardcoded mock report entries. "Download JSON" button does nothing.  
**Fix:**  
- Add `/api/insights/report` endpoint that aggregates latest event data into a structured JSON report  
- Reports page: load actual data from DB for each available report  
- Make "Download JSON" button actually download the structured JSON payload  
**Effort:** Medium (half day)  
**Impact:** HIGH — shows automated reporting capability explicitly required by PS-06

### TASK 3.2 — Fix `ingest-weather` Self-Call (Production Bug)
**File:** `app/api/realtime/ingest-weather/route.ts` (line 61)  
**Problem:** `fetch('http://localhost:3000/api/realtime/weather', ...)` — hardcoded localhost, breaks in production.  
**Fix:** Use `process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'` prefix.  
**Effort:** Tiny (5 minutes)  
**Impact:** HIGH — production correctness

### TASK 3.3 — Cleanup Dead Code
**Files to remove/ignore:**
- `app/api/realtime/fires/` — leftover fire-data route, now irrelevant
- `components/map/CosmeonMap.tsx` — unused old map component
- `lib/mongodb.js` — duplicate of `lib/mongodb.ts`

---

## 🎯 Phase 4 — Verification & Demo Readiness

### TASK 4.1 — End-to-End Demo Flow
Document the full demo script:

```
1. Open dashboard → shows shimmer → click "Fetch Live Data"
2. Open-Meteo data ingested → 5 district RiskEvents created in MongoDB
3. Stats update: CRITICAL/HIGH counts, flood area, affected population
4. Weather Panel shows live per-district conditions
5. Trend Chart shows 30-day history
6. Navigate to /map → Flood Map shows 5 polygon zones
7. Click a polygon → popup shows riskLevel, score, area, population, confidence
8. Navigate to /logs → Real ProcessingLog entries from ingest run
9. Navigate to /districts → All 5 districts with risk badges
10. Navigate to /reports → Downloadable JSON report
11. Show forecast panel: 72h risk prediction
```

### TASK 4.2 — API Collection for Judges
Create a simple API reference in README showing curl examples:
- `GET /api/insights/latest`
- `GET /api/insights/summary`
- `GET /api/pipeline/logs`
- `GET /api/insights/forecast` (new)

---

## 📊 Priority Order

| Priority | Task | Time Estimate |
|---|---|---|
| P0 (Critical) | TASK 1.1 — Fix Logs Page (live logs) | 2h |
| P0 (Critical) | TASK 3.2 — Fix localhost self-call | 5 min |
| P1 (High) | TASK 2.1 — Forecast Panel (R8) | 1 day |
| P1 (High) | TASK 1.2 — Real change detection delta | 2h |
| P2 (Medium) | TASK 3.1 — Dynamic Reports page | 4h |
| P3 (Low) | TASK 3.3 — Dead code cleanup | 30 min |
| P3 (Low) | TASK 4.2 — API docs in README | 1h |

**Total estimated:** ~2 days of focused work to be 100% PS-06 compliant.

---

## ✅ Verification Checklist (Post-Implementation)

- [ ] `/app/logs/page.tsx` calls `/api/pipeline/logs` — shows real DB logs
- [ ] `gee_runner.py` computes `changeFromPrevKm2` vs actual previous event
- [ ] `/api/insights/forecast` returns 72h risk prediction per district
- [ ] `ForecastPanel.tsx` renders on Dashboard
- [ ] `ingest-weather` uses env URL, not hardcoded localhost
- [ ] Reports page generates and downloads real JSON report
- [ ] End-to-end demo flow completes without errors
- [ ] All 11 PS-06 requirements demonstrable in the UI or API

---

## 🗂 Files Affected

| File | Change |
|---|---|
| `app/logs/page.tsx` | Replace MOCK_LOGS with useSWR + real API |
| `app/page.tsx` | Add `<ForecastPanel />` |
| `app/reports/page.tsx` | Connect to dynamic report API |
| `app/api/insights/forecast/route.ts` | NEW — 72h risk forecast endpoint |
| `app/api/insights/report/route.ts` | NEW — structured JSON report generator |
| `components/dashboard/ForecastPanel.tsx` | NEW — 72h forecast UI component |
| `python/pipeline/gee_runner.py` | Fix change_km2 TODO |
| `app/api/realtime/ingest-weather/route.ts` | Fix localhost self-call |
