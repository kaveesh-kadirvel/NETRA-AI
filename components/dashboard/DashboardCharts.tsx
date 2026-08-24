'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell,
    LineChart, Line, Area, AreaChart,
} from 'recharts';
import { BarChart2, PieChart as PieIcon, TrendingUp } from 'lucide-react';

const HEALTH_COLORS: Record<string, string> = {
    POOR: '#EF4444',
    FAIR: '#F97316',
    GOOD: '#D97706',
    EXCELLENT: '#10B981',
};
const FALLBACK = ['#0D7377', '#0891B2', '#6366F1', '#F97316', '#EC4899', '#10B981'];

function CardShell({ children, title, icon: Icon, accent = '#0D7377' }: {
    children: React.ReactNode; title: string; icon: any; accent?: string;
}) {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 20,
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: `${accent}12`, color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={16} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</span>
            </div>
            {children}
        </div>
    );
}

const tooltipStyle = {
    background: 'white',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 11,
    color: '#0F172A',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

/* ── Health Distribution Donut ─────────────────────── */
function HealthDonut({ data }: { data: any[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const withColor = data.map((d, i) => ({
        ...d,
        color: HEALTH_COLORS[d.name] ?? FALLBACK[i % FALLBACK.length],
        pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));

    return (
        <CardShell title="Field Health Overview (Khet Ki Sehat)" icon={PieIcon} accent="#10B981">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 160, height: 160, position: 'relative', flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={withColor} cx="50%" cy="50%"
                                innerRadius="52%" outerRadius="78%"
                                paddingAngle={3} dataKey="value" strokeWidth={0}
                            >
                                {withColor.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none',
                    }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{total}</div>
                        <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>plots</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {withColor.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#475569', fontWeight: 500, flex: 1 }}>{item.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{item.value}</span>
                            <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, width: 28, textAlign: 'right' }}>{item.pct}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </CardShell>
    );
}

/* ── Trend Line ────────────────────────────────── */
function TrendLine({ data }: { data: any[] }) {
    return (
        <CardShell title="Crop Health Over Time" icon={TrendingUp} accent="#0ea5e9">
            <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                        <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} dy={6} />
                        <YAxis axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} domain={[0, 100]} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="avgHealthScore" name="Health Score"
                            stroke="#0ea5e9" strokeWidth={2} fill="url(#riskGrad)" dot={false} activeDot={{ r: 4, fill: '#0ea5e9' }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </CardShell>
    );
}

/* ── District Bar Chart ──────────────────────── */
function DistrictBars({ data }: { data: any[] }) {
    return (
        <CardShell title="Fields That Need Urgent Attention 🚨" icon={BarChart2} accent="#6366F1">
            <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" horizontal={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} domain={[0, 100]}
                            tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} width={80} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="healthScore" name="Health Score" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </CardShell>
    );
}

/* ── Default Export ───────────────────────────── */
export default function DashboardCharts() {
    const { data: summaryData } = useSWR('/api/insights/summary', fetcher, { refreshInterval: 60000 });

    const charts = useMemo(() => {
        const healthBreakdown = summaryData?.healthBreakdown ?? [];
        let incidentData = healthBreakdown.length > 0
            ? healthBreakdown.map((rb: any) => ({ name: rb._id ?? 'UNKNOWN', value: rb.count }))
            : []; // Will be empty until seeded

        const trendData = (summaryData?.trendData ?? []).slice(-10).map((td: any, i: number) => ({
            name: `D${i + 1}`,
            avgHealthScore: td.avgHealthScore ?? 0,
        }));

        const barData = (summaryData?.topFarms ?? []).slice(0, 6).map((f: any) => ({
            name: f.farmName?.slice(0, 10) || 'Plot',
            healthScore: Math.round(f.healthScore ?? 0),
        })).sort((a: any, b: any) => a.healthScore - b.healthScore); // Sort by lowest score

        return { incidentData, trendData, barData };
    }, [summaryData]);

    const isLoading = !summaryData;

    if (isLoading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        height: 260, background: '#F8FAFC',
                        border: '1px solid #E2E8F0', borderRadius: 16,
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <HealthDonut data={charts.incidentData} />
            <TrendLine data={charts.trendData} />
            <div style={{ gridColumn: 'span 2' }}>
                <DistrictBars data={charts.barData} />
            </div>
        </div>
    );
}
