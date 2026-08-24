import { NextResponse } from 'next/server';

/**
 * GET /api/realtime/fires
 *
 * Fetches active fire data from NASA FIRMS (VIIRS S-NPP + MODIS)
 * for the Assam/Northeast India bounding box.
 *
 * API Docs: https://firms.modaps.eosdis.nasa.gov/web-app-api/
 * Free, no rate limits for reasonable usage.
 */

const FIRMS_MAP_KEY = process.env.NASA_FIRM_MAP_KEY ?? '8a04f59c463002b761c0735c9ddc8c6e';

// Assam + Northeast India bounding box: west,south,east,north
const AOI = '88.0,22.0,97.5,29.5';

// FIRMS sources for fire detection
const SOURCES = [
    { id: 'VIIRS_SNPP_NRT', label: 'VIIRS S-NPP (375m)', priority: 1 },
    { id: 'MODIS_NRT', label: 'MODIS (1km)', priority: 2 },
];

const DAY_RANGES = [1, 2]; // Try last 1 day first, then 2 days

async function fetchFIRMS(source: string, days: number): Promise<any[]> {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_MAP_KEY}/${source}/${AOI}/${days}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'NETRA-AI-ClimateRisk/1.0' },
            cache: 'no-store',
        });
        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`FIRMS ${source} returned ${res.status}`);
            return [];
        }

        const csv = await res.text();
        if (!csv?.trim() || csv.startsWith('<!')) return [];

        const lines = csv.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const fires: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length < headers.length) continue;

            const row: Record<string, string> = {};
            headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

            const lat = parseFloat(row.latitude ?? row.lat ?? '0');
            const lon = parseFloat(row.longitude ?? row.lon ?? '0');
            const frp = parseFloat(row.frp ?? '0');  // Fire Radiative Power (MW)
            const conf = row.confidence ?? row.conf ?? 'n';

            if (!isFinite(lat) || !isFinite(lon)) continue;

            // Classify intensity from FRP (MW)
            let intensity: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
            if (frp >= 100) intensity = 'EXTREME';
            else if (frp >= 30) intensity = 'HIGH';
            else if (frp >= 10) intensity = 'MODERATE';
            else intensity = 'LOW';

            fires.push({
                lat,
                lon,
                frp: isFinite(frp) ? frp : 0,
                brightness: parseFloat(row.bright_ti4 ?? row.brightness ?? '0') || null,
                scan: parseFloat(row.scan ?? '1'),
                track: parseFloat(row.track ?? '1'),
                acq_date: row.acq_date ?? '',
                acq_time: row.acq_time ?? '',
                satellite: row.satellite ?? source,
                instrument: row.instrument ?? source.split('_')[0],
                confidence: conf,
                daynight: row.daynight ?? 'D',
                intensity,
                source,
            });
        }

        return fires;
    } catch (err: any) {
        clearTimeout(timeout);
        console.warn(`FIRMS fetch error (${source}):`, err.message?.slice(0, 100));
        return [];
    }
}

function deduplicateFires(fires: any[]): any[] {
    // Remove near-duplicate fires within 0.05° (~5km)
    const out: any[] = [];
    for (const f of fires) {
        const dup = out.find(
            g => Math.abs(g.lat - f.lat) < 0.05 && Math.abs(g.lon - f.lon) < 0.05
        );
        if (!dup || f.frp > dup.frp) {
            if (dup) out.splice(out.indexOf(dup), 1);
            out.push(f);
        }
    }
    return out;
}

function computeStats(fires: any[]) {
    if (!fires.length) return { total: 0, extreme: 0, high: 0, moderate: 0, low: 0, totalFRP: 0, maxFRP: 0 };
    return {
        total: fires.length,
        extreme: fires.filter(f => f.intensity === 'EXTREME').length,
        high: fires.filter(f => f.intensity === 'HIGH').length,
        moderate: fires.filter(f => f.intensity === 'MODERATE').length,
        low: fires.filter(f => f.intensity === 'LOW').length,
        totalFRP: parseFloat(fires.reduce((s, f) => s + (f.frp || 0), 0).toFixed(1)),
        maxFRP: parseFloat(Math.max(...fires.map(f => f.frp || 0)).toFixed(1)),
    };
}

export async function GET() {
    try {
        const now = new Date().toISOString();

        // Try all sources for the last 2 days
        const allFires: any[] = [];

        for (const src of SOURCES) {
            for (const days of DAY_RANGES) {
                const fires = await fetchFIRMS(src.id, days);
                if (fires.length > 0) {
                    console.log(`FIRMS: ${fires.length} fires from ${src.id} (${days}d)`);
                    allFires.push(...fires);
                    break; // Got data for this source, no need to try more days
                }
            }
        }

        const deduped = deduplicateFires(allFires);
        const stats = computeStats(deduped);

        return NextResponse.json({
            success: true,
            fetchedAt: now,
            source: 'NASA FIRMS — VIIRS S-NPP + MODIS NRT',
            coverage: 'Assam & Northeast India (88°E–97.5°E, 22°N–29.5°N)',
            fires: deduped,
            stats,
        });

    } catch (err) {
        console.error('FIRMS API error:', err);
        return NextResponse.json(
            { success: false, error: String(err), fires: [], stats: { total: 0 } },
            { status: 500 }
        );
    }
}
