import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RiskEvent } from '@/lib/models/RiskEvent';
import { District } from '@/lib/models/District';
import { SatelliteScene } from '@/lib/models/SatelliteScene';

export const dynamic = 'force-dynamic';


/**
 * POST /api/realtime/ingest-weather
 *
 * Calls Open-Meteo live weather API for all 5 Assam districts,
 * computes rainfall-driven risk scores, and writes real RiskEvent
 * documents to MongoDB Atlas.
 *
 * NOTE: floodGeometry is stored as null here (no 2dsphere index needed).
 * The Flood Map uses lat/lon from metadata.floodBbox instead.
 */

const INDIA_DISTRICTS = [
    // North
    { name: 'Patna', state: 'Bihar', lat: 25.59, lon: 85.13, area: 3202, pop: 5838465 },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.84, lon: 80.94, area: 2528, pop: 4589838 },
    { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.08, lon: 74.79, area: 2228, pop: 1236829 },
    // Northeast
    { name: 'Kamrup', state: 'Assam', lat: 26.14, lon: 91.74, area: 1694, pop: 1513841 },
    { name: 'Dhubri', state: 'Assam', lat: 26.02, lon: 89.98, area: 2838, pop: 1949258 },
    { name: 'Dibrugarh', state: 'Assam', lat: 27.47, lon: 94.91, area: 3381, pop: 1326335 },
    { name: 'Imphal', state: 'Manipur', lat: 24.81, lon: 93.93, area: 519, pop: 642227 },
    // East
    { name: 'Kolkata', state: 'West Bengal', lat: 22.57, lon: 88.36, area: 206, pop: 4496694 },
    { name: 'Bhubaneswar', state: 'Odisha', lat: 20.29, lon: 85.82, area: 422, pop: 843402 },
    // West
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.07, lon: 72.87, area: 603, pop: 12442373 },
    { name: 'Surat', state: 'Gujarat', lat: 21.17, lon: 72.83, area: 326, pop: 4467797 },
    // South
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lon: 80.27, area: 426, pop: 7088000 },
    { name: 'Kochi', state: 'Kerala', lat: 9.93, lon: 76.26, area: 95, pop: 601574 },
    { name: 'Wayanad', state: 'Kerala', lat: 11.68, lon: 76.13, area: 2131, pop: 817420 },
];

const ELEV_VULN: Record<string, number> = {
    Kamrup: 0.62, Dhubri: 0.78, Patna: 0.85, Srinagar: 0.92, Mumbai: 0.88, Kochi: 0.95, Wayanad: 0.82,
};

function classifyRisk(score: number): string {
    return score >= 76 ? 'CRITICAL' : score >= 51 ? 'HIGH' : score >= 26 ? 'MEDIUM' : 'LOW';
}

function computeRiskScore(
    rainfall7d: number, popDensity: number, elevVuln: number
): number {
    const flood_pct = Math.min((rainfall7d / 300) * 40, 100);
    const f = Math.min(flood_pct / 100, 1.0);
    const p = Math.min(popDensity / 5000, 1.0);
    const e = Math.min(elevVuln, 1.0);
    const r = Math.min(rainfall7d / 300, 1.0);
    return parseFloat(((0.40 * f + 0.25 * p + 0.20 * e + 0.15 * r) * 100).toFixed(2));
}

function estimateFloodArea(rainfall7d: number, areaKm2: number, elevVuln: number): number {
    if (rainfall7d < 20) return 0; // Adjusted threshold for higher sensitivity
    const base = Math.min((rainfall7d / 200) * 0.22, 0.45);
    const vuln = 1 + (elevVuln - 0.5) * 0.5;
    return parseFloat((base * vuln * areaKm2).toFixed(1));
}

function floodBbox(lat: number, lon: number, areaKm2: number): number[] | null {
    if (areaKm2 <= 0) return null;
    const s = Math.sqrt(Math.max(areaKm2, 0.01)) / 111 * 0.8;
    return [lon - s, lat - s, lon + s, lat + s];
}

/**
 * Build a bounding-box Polygon from flood area estimate.
 * Used by the Flood Map when no GEE pixel geometry is available.
 * This is an Open-Meteo derived ESTIMATE, not a satellite-detected boundary.
 */
function buildFloodPolygon(lat: number, lon: number, areaKm2: number): object | null {
    if (areaKm2 <= 0) return null;
    const s = Math.sqrt(Math.max(areaKm2, 1)) / 111 * 0.7; // scale to estimated area
    return {
        type: 'Polygon',
        coordinates: [[
            [lon - s, lat - s],
            [lon + s, lat - s],
            [lon + s, lat + s],
            [lon - s, lat + s],
            [lon - s, lat - s],
        ]],
    };
}

export async function POST() {
    try {
        await connectDB();

        // 1. Fetch live weather from Open-Meteo (via our own route)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const weatherRes = await fetch(`${baseUrl}/api/realtime/weather`, {
            cache: 'no-store',
        });
        if (!weatherRes.ok) throw new Error(`Weather API returned ${weatherRes.status}`);

        const weatherData = await weatherRes.json();
        if (!weatherData.success || !weatherData.districts?.length) {
            throw new Error(weatherData.error ?? 'No weather data returned');
        }

        // 2. Create shared satellite scene for this run
        const now = new Date();
        const dateKey = now.toISOString().slice(0, 10);
        const scene = await SatelliteScene.findOneAndUpdate(
            { geeAssetId: `OPENMETEO_${dateKey}` },
            {
                source: 'S2',
                sceneDate: now,
                ingestedAt: now,
                aoiName: 'india_nationwide',
                boundingBox: [68.1, 6.7, 97.4, 35.5],
                cloudCoverPct: null,
                geeAssetId: `OPENMETEO_${dateKey}`,
                status: 'processed',
                processingDurationMs: 0,
            },
            { upsert: true, new: true }
        );

        // Build weather lookup
        const wxByDistrict: Record<string, any> = {};
        for (const d of weatherData.districts) {
            wxByDistrict[d.district] = d;
        }

        const results = [];

        for (const info of INDIA_DISTRICTS) {
            const wx = wxByDistrict[info.name];
            if (!wx) continue;

            const rainfall7d = wx.rainfall.last7dTotal;
            const rainfall24h = wx.rainfall.last24h;
            const popDensity = info.pop / info.area;
            const elevVuln = ELEV_VULN[info.name] ?? 0.5;
            const riskScore = computeRiskScore(rainfall7d, popDensity, elevVuln);
            const riskLevel = classifyRisk(riskScore);
            const floodAreaKm2 = estimateFloodArea(rainfall7d, info.area, elevVuln);
            const floodPct = parseFloat(((floodAreaKm2 / info.area) * 100).toFixed(2));
            const affectedPop = Math.round(floodAreaKm2 * popDensity * (0.6 + elevVuln * 0.3));

            // Upsert district
            const district = await District.findOneAndUpdate(
                { districtName: info.name, stateName: info.state },
                {
                    currentRiskLevel: riskLevel,
                    lastAssessedAt: now,
                    areaKm2: info.area,
                    population2020: info.pop,
                    gadmLevel2Id: `LIVE_IND_${info.name.toUpperCase()}`,
                    $inc: { totalEventsCount: 1 },
                },
                { upsert: true, new: true, returnDocument: 'after' }
            );

            // Previous event for delta
            const prev = await RiskEvent
                .findOne({ districtId: district._id })
                .sort({ eventDate: -1 })
                .lean();
            const changeFromPrev = prev
                ? parseFloat((floodAreaKm2 - (prev as any).floodAreaKm2).toFixed(1))
                : 0;

            // Compute flood polygon for Flood Map rendering
            // This is a rainfall-area-derived bounding box — labeled 'WEATHER_ESTIMATE'
            // GEE pipeline will overwrite with real SAR+NDWI pixel-level polygon
            const bbox = floodBbox(info.lat, info.lon, floodAreaKm2);
            const geom = buildFloodPolygon(info.lat, info.lon, floodAreaKm2);

            const event = await RiskEvent.create({
                districtId: district._id,
                sceneId: scene._id,
                eventDate: now,
                riskLevel,
                riskScore,
                floodAreaKm2,
                floodPctDistrict: floodPct,
                affectedPopEst: affectedPop,
                confidenceScore: 0.72,
                detectionMethod: 'WEATHER_ESTIMATE',   // Clear provenance: not satellite pixel detection
                changeFromPrevKm2: changeFromPrev,
                floodGeometry: geom,                   // Now a real Polygon — renders on Flood Map
                enrichment: {
                    rainfallMm7d: rainfall7d,
                    rainfallSource: 'Open-Meteo API (live)',
                    elevationVulnIndex: elevVuln,
                    popDensityKm2: parseFloat(popDensity.toFixed(2)),
                    landCoverUrbanPct: 15,
                    landCoverAgriPct: 45,
                    jrcPermanentWaterPct: 8,
                },
                status: riskScore >= 51 ? 'active' : 'monitoring',
                metadata: {
                    source: 'open-meteo',
                    dataType: 'weather-derived-estimate',
                    lat: info.lat,
                    lon: info.lon,
                    floodBbox: bbox,
                    liveWeather: wx.current,
                    rainfallSeries: wx.rainfall.dailySeries.slice(-7),
                    riskModifier: wx.rainfallRiskModifier,
                    fetchedAt: wx.fetchedAt,
                },
            });

            results.push({
                district: info.name,
                riskLevel,
                riskScore,
                floodAreaKm2,
                affectedPop,
                rainfall7d,
                rainfall24h,
                eventId: event._id.toString(),
            });
        }

        return NextResponse.json({
            success: true,
            source: 'Open-Meteo API — Live real-time weather data',
            eventsCreated: results.length,
            fetchedAt: now.toISOString(),
            districts: results,
        });

    } catch (err) {
        console.error('Live ingest error:', err);
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}
