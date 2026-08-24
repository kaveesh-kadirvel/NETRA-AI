'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';

/* ──────────────────────────────────────────────────────
   PREMIUM KPI STAT CARD
   Large emoji icon · Hindi subtitle · colour-coded border
────────────────────────────────────────────────────── */
function StatCard({
    emoji, label, hindiLabel, value, sub,
    color, borderColor, bg, trend,
}: {
    emoji: string; label: string; hindiLabel: string;
    value: string | number; sub: string;
    color: string; borderColor: string; bg: string;
    trend?: string;
}) {
    return (
        <div style={{
            background: 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: 20,
            padding: '20px 22px',
            display: 'flex', flexDirection: 'column', gap: 10,
            transition: 'all 0.18s ease',
            cursor: 'default',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            position: 'relative', overflow: 'hidden',
        }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = `0 8px 24px ${color}20`;
                el.style.borderColor = color + '60';
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                el.style.borderColor = borderColor;
            }}
        >
            {/* Decorative background blob */}
            <div style={{
                position: 'absolute', right: -10, top: -10,
                width: 70, height: 70, borderRadius: '50%',
                background: bg, opacity: 0.6, pointerEvents: 'none',
            }} />

            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', marginBottom: 1 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: 10, color: color, fontWeight: 600 }}>{hindiLabel}</div>
                </div>
                <div style={{
                    width: 42, height: 42, borderRadius: 13,
                    background: bg, border: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                }}>
                    {emoji}
                </div>
            </div>

            {/* Value */}
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {value}
            </div>

            {/* Sub + trend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sub}
                </div>
                {trend && (
                    <div style={{ fontSize: 10, fontWeight: 800, color, background: bg, borderRadius: 6, padding: '2px 8px', border: `1px solid ${borderColor}` }}>
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{
            background: 'linear-gradient(90deg, #F1F5F9, #E2E8F0, #F1F5F9)',
            borderRadius: 20, height: 128,
            animation: 'shimmer 1.5s ease-in-out infinite',
            backgroundSize: '200% 100%',
        }} />
    );
}

export default function StatsGrid() {
    const { data, isLoading } = useSWR('/api/insights/latest?limit=100', fetcher, { refreshInterval: 60000 });

    const totalFarms   = data?.totalEvents ?? 0;
    const breakdown    = data?.breakdown ?? {};
    const totalWaterL  = Math.round(breakdown.totalWaterDeficit ?? 0);
    const totalNitroKg = Math.round(breakdown.totalNitrogenReq ?? 0);
    const avgScore     = Math.round(breakdown.avgHealthScore ?? 0);

    // Format water: show in K-litres if large
    const waterDisplay = totalWaterL >= 1000
        ? `${(totalWaterL / 1000).toFixed(1)}K L`
        : `${totalWaterL.toLocaleString()} L`;

    const healthColor  = avgScore >= 70 ? '#16A34A' : avgScore >= 40 ? '#D97706' : '#DC2626';
    const healthEmoji  = avgScore >= 70 ? '💚' : avgScore >= 40 ? '⚠️' : '🔴';
    const healthHindi  = avgScore >= 70 ? 'Fasal achhi hai' : avgScore >= 40 ? 'Dhyan dena hoga' : 'Turant action lo!';

    if (isLoading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard
                emoji="🗺️"
                label="Farms Being Watched"
                hindiLabel="Monitored Khet"
                value={totalFarms}
                sub="Active fields tracked"
                color="#0D7377"
                borderColor="#99F6E4"
                bg="#F0FDFA"
                trend="LIVE"
            />
            <StatCard
                emoji="💧"
                label="Fields Needing Water"
                hindiLabel="Paani ki zaroorat"
                value={waterDisplay}
                sub="Water shortage today"
                color="#0369A1"
                borderColor="#BAE6FD"
                bg="#EFF6FF"
            />
            <StatCard
                emoji="🌱"
                label="Fertilizer (Khad) Needed"
                hindiLabel="Nitrogen ki kami"
                value={`${totalNitroKg.toLocaleString()} KG`}
                sub="Nitrogen shortage in crops"
                color="#7C3AED"
                borderColor="#DDD6FE"
                bg="#F5F3FF"
            />
            <StatCard
                emoji={healthEmoji}
                label="Overall Crop Health"
                hindiLabel={healthHindi}
                value={`${avgScore}/100`}
                sub="How well fields are doing"
                color={healthColor}
                borderColor={`${healthColor}40`}
                bg={`${healthColor}12`}
            />
            <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        </div>
    );
}
