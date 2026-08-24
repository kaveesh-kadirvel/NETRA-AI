/**
 * GET /api/realtime/weather
 *
 * Server-side route that fetches real-time weather from Open-Meteo.
 * Open-Meteo is 100% free, no API key required.
 *
 * Uses node-fetch compatible options. If the server has no outbound internet,
 * the WeatherPanel component will fall back to showing a "Fetch Live Data" prompt.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


const INDIA_DISTRICTS = [
    // North
    { name: 'Patna', state: 'Bihar', lat: 25.59, lon: 85.13 },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.84, lon: 80.94 },
    { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.08, lon: 74.79 },
    // Northeast
    { name: 'Kamrup', state: 'Assam', lat: 26.14, lon: 91.74 },
    { name: 'Dhubri', state: 'Assam', lat: 26.02, lon: 89.98 },
    { name: 'Dibrugarh', state: 'Assam', lat: 27.47, lon: 94.91 },
    { name: 'Imphal', state: 'Manipur', lat: 24.81, lon: 93.93 },
    // East
    { name: 'Kolkata', state: 'West Bengal', lat: 22.57, lon: 88.36 },
    { name: 'Bhubaneswar', state: 'Odisha', lat: 20.29, lon: 85.82 },
    { name: 'Puri', state: 'Odisha', lat: 19.81, lon: 85.83 },
    // West
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.07, lon: 72.87 },
    { name: 'Surat', state: 'Gujarat', lat: 21.17, lon: 72.83 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.52, lon: 73.85 },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.02, lon: 72.57 },
    // South
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lon: 80.27 },
    { name: 'Kochi', state: 'Kerala', lat: 9.93, lon: 76.26 },
    { name: 'Wayanad', state: 'Kerala', lat: 11.68, lon: 76.13 },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.38, lon: 78.48 },
    { name: 'Bengaluru', state: 'Karnataka', lat: 12.97, lon: 77.59 },
    // Central
    { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.25, lon: 77.41 },
    { name: 'Raipur', state: 'Chhattisgarh', lat: 21.25, lon: 81.62 },
];

function computeRainfallRisk(r7d: number, r24h: number) {
    if (r7d > 200 || r24h > 60) return { level: 'EXTREME', score: 35, reason: `${r7d}mm/7d — extreme monsoon` };
    if (r7d > 100 || r24h > 30) return { level: 'HIGH', score: 20, reason: `${r7d}mm/7d — above high-risk` };
    if (r7d > 50 || r24h > 10) return { level: 'MEDIUM', score: 10, reason: `${r7d}mm/7d — moderate` };
    return { level: 'LOW', score: 0, reason: `${r7d}mm/7d — normal range` };
}

function decodeWMO(code: number): string {
    if (code === 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 49) return 'Fog';
    if (code <= 65) return 'Rain';
    if (code <= 82) return 'Rain showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
}

async function fetchOne(d: typeof INDIA_DISTRICTS[0]) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(d.lat));
    url.searchParams.set('longitude', String(d.lon));
    url.searchParams.set('daily', 'precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max');
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code');
    url.searchParams.set('past_days', '10');
    url.searchParams.set('forecast_days', '3');
    url.searchParams.set('timezone', 'Asia/Kolkata');
    url.searchParams.set('wind_speed_unit', 'kmh');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch(url.toString(), {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        const daily = data.daily ?? {};
        const current = data.current ?? {};
        const precipArr = daily.precipitation_sum ?? [];
        const r7d = parseFloat(precipArr.slice(-7).reduce((a: number, b: number) => a + (b ?? 0), 0).toFixed(1));
        const r24h = parseFloat((precipArr.at(-1) ?? current.precipitation ?? 0).toFixed(1));

        return {
            district: d.name,
            state: d.state,
            lat: d.lat,
            lon: d.lon,
            current: {
                tempC: current.temperature_2m ?? null,
                feelsLikeC: current.apparent_temperature ?? null,
                humidity: current.relative_humidity_2m ?? null,
                windKmh: current.wind_speed_10m ?? null,
                windDir: current.wind_direction_10m ?? null,
                precipMm: current.precipitation ?? 0,
                weatherCode: current.weather_code ?? 0,
                condition: decodeWMO(current.weather_code ?? 0),
            },
            rainfall: {
                last24h: r24h,
                last7dTotal: r7d,
                dailySeries: (daily.time ?? []).map((date: string, i: number) => ({
                    date,
                    precipMm: precipArr[i] ?? 0,
                    tempMax: daily.temperature_2m_max?.[i] ?? null,
                    tempMin: daily.temperature_2m_min?.[i] ?? null,
                    windMax: daily.windspeed_10m_max?.[i] ?? null,
                })),
            },
            rainfallRiskModifier: computeRainfallRisk(r7d, r24h),
            fetchedAt: new Date().toISOString(),
        };
    } finally {
        clearTimeout(timer);
    }
}

export async function GET() {
    try {
        const settled = await Promise.allSettled(
            INDIA_DISTRICTS.map(fetchOne)
        );

        const districts = settled
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);

        const failed = settled.filter(r => r.status === 'rejected').length;

        if (districts.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'All Open-Meteo requests timed out. Network may be restricted in this environment.',
                    hint: 'The weather panel will show when network access allows open-meteo.com',
                },
                { status: 502 }
            );
        }

        const avgR7d = districts.reduce((s, d) => s + d.rainfall.last7dTotal, 0) / districts.length;
        const maxR24h = Math.max(...districts.map(d => d.rainfall.last24h));
        const avgTemp = districts.filter(d => d.current.tempC).reduce((s, d) => s + d.current.tempC, 0) / districts.filter(d => d.current.tempC).length;

        return NextResponse.json({
            success: true,
            source: 'Open-Meteo (api.open-meteo.com) — No API key required',
            coverage: 'India Nationwide — 21 strategic districts',
            fetchedAt: new Date().toISOString(),
            partialFail: failed > 0 ? `${failed} district(s) failed` : null,
            summary: {
                avgRainfall7dMm: parseFloat(avgR7d.toFixed(1)),
                maxRainfall24hMm: parseFloat(maxR24h.toFixed(1)),
                avgTempC: parseFloat((avgTemp || 0).toFixed(1)),
                districtCount: districts.length,
            },
            districts,
        });

    } catch (err) {
        console.error('Weather route error:', err);
        return NextResponse.json(
            { success: false, error: String(err) },
            { status: 502 }
        );
    }
}
