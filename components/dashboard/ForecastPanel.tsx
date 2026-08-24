'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import { TrendingUp, TrendingDown, Minus, CloudRain, Droplets, AlertTriangle } from 'lucide-react';

/* ── Risk colours ─────────────────────────────────────────── */
const RISK_COLOR: Record<string, string> = {
    CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E',
};

/* ── Trend config ─────────────────────────────────────────── */
const TREND_CFG = {
    RISING: { icon: TrendingUp, color: '#EF4444', bg: '#FEF2F2', label: 'Risk Rising', border: '#FECACA' },
    FALLING: { icon: TrendingDown, color: '#22C55E', bg: '#F0FDF4', label: 'Risk Falling', border: '#BBF7D0' },
    STABLE: { icon: Minus, color: '#94A3B8', bg: '#F8FAFC', label: 'Risk Stable', border: '#E2E8F0' },
};

/* ── Day forecast chip ────────────────────────────────────── */
function DayChip({ day, riskLevel, riskScore, precipMm, precipProb }: {
    day: string; riskLevel: string; riskScore: number;
    precipMm: number; precipProb: number | null;
}) {
    const color = RISK_COLOR[riskLevel] ?? '#94A3B8';
    return (
        <div style={{
            flex: 1, minWidth: 0,
            background: `${color}0D`,
            border: `1.5px solid ${color}35`,
            borderTop: `3px solid ${color}`,
            borderRadius: 10, padding: '10px 12px',
            textAlign: 'center' as const,
        }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', marginBottom: 5 }}>
                {day}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1, marginBottom: 3 }}>
                {riskScore.toFixed(0)}
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: '0.07em', marginBottom: 7 }}>
                {riskLevel}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <CloudRain size={9} color="#0891B2" />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>
                    {precipMm.toFixed(1)} mm
                </span>
            </div>
            {precipProb !== null && (
                <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>
                    {precipProb}% chance
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   FORECAST PANEL — PS-06 R8 (Predictive Modeling)
   72-hour flood risk forecast for all Assam districts
═══════════════════════════════════════════════════════════ */
export default function ForecastPanel() {
    const { data, isLoading, error } = useSWR('/api/insights/forecast', fetcher, {
        refreshInterval: 1_800_000, // 30 min — forecast data changes slowly
    });

    /* Loading */
    if (isLoading) {
        return (
            <div className="glass-card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={15} color="#7C3AED" />
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>72-Hour Flood Risk Forecast</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="shimmer" style={{ height: 130, borderRadius: 10 }} />
                    ))}
                </div>
            </div>
        );
    }

    /* Error */
    if (error || !data?.success) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 10, padding: '12px 16px',
            }}>
                <AlertTriangle size={14} color="#EF4444" />
                <span style={{ fontSize: 12, color: '#DC2626' }}>
                    Forecast unavailable — Open-Meteo may be unreachable.
                </span>
            </div>
        );
    }

    const { summary, districts } = data;

    const overallTrendCfg = TREND_CFG[summary.overallTrend === 'WORSENING'
        ? 'RISING' : summary.overallTrend === 'IMPROVING' ? 'FALLING' : 'STABLE'];
    const OverallIcon = overallTrendCfg.icon;

    return (
        <div className="glass-card" style={{ padding: '18px 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={15} color="#7C3AED" />
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>
                            72-Hour Flood Risk Forecast
                        </h3>
                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                            AI risk projection · Open-Meteo forecast rainfall · Assam Districts
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* AOI Trend pill */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 8,
                        background: overallTrendCfg.bg,
                        border: `1px solid ${overallTrendCfg.border}`,
                    }}>
                        <OverallIcon size={12} color={overallTrendCfg.color} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: overallTrendCfg.color }}>
                            {summary.overallTrend}
                        </span>
                    </div>
                    {summary.criticalIn72h > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 8,
                            background: '#FEF2F2', border: '1px solid #FECACA',
                        }}>
                            <AlertTriangle size={11} color="#EF4444" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                                {summary.criticalIn72h} CRITICAL in 72h
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary strip */}
            <div style={{
                display: 'flex', gap: 10, marginBottom: 14,
                background: '#F5F3FF', borderRadius: 8, padding: '8px 14px',
                border: '1px solid #DDD6FE',
            }}>
                {[
                    { label: 'Rising Zones', val: summary.risingDistricts, color: '#DC2626' },
                    { label: 'Stable Zones', val: summary.stableDistricts, color: '#0369A1' },
                    { label: 'Falling Zones', val: summary.fallingDistricts, color: '#16A34A' },
                    { label: 'Peak Score 72h', val: summary.maxRiskScore72h.toFixed(1), color: '#7C3AED' },
                ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
                    </div>
                ))}
            </div>

            {/* Per-district forecast cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {districts.map((d: any) => {
                    const trendCfg = TREND_CFG[d.trend] ?? TREND_CFG.STABLE;
                    const TrendIcon = trendCfg.icon;
                    const forecastDays = d.forecast ?? [];

                    return (
                        <div
                            key={d.district}
                            style={{
                                background: '#FAFBFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 12, padding: '14px 16px',
                            }}
                        >
                            {/* District header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>
                                        {d.district}
                                    </div>
                                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{d.state}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {/* Trend badge */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '3px 10px', borderRadius: 6,
                                        background: trendCfg.bg,
                                        border: `1px solid ${trendCfg.border}`,
                                    }}>
                                        <TrendIcon size={10} color={trendCfg.color} />
                                        <span style={{ fontSize: 10, fontWeight: 700, color: trendCfg.color }}>
                                            {trendCfg.label}
                                        </span>
                                        <span style={{ fontSize: 10, color: trendCfg.color }}>
                                            ({d.delta72h > 0 ? '+' : ''}{d.delta72h.toFixed(1)})
                                        </span>
                                    </div>
                                    {/* Baseline rainfall */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Droplets size={10} color="#0369A1" />
                                        <span style={{ fontSize: 10, color: '#64748B' }}>
                                            {d.baseline7dMm} mm/7d baseline
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Day chips */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                {forecastDays.map((day: any) => (
                                    <DayChip
                                        key={day.day}
                                        day={day.day}
                                        riskLevel={day.riskLevel}
                                        riskScore={day.riskScore}
                                        precipMm={day.forecastPrecipMm}
                                        precipProb={day.precipProbPct}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PS-06 compliance note */}
            <div style={{
                marginTop: 14, paddingTop: 12,
                borderTop: '1px solid #F1F5F9',
                fontSize: 10, color: '#94A3B8', lineHeight: 1.7,
            }}>
                <strong style={{ color: '#7C3AED' }}>PS-06 R8 — Predictive Modeling:</strong>{' '}
                72-hour risk forecasts computed by applying the weighted ensemble formula
                (flood_pct × 0.40 + pop_density × 0.25 + elev_vuln × 0.20 + rainfall × 0.15)
                to Open-Meteo's 3-day precipitation forecast, updated every 30 minutes.
            </div>
        </div>
    );
}
