'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: 'white', border: '1px solid #E2E8F0',
                borderRadius: 8, padding: '10px 14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                fontSize: 12,
            }}
        >
            <p style={{ fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span style={{ color: '#64748B' }}>{p.name}:</span>
                    <span style={{ fontWeight: 600, color: '#0A1628' }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function TrendChart() {
    const { data, isLoading } = useSWR('/api/insights/summary', fetcher, { refreshInterval: 60000 });

    if (isLoading) {
        return (
            <div style={{ height: 320, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)', borderRadius: 24 }} className="shimmer" />
        );
    }

    const trendData = (data?.trendData ?? []).map((d: any) => ({
        date: d._id?.slice(5),        // "MM-DD"
        riskScore: Math.round(d.avgRiskScore ?? 0),
        floodKm2: Math.round(d.totalFloodAreaKm2 ?? 0),
    }));

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(22px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: 24,
            padding: '24px 28px',
            boxShadow: '0 12px 48px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 8, color: '#16A34A' }}>
                    <TrendingUp size={18} />
                </div>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.02em' }}>Risk Velocity Trend</h3>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>Average risk index & Flood coverage · 30D Window</p>
                </div>
            </div>

            <div style={{ height: 220, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0D7377" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area yAxisId="left" type="monotone" dataKey="riskScore" name="Avg Risk" stroke="#0D7377" fill="url(#riskGrad)" strokeWidth={3} dot={false} />
                        <Area yAxisId="right" type="monotone" dataKey="floodKm2" name="Flood km²" stroke="#F97316" fill="url(#floodGrad)" strokeWidth={3} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#0D7377' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Composite Risk Index</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F97316' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flood Coverage (KM²)</span>
                </div>
            </div>
        </div>
    );
}
