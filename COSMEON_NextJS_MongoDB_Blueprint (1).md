# COSMEON — Climate Risk Intelligence Engine

## Technical Implementation Blueprint: Next.js \+ MongoDB

**Version:** 2.0 | **Stack:** Next.js 14 (App Router) \+ MongoDB Atlas \+ Python ML Pipeline  
**Classification:** Hackathon Submission | February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [System Architecture](#2-system-architecture)  
3. [Tech Stack & Justification](#3-tech-stack--justification)  
4. [Project Structure](#4-project-structure)  
5. [MongoDB Schema Design](#5-mongodb-schema-design)  
6. [Next.js API Routes](#6-nextjs-api-routes)  
7. [Core Python ML Pipeline](#7-core-python-ml-pipeline)  
8. [Frontend Components & Pages](#8-frontend-components--pages)  
9. [Data Flow & Integration](#9-data-flow--integration)  
10. [Step-by-Step Development Plan](#10-step-by-step-development-plan)  
11. [Environment Configuration](#11-environment-configuration)  
12. [Deployment Strategy](#12-deployment-strategy)  
13. [Scalability Considerations](#13-scalability-considerations)  
14. [Demo Script](#14-demo-script)

---

## 1\. Executive Summary

COSMEON's Climate Risk Intelligence Engine is a full-stack automated platform that transforms raw Earth observation satellite imagery into structured, district-level climate risk insights. The system ingests open-access Sentinel-1, Sentinel-2, and Landsat data, processes it through a Python ML pipeline, stores structured results in MongoDB Atlas, and serves everything through a Next.js 14 App Router frontend with REST APIs.

**Core Value Proposition:**

A satellite image goes in. A crisis-ready risk report comes out. Automatically. In under 2 hours.

### What Gets Built

| Layer | Technology | Responsibility |
| :---- | :---- | :---- |
| Frontend & API | Next.js 14 (App Router) | Dashboard UI \+ REST API endpoints |
| Database | MongoDB Atlas | State table, events, logs, districts |
| ML Pipeline | Python \+ GEE | Satellite ingestion, flood detection, risk scoring |
| Maps | Leaflet.js \+ react-leaflet | Interactive flood zone visualization |
| Charts | Recharts | Risk trends, time-series analytics |
| Deployment | Vercel (Next.js) \+ Railway (Python) | Separate, scalable deployments |

---

## 2\. System Architecture

┌──────────────────────────────────────────────────────────────────────┐

│                     PYTHON ML PIPELINE (Railway)                      │

│                                                                        │

│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────┐   │

│  │  DATA        │   │  DETECTION   │   │  ENRICHMENT              │   │

│  │  INGESTION   │→  │  ENGINE      │→  │  & RISK SCORING          │   │

│  │              │   │              │   │                          │   │

│  │ Sentinel-1   │   │ NDWI Optical │   │ \+ WorldPop Population    │   │

│  │ Sentinel-2   │   │ SAR Radar    │   │ \+ Copernicus DEM         │   │

│  │ Landsat 8/9  │   │ U-Net ML     │   │ \+ CHIRPS Rainfall        │   │

│  │ via GEE API  │   │ Ensemble     │   │ \+ JRC Water Baseline     │   │

│  └─────────────┘   └──────────────┘   └──────────────────────────┘   │

│                              │                                         │

│                              ↓                                         │

│                    Structured JSON Output                              │

└──────────────────────────────┬───────────────────────────────────────┘

                               │  HTTP POST to Next.js ingest endpoint

                               ↓

┌──────────────────────────────────────────────────────────────────────┐

│                    NEXT.JS 14 APP (Vercel)                            │

│                                                                        │

│  ┌──────────────────────┐        ┌──────────────────────────────┐    │

│  │   APP ROUTER (Pages) │        │   API ROUTES (/api/\*)        │    │

│  │                      │        │                              │    │

│  │  / → Dashboard       │        │  POST /api/pipeline/ingest   │    │

│  │  /map → Flood Map    │        │  GET  /api/insights/latest   │    │

│  │  /districts → Table  │        │  GET  /api/insights/\[id\]     │    │

│  │  /reports → Reports  │        │  GET  /api/districts         │    │

│  │  /logs → Pipeline    │        │  GET  /api/reports/\[id\]      │    │

│  └──────────────────────┘        │  GET  /api/logs/\[runId\]      │    │

│                                  │  POST /api/pipeline/trigger   │    │

│                                  └──────────────────────────────┘    │

│                                           │                           │

└───────────────────────────────────────────┼───────────────────────────┘

                                            │

                                            ↓

┌──────────────────────────────────────────────────────────────────────┐

│                      MONGODB ATLAS                                    │

│                                                                        │

│   satellite\_scenes   │   risk\_events   │   districts                  │

│   processing\_logs    │   enrichment    │   pipeline\_runs              │

└──────────────────────────────────────────────────────────────────────┘

### Data Flow Summary

1. **Scheduled Python job** (cron every 6hrs) triggers the ML pipeline for a configured AOI  
2. Pipeline authenticates with Google Earth Engine, fetches latest Sentinel scenes  
3. Flood detection runs (NDWI \+ SAR \+ U-Net ensemble), change detection computed  
4. Risk scoring enriches results with population, elevation, and rainfall data  
5. Results `POST`ed to `/api/pipeline/ingest` on the Next.js server  
6. Next.js API writes structured documents to MongoDB Atlas  
7. Dashboard auto-refreshes via SWR to show latest risk state  
8. Users can also manually trigger runs via the dashboard UI

---

## 3\. Tech Stack & Justification

### Frontend & API

| Technology | Version | Why |
| :---- | :---- | :---- |
| **Next.js** | 14 (App Router) | Server components, API routes, file-based routing — full-stack in one repo |
| **TypeScript** | 5.x | Type safety for MongoDB documents and API payloads |
| **Tailwind CSS** | 3.x | Rapid styling, dark mode, responsive grids |
| **SWR** | 2.x | Real-time data fetching with auto-revalidation for live dashboard |
| **react-leaflet** | 4.x | Interactive Leaflet maps for flood polygon overlays |
| **Recharts** | 2.x | Risk trend charts, time-series visualization |
| **shadcn/ui** | latest | Pre-built accessible components (cards, badges, tables) |
| **Lucide React** | latest | Icon library for the dashboard UI |

### Database

| Technology | Why |
| :---- | :---- |
| **MongoDB Atlas** | Flexible document model — perfect for GeoJSON polygons, nested metadata, variable enrichment data. No rigid schema migrations during hackathon. |
| **Mongoose** | ODM for TypeScript-friendly schema definitions and validation |
| **MongoDB Geospatial Indexes** | Native `2dsphere` index for spatial queries (find all districts intersecting a flood polygon) |

### Python ML Pipeline

| Technology | Why |
| :---- | :---- |
| **Google Earth Engine API** | Petabyte-scale satellite archive, cloud-side processing, no raw file downloads |
| **rasterio \+ numpy** | Raster processing for NDWI computation and SAR thresholding |
| **GeoPandas \+ Shapely** | Vector operations, district spatial joins, area calculations |
| **segmentation-models-pytorch** | Pre-trained U-Net for ML flood segmentation — no training time |
| **requests** | HTTP POST of results to Next.js API endpoint |
| **structlog** | Structured JSON logging for every pipeline step |
| **APScheduler** | Cron-based pipeline scheduling |

### Deployment

| Service | What | Why |
| :---- | :---- | :---- |
| **Vercel** | Next.js app | Zero-config deployment, edge functions, free tier |
| **Railway** | Python pipeline | Persistent background jobs, cron support, Docker |
| **MongoDB Atlas** | Database | Free M0 tier, built-in Atlas Search, global replication |

---

## 4\. Project Structure

cosmeon/

├── app/                          \# Next.js App Router

│   ├── layout.tsx                \# Root layout (navbar, sidebar)

│   ├── page.tsx                  \# Dashboard home

│   ├── map/

│   │   └── page.tsx              \# Flood map page

│   ├── districts/

│   │   ├── page.tsx              \# Districts table

│   │   └── \[id\]/

│   │       └── page.tsx          \# Single district detail

│   ├── reports/

│   │   └── page.tsx              \# Generated reports list

│   ├── logs/

│   │   └── page.tsx              \# Pipeline logs viewer

│   └── api/                      \# API Routes

│       ├── pipeline/

│       │   ├── ingest/

│       │   │   └── route.ts      \# POST: receive ML pipeline results

│       │   └── trigger/

│       │       └── route.ts      \# POST: manually trigger pipeline run

│       ├── insights/

│       │   ├── latest/

│       │   │   └── route.ts      \# GET: latest risk events

│       │   ├── summary/

│       │   │   └── route.ts      \# GET: aggregated stats

│       │   └── \[id\]/

│       │       └── route.ts      \# GET: single event detail

│       ├── districts/

│       │   ├── route.ts          \# GET: all districts

│       │   └── \[id\]/

│       │       └── route.ts      \# GET: district with history

│       ├── reports/

│       │   └── \[id\]/

│       │       └── route.ts      \# GET: PDF/JSON report

│       └── logs/

│           └── \[runId\]/

│               └── route.ts      \# GET: pipeline run logs

│

├── components/

│   ├── dashboard/

│   │   ├── StatsGrid.tsx         \# Top-level KPI cards

│   │   ├── RiskTable.tsx         \# District risk level table

│   │   ├── TrendChart.tsx        \# Recharts risk over time

│   │   └── AlertBanner.tsx       \# Critical risk alerts

│   ├── map/

│   │   ├── FloodMap.tsx          \# Leaflet map wrapper

│   │   ├── FloodLayer.tsx        \# GeoJSON flood polygon layer

│   │   └── DistrictPopup.tsx     \# Click popup with risk info

│   ├── shared/

│   │   ├── RiskBadge.tsx         \# Color-coded risk level badge

│   │   ├── ConfidenceBar.tsx     \# Confidence score progress bar

│   │   └── DataSourceTag.tsx     \# Satellite source label

│   └── layout/

│       ├── Navbar.tsx

│       └── Sidebar.tsx

│

├── lib/

│   ├── mongodb.ts                \# MongoDB connection singleton

│   ├── models/

│   │   ├── RiskEvent.ts          \# Mongoose model

│   │   ├── District.ts           \# Mongoose model

│   │   ├── SatelliteScene.ts     \# Mongoose model

│   │   └── ProcessingLog.ts      \# Mongoose model

│   ├── api/

│   │   └── fetcher.ts            \# SWR fetcher utility

│   └── utils/

│       ├── riskClassifier.ts     \# Risk score → level mapping

│       └── formatters.ts         \# Date, area, population formatters

│

├── python/                       \# ML Pipeline (separate deployment)

│   ├── pipeline/

│   │   ├── orchestrator.py       \# Main pipeline runner

│   │   ├── ingestion/

│   │   │   ├── gee\_client.py

│   │   │   ├── sentinel1.py

│   │   │   └── sentinel2.py

│   │   ├── detection/

│   │   │   ├── ndwi\_detector.py

│   │   │   ├── sar\_detector.py

│   │   │   ├── unet\_detector.py

│   │   │   └── ensemble.py

│   │   ├── enrichment/

│   │   │   ├── risk\_scorer.py

│   │   │   ├── population.py

│   │   │   └── rainfall.py

│   │   └── output/

│   │       ├── api\_poster.py     \# POST results to Next.js

│   │       └── geojson\_builder.py

│   ├── requirements.txt

│   ├── Dockerfile

│   └── scheduler.py

│

├── public/

│   └── geojson/

│       └── india\_districts.geojson   \# Pre-downloaded boundaries

│

├── .env.local

├── next.config.js

├── tailwind.config.ts

├── tsconfig.json

└── package.json

---

## 5\. MongoDB Schema Design

MongoDB's document model is ideal for this project because each risk event contains nested GeoJSON geometry, variable enrichment data, and array-based historical records — structures that would require complex joins in SQL but map naturally to documents.

### 5.1 Collection: `risk_events` (Core State Table)

// lib/models/RiskEvent.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskEvent extends Document {

  districtId: mongoose.Types.ObjectId;

  sceneId: mongoose.Types.ObjectId;

  eventDate: Date;

  detectedAt: Date;

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  riskScore: number;           // 0–100 composite score

  floodAreaKm2: number;

  floodPctDistrict: number;

  affectedPopEst: number;

  confidenceScore: number;     // 0–1 ensemble confidence

  detectionMethod: 'NDWI' | 'SAR' | 'UNET' | 'ENSEMBLE';

  changeFromPrevKm2: number;   // delta from last event

  floodGeometry: {             // GeoJSON MultiPolygon

    type: 'MultiPolygon';

    coordinates: number\[\]\[\]\[\]\[\];

  };

  enrichment: {

    rainfallMm7d: number;

    rainfallSource: string;

    elevationVulnIndex: number;

    popDensityKm2: number;

    landCoverUrbanPct: number;

    landCoverAgriPct: number;

    jrcPermanentWaterPct: number;

  };

  status: 'active' | 'resolved' | 'monitoring';

  metadata: Record\<string, unknown\>;

}

const RiskEventSchema \= new Schema\<IRiskEvent\>({

  districtId:        { type: Schema.Types.ObjectId, ref: 'District', required: true, index: true },

  sceneId:           { type: Schema.Types.ObjectId, ref: 'SatelliteScene', required: true },

  eventDate:         { type: Date, required: true, index: \-1 },

  detectedAt:        { type: Date, default: Date.now },

  riskLevel:         { type: String, enum: \['LOW','MEDIUM','HIGH','CRITICAL'\], required: true, index: true },

  riskScore:         { type: Number, min: 0, max: 100, required: true },

  floodAreaKm2:      { type: Number, default: 0 },

  floodPctDistrict:  { type: Number, default: 0 },

  affectedPopEst:    { type: Number, default: 0 },

  confidenceScore:   { type: Number, min: 0, max: 1 },

  detectionMethod:   { type: String, enum: \['NDWI','SAR','UNET','ENSEMBLE'\] },

  changeFromPrevKm2: { type: Number, default: 0 },

  floodGeometry: {

    type:        { type: String, enum: \['MultiPolygon'\] },

    coordinates: { type: \[\[\[\[Number\]\]\]\] }

  },

  enrichment: {

    rainfallMm7d:         Number,

    rainfallSource:       String,

    elevationVulnIndex:   Number,

    popDensityKm2:        Number,

    landCoverUrbanPct:    Number,

    landCoverAgriPct:     Number,

    jrcPermanentWaterPct: Number,

  },

  status:   { type: String, enum: \['active','resolved','monitoring'\], default: 'active' },

  metadata: { type: Schema.Types.Mixed, default: {} }

}, { timestamps: true });

// Geospatial index for spatial queries

RiskEventSchema.index({ floodGeometry: '2dsphere' });

// Compound index for common queries

RiskEventSchema.index({ districtId: 1, eventDate: \-1 });

RiskEventSchema.index({ riskLevel: 1, eventDate: \-1 });

export const RiskEvent \= mongoose.models.RiskEvent ||

  mongoose.model\<IRiskEvent\>('RiskEvent', RiskEventSchema);

### 5.2 Collection: `districts`

// lib/models/District.ts

export interface IDistrict extends Document {

  districtName: string;

  stateName: string;

  countryCode: string;

  geometry: {

    type: 'MultiPolygon';

    coordinates: number\[\]\[\]\[\]\[\];

  };

  areaKm2: number;

  population2020: number;

  gadmLevel2Id: string;

  currentRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

  lastAssessedAt: Date;

  totalEventsCount: number;

}

const DistrictSchema \= new Schema\<IDistrict\>({

  districtName:     { type: String, required: true },

  stateName:        { type: String, required: true },

  countryCode:      { type: String, default: 'IND' },

  geometry: {

    type:        { type: String, enum: \['MultiPolygon'\] },

    coordinates: { type: \[\[\[\[Number\]\]\]\] }

  },

  areaKm2:          Number,

  population2020:   Number,

  gadmLevel2Id:     String,

  currentRiskLevel: { type: String, enum: \['LOW','MEDIUM','HIGH','CRITICAL','UNKNOWN'\], default: 'UNKNOWN' },

  lastAssessedAt:   Date,

  totalEventsCount: { type: Number, default: 0 }

}, { timestamps: true });

DistrictSchema.index({ geometry: '2dsphere' });

DistrictSchema.index({ districtName: 1, stateName: 1 }, { unique: true });

DistrictSchema.index({ currentRiskLevel: 1 });

### 5.3 Collection: `satellite_scenes`

// lib/models/SatelliteScene.ts

export interface ISatelliteScene extends Document {

  source: 'S1' | 'S2' | 'L8' | 'L9';

  sceneDate: Date;

  ingestedAt: Date;

  aoiName: string;

  boundingBox: number\[\];         // \[west, south, east, north\]

  cloudCoverPct: number | null;  // null for SAR

  geeAssetId: string;

  status: 'ingested' | 'processed' | 'failed';

  processingDurationMs: number;

}

const SatelliteSceneSchema \= new Schema\<ISatelliteScene\>({

  source:               { type: String, enum: \['S1','S2','L8','L9'\], required: true },

  sceneDate:            { type: Date, required: true, index: \-1 },

  ingestedAt:           { type: Date, default: Date.now },

  aoiName:              { type: String, required: true },

  boundingBox:          \[Number\],

  cloudCoverPct:        Number,

  geeAssetId:           { type: String, required: true },

  status:               { type: String, enum: \['ingested','processed','failed'\], default: 'ingested' },

  processingDurationMs: Number,

}, { timestamps: true });

### 5.4 Collection: `processing_logs`

// lib/models/ProcessingLog.ts

export interface IProcessingLog extends Document {

  runId: string;

  stage: string;

  level: 'INFO' | 'WARN' | 'ERROR';

  message: string;

  durationMs: number;

  aoiName: string;

  metadata: Record\<string, unknown\>;

  timestamp: Date;

}

const ProcessingLogSchema \= new Schema\<IProcessingLog\>({

  runId:       { type: String, required: true, index: true },

  stage:       { type: String, required: true },

  level:       { type: String, enum: \['INFO','WARN','ERROR'\], default: 'INFO' },

  message:     { type: String, required: true },

  durationMs:  Number,

  aoiName:     String,

  metadata:    { type: Schema.Types.Mixed, default: {} },

  timestamp:   { type: Date, default: Date.now, index: \-1 }

});

### 5.5 MongoDB Connection Singleton

// lib/mongodb.ts

import mongoose from 'mongoose';

const MONGODB\_URI \= process.env.MONGODB\_URI\!;

if (\!MONGODB\_URI) {

  throw new Error('MONGODB\_URI environment variable is not defined');

}

interface MongooseCache {

  conn: typeof mongoose | null;

  promise: Promise\<typeof mongoose\> | null;

}

declare global {

  var mongoose: MongooseCache;

}

const cached: MongooseCache \= global.mongoose || { conn: null, promise: null };

global.mongoose \= cached;

export async function connectDB(): Promise\<typeof mongoose\> {

  if (cached.conn) return cached.conn;

  if (\!cached.promise) {

    cached.promise \= mongoose.connect(MONGODB\_URI, {

      bufferCommands: false,

      dbName: 'cosmeon'

    });

  }

  cached.conn \= await cached.promise;

  return cached.conn;

}

---

## 6\. Next.js API Routes

### 6.1 Route: POST `/api/pipeline/ingest`

This is the most critical endpoint — the Python pipeline posts its structured output here after every run.

// app/api/pipeline/ingest/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';

import { RiskEvent } from '@/lib/models/RiskEvent';

import { District } from '@/lib/models/District';

import { SatelliteScene } from '@/lib/models/SatelliteScene';

import { ProcessingLog } from '@/lib/models/ProcessingLog';

export async function POST(req: NextRequest) {

  // Verify pipeline secret key

  const authHeader \= req.headers.get('x-pipeline-secret');

  if (authHeader \!== process.env.PIPELINE\_SECRET) {

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  }

  try {

    await connectDB();

    const payload \= await req.json();

    // 1\. Upsert satellite scene record

    const scene \= await SatelliteScene.findOneAndUpdate(

      { geeAssetId: payload.scene.geeAssetId },

      { ...payload.scene, status: 'processed' },

      { upsert: true, new: true }

    );

    // 2\. Process each district result

    const eventIds: string\[\] \= \[\];

    for (const result of payload.districtResults) {

      // Find or create district

      const district \= await District.findOneAndUpdate(

        { districtName: result.districtName, stateName: result.stateName },

        {

          currentRiskLevel: result.riskLevel,

          lastAssessedAt: new Date(),

          $inc: { totalEventsCount: 1 }

        },

        { upsert: true, new: true }

      );

      // Create risk event

      const event \= await RiskEvent.create({

        districtId:        district.\_id,

        sceneId:           scene.\_id,

        eventDate:         new Date(payload.eventDate),

        riskLevel:         result.riskLevel,

        riskScore:         result.riskScore,

        floodAreaKm2:      result.floodAreaKm2,

        floodPctDistrict:  result.floodPctDistrict,

        affectedPopEst:    result.affectedPopEst,

        confidenceScore:   result.confidenceScore,

        detectionMethod:   result.detectionMethod,

        changeFromPrevKm2: result.changeFromPrevKm2,

        floodGeometry:     result.floodGeometry,

        enrichment:        result.enrichment,

        status:            'active'

      });

      eventIds.push(event.\_id.toString());

    }

    // 3\. Bulk insert processing logs

    if (payload.logs?.length \> 0\) {

      await ProcessingLog.insertMany(

        payload.logs.map((log: any) \=\> ({ ...log, runId: payload.runId }))

      );

    }

    return NextResponse.json({

      success: true,

      runId: payload.runId,

      eventsCreated: eventIds.length,

      eventIds

    });

  } catch (error) {

    console.error('Ingest error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  }

}

### 6.2 Route: GET `/api/insights/latest`

// app/api/insights/latest/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';

import { RiskEvent } from '@/lib/models/RiskEvent';

export async function GET(req: NextRequest) {

  await connectDB();

  const { searchParams } \= new URL(req.url);

  const limit  \= parseInt(searchParams.get('limit')  || '50');

  const level  \= searchParams.get('level');   // optional filter

  const state  \= searchParams.get('state');   // optional filter

  const filter: Record\<string, unknown\> \= {};

  if (level) filter.riskLevel \= level.toUpperCase();

  const events \= await RiskEvent

    .find(filter)

    .populate('districtId', 'districtName stateName areaKm2 population2020')

    .populate('sceneId', 'source sceneDate geeAssetId')

    .sort({ eventDate: \-1, detectedAt: \-1 })

    .limit(limit)

    .lean();

  // Aggregate stats

  const \[stats\] \= await RiskEvent.aggregate(\[

    {

      $group: {

        \_id: '$riskLevel',

        count: { $sum: 1 },

        totalFloodArea: { $sum: '$floodAreaKm2' },

        totalAffectedPop: { $sum: '$affectedPopEst' }

      }

    }

  \]);

  return NextResponse.json({

    generatedAt: new Date().toISOString(),

    totalEvents: events.length,

    events,

    summary: stats

  });

}

### 6.3 Route: GET `/api/districts/[id]`

// app/api/districts/\[id\]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';

import { District } from '@/lib/models/District';

import { RiskEvent } from '@/lib/models/RiskEvent';

export async function GET(

  req: NextRequest,

  { params }: { params: { id: string } }

) {

  await connectDB();

  const { searchParams } \= new URL(req.url);

  const days \= parseInt(searchParams.get('days') || '30');

  const district \= await District.findById(params.id).lean();

  if (\!district) {

    return NextResponse.json({ error: 'District not found' }, { status: 404 });

  }

  const since \= new Date();

  since.setDate(since.getDate() \- days);

  const history \= await RiskEvent

    .find({ districtId: params.id, eventDate: { $gte: since } })

    .populate('sceneId', 'source sceneDate')

    .sort({ eventDate: \-1 })

    .lean();

  return NextResponse.json({ district, history, daysRequested: days });

}

### 6.4 Route: GET `/api/insights/summary`

// app/api/insights/summary/route.ts

import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';

import { RiskEvent } from '@/lib/models/RiskEvent';

import { District } from '@/lib/models/District';

export async function GET() {

  await connectDB();

  const \[riskBreakdown, trendData, topDistricts\] \= await Promise.all(\[

    // Risk level breakdown

    RiskEvent.aggregate(\[

      { $sort: { eventDate: \-1 } },

      { $group: { \_id: '$districtId', latest: { $first: '$$ROOT' } } },

      { $group: { \_id: '$latest.riskLevel', count: { $sum: 1 } } }

    \]),

    // 30-day trend (daily aggregation)

    RiskEvent.aggregate(\[

      { $match: { eventDate: { $gte: new Date(Date.now() \- 30 \* 86400000\) } } },

      {

        $group: {

          \_id: { $dateToString: { format: '%Y-%m-%d', date: '$eventDate' } },

          avgRiskScore:      { $avg: '$riskScore' },

          totalFloodAreaKm2: { $sum: '$floodAreaKm2' },

          totalAffectedPop:  { $sum: '$affectedPopEst' },

          criticalCount:     { $sum: { $cond: \[{ $eq: \['$riskLevel', 'CRITICAL'\] }, 1, 0\] } }

        }

      },

      { $sort: { \_id: 1 } }

    \]),

    // Top 5 highest-risk districts

    RiskEvent.find({ riskLevel: { $in: \['CRITICAL', 'HIGH'\] } })

      .populate('districtId', 'districtName stateName')

      .sort({ riskScore: \-1 })

      .limit(5)

      .lean()

  \]);

  return NextResponse.json({ riskBreakdown, trendData, topDistricts });

}

### 6.5 Route: POST `/api/pipeline/trigger`

// app/api/pipeline/trigger/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

  const { aoiName } \= await req.json();

  if (\!aoiName) {

    return NextResponse.json({ error: 'aoiName is required' }, { status: 400 });

  }

  const runId \= crypto.randomUUID();

  // Call Python pipeline service

  const res \= await fetch(\`${process.env.PYTHON\_PIPELINE\_URL}/trigger\`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.PIPELINE\_API\_KEY\! },

    body: JSON.stringify({ aoiName, runId, callbackUrl: \`${process.env.NEXT\_PUBLIC\_APP\_URL}/api/pipeline/ingest\` })

  });

  if (\!res.ok) {

    return NextResponse.json({ error: 'Failed to trigger pipeline' }, { status: 502 });

  }

  return NextResponse.json({ runId, status: 'queued', aoiName });

}

---

## 7\. Core Python ML Pipeline

### 7.1 Main Orchestrator

\# python/pipeline/orchestrator.py

import uuid

import time

import requests

import structlog

from datetime import datetime

from ingestion.gee\_client import init\_gee

from ingestion.sentinel1 import ingest\_sar

from ingestion.sentinel2 import ingest\_optical

from detection.ndwi\_detector import detect\_ndwi

from detection.sar\_detector import detect\_sar

from detection.ensemble import ensemble\_fuse

from detection.temporal\_diff import compute\_change\_detection

from enrichment.risk\_scorer import compute\_risk\_score, classify\_risk

from enrichment.population import get\_affected\_population

from enrichment.rainfall import get\_rainfall\_data

from output.geojson\_builder import flood\_mask\_to\_geojson

from output.api\_poster import post\_results\_to\_nextjs

log \= structlog.get\_logger()

def run\_pipeline(aoi\_name: str, aoi\_bbox: list, run\_id: str \= None, callback\_url: str \= None):

    run\_id   \= run\_id or str(uuid.uuid4())

    logs     \= \[\]

    start\_ts \= time.time()

    def pipeline\_log(stage, message, level='INFO', \*\*kwargs):

        entry \= { 'stage': stage, 'message': message, 'level': level,

                  'durationMs': int((time.time() \- start\_ts) \* 1000), \*\*kwargs }

        logs.append(entry)

        getattr(log, level.lower())(message, stage=stage, \*\*kwargs)

    pipeline\_log('INIT', f'Pipeline started for AOI: {aoi\_name}', runId=run\_id)

    \# ── 1\. INITIALIZE GEE ────────────────────────────────────────────────

    init\_gee()

    pipeline\_log('GEE', 'Google Earth Engine authenticated')

    \# ── 2\. INGEST SATELLITE DATA ─────────────────────────────────────────

    s2\_scene \= ingest\_optical(aoi\_bbox, days\_back=3)

    s1\_scene \= ingest\_sar(aoi\_bbox, days\_back=5)

    pipeline\_log('INGEST', f'Scenes ingested: S2={s2\_scene\["id"\]}, S1={s1\_scene\["id"\]}')

    \# ── 3\. DETECTION ─────────────────────────────────────────────────────

    ndwi\_mask   \= detect\_ndwi(s2\_scene, aoi\_bbox)

    sar\_mask    \= detect\_sar(s1\_scene, aoi\_bbox)

    final\_mask, confidence \= ensemble\_fuse(sar\_mask, ndwi\_mask)

    pipeline\_log('DETECT', 'Ensemble flood detection complete',

                 ndwiCoverage=ndwi\_mask\['flood\_area\_km2'\],

                 sarCoverage=sar\_mask\['flood\_area\_km2'\])

    \# ── 4\. CHANGE DETECTION ───────────────────────────────────────────────

    change\_delta \= compute\_change\_detection(final\_mask, aoi\_name)

    pipeline\_log('CHANGE', f'Change detection: {change\_delta:+.2f} km2 vs baseline')

    \# ── 5\. DISTRICT-LEVEL ENRICHMENT & RISK SCORING ───────────────────────

    district\_results \= \[\]

    districts \= load\_district\_boundaries(aoi\_bbox)  \# from local GeoJSON

    for district in districts:

        flood\_in\_district \= clip\_flood\_to\_district(final\_mask, district\['geometry'\])

        flood\_area\_km2    \= compute\_area\_km2(flood\_in\_district)

        flood\_pct         \= (flood\_area\_km2 / district\['area\_km2'\]) \* 100

        affected\_pop      \= get\_affected\_population(district\['geometry'\], flood\_in\_district)

        rainfall\_mm       \= get\_rainfall\_data(district\['centroid'\])

        elev\_vuln         \= district.get('elev\_vuln\_index', 0.3)

        pop\_density       \= district\['population\_2020'\] / district\['area\_km2'\]

        risk\_score \= compute\_risk\_score(flood\_pct, pop\_density, elev\_vuln, rainfall\_mm)

        risk\_level \= classify\_risk(risk\_score)

        geojson    \= flood\_mask\_to\_geojson(flood\_in\_district)

        district\_results.append({

            'districtName':     district\['name'\],

            'stateName':        district\['state'\],

            'riskLevel':        risk\_level,

            'riskScore':        risk\_score,

            'floodAreaKm2':     flood\_area\_km2,

            'floodPctDistrict': flood\_pct,

            'affectedPopEst':   affected\_pop,

            'confidenceScore':  float(confidence),

            'detectionMethod':  'ENSEMBLE',

            'changeFromPrevKm2': change\_delta,

            'floodGeometry':    geojson,

            'enrichment': {

                'rainfallMm7d':       rainfall\_mm,

                'rainfallSource':     'CHIRPS',

                'elevationVulnIndex': elev\_vuln,

                'popDensityKm2':      pop\_density,

            }

        })

        pipeline\_log('ENRICH', f'{district\["name"\]}: {risk\_level} ({risk\_score:.1f})',

                     floodAreaKm2=flood\_area\_km2, affectedPop=affected\_pop)

    \# ── 6\. POST TO NEXT.JS API ────────────────────────────────────────────

    payload \= {

        'runId':          run\_id,

        'eventDate':      datetime.utcnow().isoformat(),

        'aoiName':        aoi\_name,

        'scene': {

            'source':       'S2',

            'sceneDate':    s2\_scene\['date'\],

            'geeAssetId':   s2\_scene\['id'\],

            'cloudCoverPct': s2\_scene.get('cloud\_pct'),

            'status':       'processed'

        },

        'districtResults': district\_results,

        'logs':           logs

    }

    callback \= callback\_url or os.getenv('NEXTJS\_INGEST\_URL')

    post\_results\_to\_nextjs(payload, callback)

    pipeline\_log('OUTPUT', f'Results posted: {len(district\_results)} districts',

                 totalDurationMs=int((time.time() \- start\_ts) \* 1000))

    return { 'runId': run\_id, 'districtsProcessed': len(district\_results) }

### 7.2 NDWI Detector

\# python/pipeline/detection/ndwi\_detector.py

import ee

def detect\_ndwi(scene: dict, aoi\_bbox: list) \-\> dict:

    aoi \= ee.Geometry.Rectangle(aoi\_bbox)

    s2 \= (ee.ImageCollection('COPERNICUS/S2\_SR')

            .filterBounds(aoi)

            .filterDate(scene\['date'\], scene\['date'\])

            .filter(ee.Filter.lt('CLOUDY\_PIXEL\_PERCENTAGE', 30))

            .first())

    green \= s2.select('B3')

    nir   \= s2.select('B8')

    swir  \= s2.select('B11')

    ndwi  \= green.subtract(nir).divide(green.add(nir)).rename('NDWI')

    mndwi \= green.subtract(swir).divide(green.add(swir)).rename('MNDWI')

    \# Exclude permanent water using JRC baseline

    jrc \= ee.Image('JRC/GSW1\_4/GlobalSurfaceWater').select('occurrence')

    permanent \= jrc.gt(80)

    flood\_mask \= ndwi.gt(0.3).And(mndwi.gt(0.0)).And(permanent.Not())

    area \= flood\_mask.multiply(ee.Image.pixelArea()).reduceRegion(

        reducer=ee.Reducer.sum(), geometry=aoi, scale=10

    ).get('NDWI')

    return {

        'mask':          flood\_mask,

        'flood\_area\_km2': float(ee.Number(area).divide(1e6).getInfo()),

        'source':        'S2\_NDWI'

    }

### 7.3 SAR Detector

\# python/pipeline/detection/sar\_detector.py

import ee

def detect\_sar(scene: dict, aoi\_bbox: list) \-\> dict:

    aoi \= ee.Geometry.Rectangle(aoi\_bbox)

    s1 \= (ee.ImageCollection('COPERNICUS/S1\_GRD')

            .filterBounds(aoi)

            .filterDate(scene\['date'\], scene\['date'\])

            .filter(ee.Filter.eq('instrumentMode', 'IW'))

            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))

            .first())

    vv \= s1.select('VV')

    \# Lee speckle filter

    kernel   \= ee.Kernel.square(radius=1)

    filtered \= vv.reduceNeighborhood(reducer=ee.Reducer.mean(), kernel=kernel)

    \# Dynamic threshold: mean \- 2\*stddev

    stats     \= filtered.reduceRegion(ee.Reducer.mean().combine(ee.Reducer.stdDev(), None, True), aoi, 30\)

    mean\_val  \= ee.Number(stats.get('VV\_mean'))

    std\_val   \= ee.Number(stats.get('VV\_stdDev'))

    threshold \= mean\_val.subtract(std\_val.multiply(2))

    flood\_mask \= filtered.lt(threshold)

    area \= flood\_mask.multiply(ee.Image.pixelArea()).reduceRegion(

        reducer=ee.Reducer.sum(), geometry=aoi, scale=10

    ).get('VV')

    return {

        'mask':           flood\_mask,

        'threshold\_db':   threshold.getInfo(),

        'flood\_area\_km2': float(ee.Number(area).divide(1e6).getInfo()),

        'source':         'S1\_SAR'

    }

### 7.4 Ensemble Fusion

\# python/pipeline/detection/ensemble.py

WEIGHTS \= { 'SAR': 0.45, 'NDWI': 0.35, 'UNET': 0.20 }

def ensemble\_fuse(sar\_result: dict, ndwi\_result: dict, unet\_result: dict \= None) \-\> tuple:

    """

    Weighted ensemble fusion of detection methods.

    Returns (flood\_mask, confidence\_image).

    """

    sar\_w  \= sar\_result\['mask'\].multiply(WEIGHTS\['SAR'\])

    ndwi\_w \= ndwi\_result\['mask'\].multiply(WEIGHTS\['NDWI'\])

    if unet\_result:

        unet\_w     \= unet\_result\['mask'\].multiply(WEIGHTS\['UNET'\])

        confidence \= sar\_w.add(ndwi\_w).add(unet\_w)

    else:

        \# Redistribute U-Net weight when unavailable

        confidence \= sar\_w.multiply(1.3).add(ndwi\_w.multiply(1.15))

    flood\_final \= confidence.gte(0.45)

    avg\_confidence \= float(confidence.reduceRegion(

        ee.Reducer.mean(), scale=30

    ).values().get(0).getInfo() or 0.5)

    return flood\_final, avg\_confidence

### 7.5 Risk Scorer

\# python/pipeline/enrichment/risk\_scorer.py

def compute\_risk\_score(

    flood\_pct: float,

    pop\_density\_km2: float,

    elev\_vuln\_index: float,

    rainfall\_mm\_7d: float

) \-\> float:

    """Composite 0-100 risk score from four normalized components."""

    f \= min(flood\_pct / 100, 1.0)

    p \= min(pop\_density\_km2 / 5000, 1.0)   \# 5000/km2 \= dense urban reference

    e \= min(elev\_vuln\_index, 1.0)           \# fraction of district below 10m ASL

    r \= min(rainfall\_mm\_7d / 300, 1.0)     \# 300mm/7d \= extreme monsoon threshold

    score \= (0.40 \* f \+ 0.25 \* p \+ 0.20 \* e \+ 0.15 \* r) \* 100

    return round(score, 2\)

def classify\_risk(score: float) \-\> str:

    if score \>= 76: return 'CRITICAL'

    if score \>= 51: return 'HIGH'

    if score \>= 26: return 'MEDIUM'

    return 'LOW'

---

## 8\. Frontend Components & Pages

### 8.1 Dashboard Page

// app/page.tsx

import { Suspense } from 'react';

import StatsGrid from '@/components/dashboard/StatsGrid';

import RiskTable from '@/components/dashboard/RiskTable';

import TrendChart from '@/components/dashboard/TrendChart';

import AlertBanner from '@/components/dashboard/AlertBanner';

export default function DashboardPage() {

  return (

    \<main className="p-6 space-y-6"\>

      \<div className="flex items-center justify-between"\>

        \<div\>

          \<h1 className="text-2xl font-bold text-slate-900"\>Climate Risk Dashboard\</h1\>

          \<p className="text-sm text-slate-500 mt-1"\>

            Satellite-derived flood intelligence · Auto-updates every 5 minutes

          \</p\>

        \</div\>

        \<TriggerPipelineButton /\>

      \</div\>

      \<Suspense fallback={\<div\>Loading alerts...\</div\>}\>

        \<AlertBanner /\>

      \</Suspense\>

      \<Suspense fallback={\<div\>Loading stats...\</div\>}\>

        \<StatsGrid /\>

      \</Suspense\>

      \<div className="grid grid-cols-1 lg:grid-cols-3 gap-6"\>

        \<div className="lg:col-span-2"\>

          \<Suspense fallback={\<div\>Loading trend chart...\</div\>}\>

            \<TrendChart /\>

          \</Suspense\>

        \</div\>

        \<div\>

          \<RiskDistributionDonut /\>

        \</div\>

      \</div\>

      \<Suspense fallback={\<div\>Loading risk table...\</div\>}\>

        \<RiskTable /\>

      \</Suspense\>

    \</main\>

  );

}

### 8.2 Stats Grid Component

// components/dashboard/StatsGrid.tsx

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api/fetcher';

import { AlertTriangle, Droplets, Users, Activity } from 'lucide-react';

export default function StatsGrid() {

  const { data, isLoading } \= useSWR('/api/insights/summary', fetcher, {

    refreshInterval: 5 \* 60 \* 1000  // Refresh every 5 minutes

  });

  const stats \= \[

    {

      label: 'Critical Districts',

      value: data?.riskBreakdown?.find((r: any) \=\> r.\_id \=== 'CRITICAL')?.count ?? 0,

      icon: AlertTriangle,

      color: 'text-red-600',

      bg: 'bg-red-50',

      border: 'border-red-200'

    },

    {

      label: 'Total Flood Area',

      value: \`${data?.trendData?.at(-1)?.totalFloodAreaKm2?.toFixed(0) ?? 0} km²\`,

      icon: Droplets,

      color: 'text-blue-600',

      bg: 'bg-blue-50',

      border: 'border-blue-200'

    },

    {

      label: 'Affected Population',

      value: data?.trendData?.at(-1)?.totalAffectedPop?.toLocaleString() ?? '0',

      icon: Users,

      color: 'text-orange-600',

      bg: 'bg-orange-50',

      border: 'border-orange-200'

    },

    {

      label: 'Pipeline Status',

      value: 'Operational',

      icon: Activity,

      color: 'text-green-600',

      bg: 'bg-green-50',

      border: 'border-green-200'

    }

  \];

  if (isLoading) return \<div className="grid grid-cols-4 gap-4"\>

    {\[...Array(4)\].map((\_, i) \=\> \<div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" /\>)}

  \</div\>;

  return (

    \<div className="grid grid-cols-2 lg:grid-cols-4 gap-4"\>

      {stats.map((stat) \=\> (

        \<div key={stat.label} className={\`p-4 rounded-lg border ${stat.bg} ${stat.border}\`}\>

          \<div className="flex items-center justify-between"\>

            \<stat.icon className={\`w-5 h-5 ${stat.color}\`} /\>

          \</div\>

          \<p className={\`text-2xl font-bold mt-2 ${stat.color}\`}\>{stat.value}\</p\>

          \<p className="text-sm text-slate-600 mt-1"\>{stat.label}\</p\>

        \</div\>

      ))}

    \</div\>

  );

}

### 8.3 Risk Badge Component

// components/shared/RiskBadge.tsx

const RISK\_CONFIG \= {

  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300' },

  HIGH:     { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-300' },

  MEDIUM:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },

  LOW:      { label: 'Low',      className: 'bg-green-100 text-green-800 border-green-300' },

  UNKNOWN:  { label: 'Unknown',  className: 'bg-slate-100 text-slate-600 border-slate-300' },

};

export default function RiskBadge({ level }: { level: keyof typeof RISK\_CONFIG }) {

  const config \= RISK\_CONFIG\[level\] || RISK\_CONFIG.UNKNOWN;

  return (

    \<span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}\`}\>

      {config.label}

    \</span\>

  );

}

### 8.4 Flood Map Page

// app/map/page.tsx

'use client';

import dynamic from 'next/dynamic';

import useSWR from 'swr';

import { fetcher } from '@/lib/api/fetcher';

// Leaflet must be dynamically imported (SSR incompatible)

const FloodMap \= dynamic(() \=\> import('@/components/map/FloodMap'), { ssr: false });

export default function MapPage() {

  const { data, isLoading } \= useSWR('/api/insights/latest?limit=100', fetcher, {

    refreshInterval: 5 \* 60 \* 1000

  });

  return (

    \<div className="h-screen flex flex-col"\>

      \<div className="p-4 border-b bg-white"\>

        \<h1 className="text-xl font-bold"\>Flood Zone Map\</h1\>

        \<p className="text-sm text-slate-500"\>Click any polygon for district details\</p\>

      \</div\>

      \<div className="flex-1"\>

        {\!isLoading && \<FloodMap events={data?.events ?? \[\]} /\>}

      \</div\>

    \</div\>

  );

}

// components/map/FloodMap.tsx

'use client';

import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import DistrictPopup from './DistrictPopup';

const RISK\_COLORS: Record\<string, string\> \= {

  CRITICAL: '\#ef4444',

  HIGH:     '\#f97316',

  MEDIUM:   '\#eab308',

  LOW:      '\#22c55e',

};

export default function FloodMap({ events }: { events: any\[\] }) {

  const validEvents \= events.filter(e \=\> e.floodGeometry?.coordinates?.length \> 0);

  const style \= (event: any) \=\> ({

    fillColor: RISK\_COLORS\[event.riskLevel\] || '\#94a3b8',

    weight: 2,

    opacity: 1,

    color: 'white',

    fillOpacity: 0.6

  });

  return (

    \<MapContainer

      center={\[26.0, 91.7\]}  // Assam, India

      zoom={7}

      className="w-full h-full"

    \>

      \<TileLayer

        attribution='© OpenStreetMap'

        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

      /\>

      {validEvents.map((event) \=\> (

        \<GeoJSON

          key={event.\_id}

          data={event.floodGeometry}

          style={() \=\> style(event)}

          onEachFeature={(feature, layer) \=\> {

            layer.bindPopup(() \=\> {

              const div \= document.createElement('div');

              div.innerHTML \= \`

                \<div class="p-2"\>

                  \<strong\>${event.districtId?.districtName}, ${event.districtId?.stateName}\</strong\>\<br/\>

                  Risk: \<span style="color:${RISK\_COLORS\[event.riskLevel\]}"\>${event.riskLevel}\</span\>\<br/\>

                  Score: ${event.riskScore}/100\<br/\>

                  Flood Area: ${event.floodAreaKm2?.toFixed(1)} km²\<br/\>

                  Affected: ${event.affectedPopEst?.toLocaleString()} people\<br/\>

                  Confidence: ${(event.confidenceScore \* 100).toFixed(0)}%

                \</div\>

              \`;

              return div;

            });

          }}

        /\>

      ))}

    \</MapContainer\>

  );

}

---

## 9\. Data Flow & Integration

### 9.1 End-to-End Flow Diagram

Python Pipeline (Railway)           Next.js (Vercel)           MongoDB Atlas

─────────────────────              ─────────────────           ─────────────

APScheduler (every 6h)

        │

        ▼

  init\_gee() auth

        │

        ▼

  fetch Sentinel-1 \+ S2             

        │ (GEE processes on Google servers)

        ▼

  detect\_ndwi()

  detect\_sar()

  ensemble\_fuse()

        │

        ▼

  risk\_score per district

        │

        ▼

  build JSON payload

        │

        └──── POST /api/pipeline/ingest ──▶  Validate secret header

                                                    │

                                                    ▼

                                          SatelliteScene.upsert()

                                          District.findOneAndUpdate()

                                          RiskEvent.create()         ──▶ risk\_events

                                          ProcessingLog.insertMany() ──▶ processing\_logs

                                                    │

                                                    ▼

                                          Return { success, eventIds }

User opens Dashboard

        │

        ▼

SWR fetches /api/insights/latest

        │                                 GET /api/insights/latest

        │                                         │

        │                                         ▼

        │                                 RiskEvent.find()

        │                                 .populate('districtId')  ──▶ risk\_events

        │                                 .sort({eventDate: \-1})       districts

        │                                         │

        ◀─────────── JSON response ───────────────┘

User clicks district on map

        │

        ▼

        │                                 GET /api/districts/\[id\]

        │                                         │

        │                                         ▼

        │                                 District.findById()      ──▶ districts

        │                                 RiskEvent.find({30d})    ──▶ risk\_events

        ◀─────────── { district, history } ───────┘

### 9.2 Python → Next.js Payload Schema

{

  "runId": "uuid-v4",

  "eventDate": "2026-02-27T08:00:00Z",

  "aoiName": "assam\_india",

  "scene": {

    "source": "S2",

    "sceneDate": "2026-02-27T05:12:00Z",

    "geeAssetId": "COPERNICUS/S2\_SR/20260227T052221\_...",

    "cloudCoverPct": 12.4,

    "status": "processed"

  },

  "districtResults": \[

    {

      "districtName": "Morigaon",

      "stateName": "Assam",

      "riskLevel": "CRITICAL",

      "riskScore": 87.4,

      "floodAreaKm2": 34.2,

      "floodPctDistrict": 28.6,

      "affectedPopEst": 41200,

      "confidenceScore": 0.91,

      "detectionMethod": "ENSEMBLE",

      "changeFromPrevKm2": 12.4,

      "floodGeometry": {

        "type": "MultiPolygon",

        "coordinates": \[\[\[\[91.5, 26.2\], \[91.7, 26.2\], ...\]\]\]

      },

      "enrichment": {

        "rainfallMm7d": 187.3,

        "rainfallSource": "CHIRPS",

        "elevationVulnIndex": 0.72,

        "popDensityKm2": 412.0,

        "landCoverUrbanPct": 8.2,

        "landCoverAgriPct": 67.1,

        "jrcPermanentWaterPct": 4.3

      }

    }

  \],

  "logs": \[

    { "stage": "INIT", "message": "Pipeline started", "level": "INFO", "durationMs": 0 },

    { "stage": "GEE", "message": "GEE authenticated", "level": "INFO", "durationMs": 1240 },

    { "stage": "DETECT", "message": "Ensemble complete", "level": "INFO", "durationMs": 34210 }

  \]

}

---

## 10\. Step-by-Step Development Plan

### Pre-Hackathon (Tonight)

| Task | Owner | Tool |
| :---- | :---- | :---- |
| Create MongoDB Atlas account \+ cluster (M0 free) | All | atlas.mongodb.com |
| Get Google Earth Engine API access | Engineer A | earthengine.google.com |
| Download India district GeoJSON | Engineer B | github.com/datameet/maps |
| Create Next.js project: `npx create-next-app@latest cosmeon --typescript --tailwind --app` | Engineer C | Terminal |
| Install packages: mongoose, swr, react-leaflet, recharts, lucide-react | Engineer C | npm |
| Test GEE Python script: pull one Sentinel-2 NDWI scene | Engineer A | Python |
| Set up `.env.local` with MONGODB\_URI and dummy PIPELINE\_SECRET | All | Editor |

### Hour 0–2: Foundation

**Goal:** MongoDB connected, basic API routes live, project structure in place.

\# Verify MongoDB connection works

\# Test: curl http://localhost:3000/api/health

\# Expected: { "status": "ok", "db": "connected" }

- `lib/mongodb.ts` — connection singleton  
- All 4 Mongoose models defined  
- `GET /api/health` endpoint working  
- `POST /api/pipeline/ingest` accepting test payload  
- District boundaries seeded into MongoDB from GeoJSON file

### Hour 2–4: Python Detection Pipeline

**Goal:** NDWI \+ SAR detection working, structured JSON output generated.

- `gee_client.py` — auth and AOI setup  
- `sentinel2.py` \+ `sentinel1.py` — scene fetching  
- `ndwi_detector.py` — flood mask with JRC exclusion  
- `sar_detector.py` — backscatter threshold  
- `ensemble.py` — weighted fusion  
- `temporal_diff.py` — compare against JRC historical baseline  
- Test: pipeline produces valid JSON payload for a known flood event

### Hour 4–6: Enrichment \+ Risk Scoring \+ API Integration

**Goal:** Full district-level results posting to MongoDB via Next.js API.

- `risk_scorer.py` — composite score computation  
- `population.py` — WorldPop spatial join  
- `rainfall.py` — Open-Meteo API call  
- `api_poster.py` — POST payload to Next.js `/api/pipeline/ingest`  
- Test: run full pipeline, verify documents appear in MongoDB Atlas UI  
- `GET /api/insights/latest` returns real data  
- `GET /api/insights/summary` aggregation working

### Hour 6–8: Frontend Dashboard

**Goal:** Working dashboard with live data from MongoDB.

- `StatsGrid.tsx` with SWR polling  
- `RiskTable.tsx` with sortable district list  
- `TrendChart.tsx` with Recharts line chart  
- `AlertBanner.tsx` for Critical/High districts  
- `FloodMap.tsx` with react-leaflet \+ GeoJSON polygons  
- `RiskBadge.tsx` and shared components  
- Route `/districts/[id]` showing district history

### Hour 8–9: Polish \+ Optional Features

**Goal:** Complete the optional enhancements and clean up.

- Pipeline trigger button on dashboard → `POST /api/pipeline/trigger`  
- Processing logs page → `GET /api/logs/[runId]`  
- Confidence score display on map popups  
- PDF report generation (WeasyPrint in Python, stored path in MongoDB)  
- Time slider on map to show T1 vs T2 flood extent

### Hour 9–10: Demo Prep

**Goal:** Flawless, rehearsed 3-minute demo.

- Full demo rehearsal — no surprises  
- Clean up console errors  
- Seed MongoDB with data from 3 timestamps (pre/peak/post flood)  
- Write README with setup instructions  
- Deploy to Vercel (`vercel --prod`) \+ Railway

---

## 11\. Environment Configuration

### Next.js `.env.local`

\# MongoDB

MONGODB\_URI=mongodb+srv://cosmeon:\<password\>@cluster0.abc123.mongodb.net/?retryWrites=true\&w=majority

\# Security

PIPELINE\_SECRET=your-super-secret-key-shared-with-python-pipeline

PIPELINE\_API\_KEY=api-key-for-triggering-python-pipeline

\# App

NEXT\_PUBLIC\_APP\_URL=https://cosmeon.vercel.app

PYTHON\_PIPELINE\_URL=https://cosmeon-pipeline.railway.app

\# Optional: NextAuth if adding auth

NEXTAUTH\_SECRET=your-nextauth-secret

NEXTAUTH\_URL=https://cosmeon.vercel.app

### Python `.env`

\# Google Earth Engine

GEE\_SERVICE\_ACCOUNT=cosmeon@your-project.iam.gserviceaccount.com

GEE\_PRIVATE\_KEY\_PATH=/secrets/gee\_key.json

\# Next.js callback

NEXTJS\_INGEST\_URL=https://cosmeon.vercel.app/api/pipeline/ingest

PIPELINE\_SECRET=your-super-secret-key-shared-with-python-pipeline

\# Pipeline config

DEFAULT\_AOI\_NAME=assam\_india

DEFAULT\_AOI\_BBOX=\[89.7,24.1,96.0,28.2\]

PIPELINE\_CRON=0 \*/6 \* \* \*

\# Open-Meteo (no key needed — free)

OPENMETEO\_BASE\_URL=https://api.open-meteo.com/v1

### `package.json` Dependencies

{

  "dependencies": {

    "next": "14.2.0",

    "react": "^18",

    "react-dom": "^18",

    "mongoose": "^8.3.0",

    "swr": "^2.2.5",

    "leaflet": "^1.9.4",

    "react-leaflet": "^4.2.1",

    "recharts": "^2.12.0",

    "lucide-react": "^0.378.0",

    "@types/leaflet": "^1.9.11"

  },

  "devDependencies": {

    "typescript": "^5",

    "tailwindcss": "^3.4.1",

    "@types/node": "^20",

    "@types/react": "^18"

  }

}

---

## 12\. Deployment Strategy

### Hackathon Deployment (Zero-Config)

Next.js  ──── Vercel (free tier, auto-deploy from GitHub)

Python   ──── Railway (Dockerfile, cron jobs supported)

Database ──── MongoDB Atlas M0 (free, 512MB)

**Steps:**

1. Push project to GitHub  
2. Connect GitHub repo to Vercel → auto-deploys on every push  
3. Add all `.env` variables to Vercel dashboard  
4. Push `python/` subfolder to Railway, set as Dockerfile service  
5. Add Python `.env` variables to Railway dashboard  
6. Seed MongoDB with initial district boundaries via one-time script

### Vercel Config

// next.config.js

/\*\* @type {import('next').NextConfig} \*/

const nextConfig \= {

  experimental: {

    serverComponentsExternalPackages: \['mongoose'\]

  }

};

module.exports \= nextConfig;

### Railway `Dockerfile` (Python Pipeline)

FROM python:3.11-slim

WORKDIR /app

COPY python/requirements.txt .

RUN pip install \--no-cache-dir \-r requirements.txt

COPY python/ .

EXPOSE 8080

CMD \["python", "scheduler.py"\]

### Production Scaling Path

| Component | Hackathon | Production |
| :---- | :---- | :---- |
| Next.js | Vercel Hobby | Vercel Pro \+ Edge Functions |
| Database | MongoDB Atlas M0 | Atlas M10 \+ Read Replicas |
| Python | Railway Starter | AWS ECS Fargate \+ GPU support |
| Cache | None | Redis (Upstash) for API response caching |
| CDN | Vercel built-in | CloudFront for GeoJSON tiles |

---

## 13\. Scalability Considerations

### MongoDB-Specific Optimizations

**Compound Indexes** — The most common query pattern is "latest events for a district, sorted by date." The compound index `{ districtId: 1, eventDate: -1 }` makes this O(log n) regardless of collection size.

**Geospatial Queries** — The `2dsphere` index on `floodGeometry` enables MongoDB's native spatial operators like `$geoIntersects` and `$geoWithin`. This means you can query "find all risk events whose flood polygon intersects a given bounding box" entirely in the database layer without loading data into Python or JavaScript.

**Aggregation Pipeline** — MongoDB's aggregation pipeline handles all analytics server-side. The summary endpoint uses `$group`, `$sort`, and `$match` stages — MongoDB executes these with index support, returning only the final aggregated result.

**Time-Series Pattern** — For very high-frequency data, MongoDB Atlas has a native Time Series collection type that compresses and indexes time-ordered documents 10-20x more efficiently than standard collections. The `risk_events` collection can be migrated to this collection type in production with no application code change.

**TTL Index for Logs** — Processing logs don't need to be kept forever. A TTL index auto-deletes old log documents:

ProcessingLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 \* 24 \* 3600 }); // 30-day retention

### Next.js-Specific Optimizations

**Server Components** — Use Server Components for initial data fetching (no JavaScript shipped to browser, no loading flash). Use Client Components with SWR only where real-time updates are needed.

**Route Segment Config** — For API routes that return slowly-changing data, add revalidation:

export const revalidate \= 300; // Revalidate every 5 minutes

**API Response Caching** — Wrap expensive MongoDB aggregations in Next.js `unstable_cache`:

import { unstable\_cache } from 'next/cache';

const getCachedSummary \= unstable\_cache(

  async () \=\> RiskEvent.aggregate(\[...\]),

  \['summary'\],

  { revalidate: 300 }

);

---

## 14\. Demo Script

### Opening (30 seconds) — Lead with Impact

"In June 2022, catastrophic floods submerged one-third of Pakistan. 1,700 people died. The government had no automated system telling them in real time which districts were most at risk, how many people were affected, or where to send relief. COSMEON changes that."

### Live Demo Flow (90 seconds)

1. **Dashboard** → Show the stats grid (Critical: 3, Flood Area: 847 km², Affected: 340,000)  
2. **Alert Banner** → Click a Critical district → navigate to district detail page  
3. **District Detail** → Show 30-day history chart, risk score breakdown, confidence 91%  
4. **Map Page** → Show flood polygons on Leaflet map, color-coded by risk level  
5. **Map Interaction** → Click a red polygon → popup shows all district stats  
6. **API Demo** → Open browser to `/api/insights/latest` → show raw JSON response  
7. **Logs Page** → Show structured pipeline logs proving automated processing

### Technical Proof Points (30 seconds)

- "We use SAR radar from Sentinel-1 — it penetrates monsoon clouds. Optical satellites go blind exactly when floods are happening. We don't."  
- "MongoDB's native GeoJSON support means we store, index, and query flood polygons directly in the database — no separate GIS server needed."  
- "Every insight has a confidence score — 91% means our SAR detector, NDWI index, and ML model all agreed. We don't just detect; we measure certainty."

### Closing (30 seconds) — The Startup Pitch

"With cloud infrastructure and 90 days of engineering, COSMEON can cover all of South Asia, processing new satellite passes within 90 minutes. Government disaster agencies, insurance underwriters, and agricultural lenders all need this signal. The satellite data is free. The processing is automated. The insight is what we sell. The addressable market is $50 billion and growing."

---

*COSMEON Climate Risk Intelligence Engine · Technical Blueprint v2.0 · Next.js \+ MongoDB Edition · February 2026*  
