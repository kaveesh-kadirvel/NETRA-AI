/**
 * GET /api/insights/forecast
 *
 * PS-06 R8 — Predictive Modeling
 * Forecasts flood risk for the next 72h (3 days) for all 5 Assam districts
 * using Open-Meteo's forecast_days data + the same risk scoring formula
 * used for historical events.
 *
 * No extra API key needed — Open-Meteo is free and already used in the app.
 */
import { NextResponse } from 'next/server';

const ASSAM_DISTRICTS = [
    { name: 'Kamrup', state: 'Assam', lat: 26.14, lon: 91.74, area: 1694, pop: 1513841, elevVuln: 0.62 },
    { name: 'Dhubri', state: 'Assam', lat: 26.02, lon: 89.98, area: 2838, pop: 1949258, elevVuln: 0.78 },
    { name: 'Barpeta', state: 'Assam', lat: 26.32, lon: 91.00, area: 3245, pop: 1693190, elevVuln: 0.71 },
    { name: 'Morigaon', state: 'Assam', lat: 26.25, lon: 92.33, area: 1551, pop: 957423, elevVuln: 0.55 },
    { name: 'Jorhat', state: 'Assam', lat: 26.75, lon: 94.20, area: 2851, pop: 1092256, elevVuln: 0.38 },
];

function computeRiskScore(rainfall7d: number, popDensity: number, elevVuln: number): number {
    const floodPct = Math.min((rainfall7d / 300) * 40, 100);
    const f = Math.min(floodPct / 100, 1.0);
    const p = Math.min(popDensity / 5000, 1.0);
    const e = Math.min(elevVuln, 1.0);
    const r = Math.min(rainfall7d / 300, 1.0);
    return parseFloat(((0.40 * f + 0.25 * p + 0.20 * e + 0.15 * r) * 100).toFixed(2));
}

function classifyRisk(score: number): string {
    return score >= 76 ? 'CRITICAL' : score >= 51 ? 'HIGH' : score >= 26 ? 'MEDIUM' : 'LOW';
}

async function fetchForecast(d: typeof ASSAM_DISTRICTS[0]) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(d.lat));
    url.searchParams.set('longitude', String(d.lon));
    url.searchParams.set('daily',
        'precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_probability_max');
    url.searchParams.set('current', 'temperature_2m,precipitation,weather_code');
    url.searchParams.set('past_days', '7');  // Last 7 days for rolling window
    url.searchParams.set('forecast_days', '4');  // Today + 3 forecast days
    url.searchParams.set('timezone', 'Asia/Kolkata');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch(url.toString(), { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        const daily = data.daily ?? {};
        const dates = daily.time ?? [];
        const precipArr = daily.precipitation_sum ?? [];
        const tempMaxArr = daily.temperature_2m_max ?? [];
        const precipProb = daily.precipitation_probability_max ?? [];
        const windMax = daily.windspeed_10m_max ?? [];

        // Rolling 7-day baseline from past data (indices 0–6)
        const baseline7d = precipArr.slice(0, 7).reduce((a: number, b: number) => a + (b ?? 0), 0);

        // Forecast days are the last 4 entries (today + day1, day2, day3)
        const forecastDays = precipArr.slice(-4);  // [today, +1, +2, +3]

        const popDensity = d.pop / d.area;

        // Build per-day forecast: rolling window = last 6 days + that forecast day
        const last6 = precipArr.slice(-7, -1); // 6 days before today

        const dayForecasts = forecastDays.map((dayPrecip: number, i: number) => {
            const rolling7d = parseFloat(
                ([...last6, ...forecastDays.slice(0, i + 1)].slice(-7)
                    .reduce((a: number, b: number) => a + (b ?? 0), 0)
                ).toFixed(1)
            );
            const riskScore = computeRiskScore(rolling7d, popDensity, d.elevVuln);
            const riskLevel = classifyRisk(riskScore);
            const dateIndex = dates.length - 4 + i;

            return {
                day: i === 0 ? 'Today' : `+${i}d`,
                date: dates[dateIndex] ?? null,
                forecastPrecipMm: parseFloat((dayPrecip ?? 0).toFixed(1)),
                rolling7dMm: rolling7d,
                precipProbPct: precipProb[dateIndex] ?? null,
                tempMaxC: tempMaxArr[dateIndex] ?? null,
                windMaxKmh: windMax[dateIndex] ?? null,
                riskScore,
                riskLevel,
            };
        });

        // Trend vs current-day
        const todayScore = dayForecasts[0]?.riskScore ?? 0;
        const day3Score = dayForecasts[3]?.riskScore ?? dayForecasts[dayForecasts.length - 1]?.riskScore ?? 0;
        const delta = parseFloat((day3Score - todayScore).toFixed(2));
        const trend: string = delta > 3 ? 'RISING' : delta < -3 ? 'FALLING' : 'STABLE';
        const peakDay = dayForecasts.reduce((max: any, d: any) => d.riskScore > max.riskScore ? d : max, dayForecasts[0]);

        return {
            district: d.name,
            state: d.state,
            lat: d.lat,
            lon: d.lon,
            elevVuln: d.elevVuln,
            popDensity: parseFloat(popDensity.toFixed(2)),
            baseline7dMm: parseFloat(baseline7d.toFixed(1)),
            forecast: dayForecasts,
            trend,
            delta72h: delta,
            peakRiskDay: peakDay,
            maxRiskScore: Math.max(...dayForecasts.map((d: any) => d.riskScore)),
            maxRiskLevel: classifyRisk(Math.max(...dayForecasts.map((d: any) => d.riskScore))),
        };
    } finally {
        clearTimeout(timer);
    }
}

export async function GET() {
    try {
        const settled = await Promise.allSettled(ASSAM_DISTRICTS.map(fetchForecast));

        const districts = settled
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);

        const failed = settled.filter(r => r.status === 'rejected').length;

        if (!districts.length) {
            return NextResponse.json(
                { success: false, error: 'All Open-Meteo forecast requests failed' },
                { status: 502 }
            );
        }

        // Overall AOI summary
        const risingCount = districts.filter(d => d.trend === 'RISING').length;
        const fallingCount = districts.filter(d => d.trend === 'FALLING').length;
        const criticalIn72 = districts.filter(d => d.maxRiskLevel === 'CRITICAL').length;
        const maxRisk72 = Math.max(...districts.map(d => d.maxRiskScore));

        return NextResponse.json({
            success: true,
            source: 'Open-Meteo Forecast API (forecast_days=4) — No API key required',
            generatedAt: new Date().toISOString(),
            horizon: '72 hours (3 days)',
            partialFail: failed > 0 ? `${failed} district(s) failed` : null,
            summary: {
                risingDistricts: risingCount,
                fallingDistricts: fallingCount,
                stableDistricts: districts.length - risingCount - fallingCount,
                criticalIn72h: criticalIn72,
                maxRiskScore72h: parseFloat(maxRisk72.toFixed(2)),
                overallTrend: risingCount > fallingCount ? 'WORSENING' : fallingCount > risingCount ? 'IMPROVING' : 'STABLE',
            },
            districts,
        });

    } catch (err) {
        console.error('Forecast error:', err);
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}
