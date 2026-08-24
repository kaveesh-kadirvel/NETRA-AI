'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import { formatDateTime } from '@/lib/utils/formatters';
import {
    CloudRain, Thermometer, Droplets, AlertTriangle,
    Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle, Eye, Clock,
} from 'lucide-react';

const RISK_COLOR: Record<string, string> = {
    EXTREME: '#EF4444', HIGH: '#F97316', MEDIUM: '#D97706', LOW: '#10B981',
};

function WeatherIcon({ code, size = 14 }: { code: number; size?: number }) {
    if (code === 0) return <Sun size={size} color="#F59E0B" />;
    if (code <= 3)  return <Cloud size={size} color="#94A3B8" />;
    if (code <= 49) return <Eye size={size} color="#64748B" />;
    if (code <= 65) return <CloudRain size={size} color="#0891B2" />;
    if (code <= 77) return <CloudSnow size={size} color="#BAE6FD" />;
    if (code <= 82) return <CloudDrizzle size={size} color="#38BDF8" />;
    if (code <= 99) return <CloudLightning size={size} color="#6366F1" />;
    return <Thermometer size={size} color="#F97316" />;
}

export default function WeatherPanel() {
    const { data, isLoading, error } = useSWR('/api/realtime/weather', fetcher, {
        refreshInterval: 1800000,
    });

    if (isLoading) {
        return (
            <div style={{
                background: 'white', border: '1px solid #E2E8F0',
                borderRadius: 16, overflow: 'hidden',
            }}>
                <div style={{ height: 3, background: '#0369A1' }} />
                <div style={{ height: 300, background: '#F8FAFC', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
        );
    }

    if (error || !data?.success) {
        return (
            <div style={{
                background: 'white', border: '1px solid #FED7AA',
                borderRadius: 16, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <AlertTriangle size={14} color="#F97316" />
                <span style={{ fontSize: 12, color: '#9A3412', fontWeight: 600 }}>
                    Weather data offline.
                </span>
            </div>
        );
    }

    const districts = data.districts ?? [];
    const { summary } = data;

    return (
        <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: '#0369A112', color: '#0369A1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <CloudRain size={16} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', flex: 1, letterSpacing: '-0.01em' }}>Precipitation</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} color="#94A3B8" />
                        <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
                            {formatDateTime(data.timestamp)}
                        </span>
                    </div>
                </div>

                {/* Summary strip */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8, marginBottom: 14,
                    background: '#F0F9FF', borderRadius: 10, padding: '10px 12px',
                    border: '1px solid #BAE6FD',
                }}>
                    {[
                        { label: '7d Avg', val: `${summary?.avgRainfall7dMm ?? '—'}mm`, icon: Droplets, color: '#0369A1' },
                        { label: '24h Max', val: `${summary?.maxRainfall24hMm ?? '—'}mm`, icon: CloudRain, color: '#0891B2' },
                        { label: 'Avg Temp', val: `${summary?.avgTempC ?? '—'}°C`, icon: Thermometer, color: '#F97316' },
                    ].map(({ label, val, icon: Icon, color }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <Icon size={12} color={color} style={{ display: 'block', margin: '0 auto 3px' }} />
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{val}</div>
                            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* District list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {districts.slice(0, 5).map((d: any) => {
                        const riskMod = d.rainfallRiskModifier;
                        const riskColor = RISK_COLOR[riskMod?.level ?? 'LOW'] ?? '#10B981';
                        return (
                            <div key={d.district} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 10,
                                border: `1px solid ${riskColor}20`,
                                background: `${riskColor}06`,
                            }}>
                                <WeatherIcon code={d.current?.weatherCode ?? 0} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {d.district}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>
                                        {d.current?.tempC?.toFixed(1) ?? '—'}°C · {d.current?.humidity ?? '—'}% RH
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                                        {d.rainfall?.last24h?.toFixed(1) ?? 0}mm
                                    </div>
                                    <span style={{
                                        fontSize: 8, fontWeight: 800, color: riskColor,
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                    }}>
                                        {riskMod?.level ?? 'LOW'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
