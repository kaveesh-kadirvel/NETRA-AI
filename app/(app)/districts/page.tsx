'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import RiskBadge from '@/components/shared/RiskBadge';
import { formatArea, formatDate, formatPopulation } from '@/lib/utils/formatters';
import {
    Search, ArrowRight, Droplets, Users,
    Activity, LayoutGrid, List, Building2,
} from 'lucide-react';
import Link from 'next/link';

const RISK_COLOR: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH:     '#F97316',
    MEDIUM:   '#D97706',
    LOW:      '#10B981',
};
const RISK_BG: Record<string, string> = {
    CRITICAL: '#FEF2F2',
    HIGH:     '#FFF7ED',
    MEDIUM:   '#FFFBEB',
    LOW:      '#F0FDF4',
};

/* ── Skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
    return (
        <div style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: 14, height: 148,
            animation: 'pulse 1.5s ease-in-out infinite',
        }} />
    );
}

/* ── District card (grid) ─────────────────────────────── */
function DistrictCard({ d }: { d: any }) {
    const riskColor = RISK_COLOR[d.currentRiskLevel] ?? '#64748B';
    const riskBg    = RISK_BG[d.currentRiskLevel]   ?? '#F8FAFC';
    const metrics = [
        { label: 'Area',       val: formatArea(d.areaKm2 ?? 0),        icon: Droplets },
        { label: 'Population', val: formatPopulation(d.population2020 ?? 0), icon: Users    },
        { label: 'Events',     val: String(d.totalEventsCount ?? 0),    icon: Activity  },
    ];

    return (
        <Link href={`/districts/${d._id}`} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    background: 'white', border: '1px solid #E2E8F0',
                    borderRadius: 14, padding: '16px 18px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = riskColor + '60';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${riskColor}10`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {/* Left accent */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 3, background: riskColor,
                    borderRadius: '14px 0 0 14px',
                }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingLeft: 8 }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.districtName}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                            {d.stateName}
                        </div>
                    </div>
                    <RiskBadge level={d.currentRiskLevel} />
                </div>

                {/* Metrics */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 8, paddingLeft: 8, paddingTop: 8,
                    borderTop: '1px solid #F1F5F9',
                }}>
                    {metrics.map(m => (
                        <div key={m.label}>
                            <div style={{ fontSize: 9, color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                                {m.label}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{m.val}</div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9',
                }}>
                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
                        {d.lastAssessedAt ? `Updated ${formatDate(d.lastAssessedAt)}` : 'Awaiting data'}
                    </span>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 700, color: '#0D7377',
                    }}>
                        View
                        <ArrowRight size={12} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ── District row (list) ─────────────────────────────── */
function DistrictRow({ d }: { d: any }) {
    const riskColor = RISK_COLOR[d.currentRiskLevel] ?? '#64748B';
    return (
        <Link href={`/districts/${d._id}`} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    background: 'white', border: '1px solid #E2E8F0',
                    borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer', transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = riskColor + '50';
                    e.currentTarget.style.background = '#FAFBFD';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = 'white';
                }}
            >
                <div style={{ flex: '0 0 180px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{d.districtName}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>{d.stateName}</div>
                </div>
                <div style={{ flex: '0 0 100px' }}>
                    <RiskBadge level={d.currentRiskLevel} />
                </div>
                <div style={{ flex: 1, fontSize: 12, color: '#475569', fontWeight: 600 }}>{formatArea(d.areaKm2 ?? 0)}</div>
                <div style={{ flex: 1, fontSize: 12, color: '#475569', fontWeight: 600 }}>{formatPopulation(d.population2020 ?? 0)}</div>
                <div style={{ flex: '0 0 60px', fontSize: 12, fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>
                    {d.totalEventsCount ?? 0}
                </div>
                <div style={{ flex: '0 0 130px', fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                    {d.lastAssessedAt ? formatDate(d.lastAssessedAt) : '—'}
                </div>
                <ArrowRight size={14} color="#CBD5E1" />
            </div>
        </Link>
    );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function DistrictsPage() {
    const { data, isLoading } = useSWR('/api/districts', fetcher, {
        refreshInterval: 30000,
    });
    const districts: any[] = data?.districts ?? [];

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid');
    const [riskFilter, setRiskFilter]   = useState<string | null>(null);

    /* ── Derived stats ─── */
    const stats = useMemo(() => {
        const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        districts.forEach((d: any) => {
            if (d.currentRiskLevel in c) c[d.currentRiskLevel as keyof typeof c]++;
        });
        return c;
    }, [districts]);

    const filtered = useMemo(() =>
        districts.filter((d: any) => {
            const name  = (d.districtName ?? '').toLowerCase();
            const state = (d.stateName ?? '').toLowerCase();
            const q     = searchQuery.toLowerCase();
            return (name.includes(q) || state.includes(q))
                && (riskFilter ? d.currentRiskLevel === riskFilter : true);
        }),
        [districts, searchQuery, riskFilter],
    );

    const statChips = [
        { level: 'CRITICAL', label: 'Critical', count: stats.CRITICAL },
        { level: 'HIGH',     label: 'High',     count: stats.HIGH     },
        { level: 'MEDIUM',   label: 'Medium',   count: stats.MEDIUM   },
        { level: 'LOW',      label: 'Low',      count: stats.LOW      },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

            {/* ── Header ───────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Building2 size={15} color="#0D7377" />
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', margin: 0 }}>
                            District Intelligence
                        </h1>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, margin: 0 }}>
                        {districts.length} districts monitored · Bihar region
                    </p>
                </div>

                {/* View toggle */}
                <div style={{
                    display: 'flex', gap: 2, background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: 10, padding: 4,
                }}>
                    {(['grid', 'list'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            title={mode === 'grid' ? 'Grid view' : 'List view'}
                            style={{
                                width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: viewMode === mode ? 'white' : 'transparent',
                                border: viewMode === mode ? '1px solid #E2E8F0' : '1px solid transparent',
                                color: viewMode === mode ? '#0D7377' : '#94A3B8',
                                transition: 'all 0.15s',
                                boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {mode === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Risk filter chips ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {statChips.map(s => {
                    const active = riskFilter === s.level;
                    const color  = RISK_COLOR[s.level];
                    return (
                        <button
                            key={s.level}
                            onClick={() => setRiskFilter(active ? null : s.level)}
                            style={{
                                padding: '12px 16px',
                                background: active ? color : 'white',
                                border: `1px solid ${active ? color : '#E2E8F0'}`,
                                borderRadius: 12, cursor: 'pointer',
                                textAlign: 'left', transition: 'all 0.15s',
                                display: 'flex', flexDirection: 'column', gap: 4,
                                position: 'relative', overflow: 'hidden',
                            }}
                            onMouseEnter={e => {
                                if (!active) {
                                    e.currentTarget.style.borderColor = color;
                                    e.currentTarget.style.background = RISK_BG[s.level];
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.background = 'white';
                                }
                            }}
                        >
                            {/* Left bar */}
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: 3, background: color,
                                borderRadius: '12px 0 0 12px',
                                opacity: active ? 0 : 1,
                            }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: active ? 'rgba(255,255,255,0.8)' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', paddingLeft: active ? 0 : 6 }}>
                                {s.label}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, paddingLeft: active ? 0 : 6 }}>
                                <span style={{ fontSize: 22, fontWeight: 800, color: active ? 'white' : '#0F172A', lineHeight: 1 }}>
                                    {s.count}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 500, color: active ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                                    districts
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Search bar ───────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
                    <Search size={14} style={{
                        position: 'absolute', left: 13, top: '50%',
                        transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none',
                    }} />
                    <input
                        type="text"
                        placeholder="Search district or state…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 36px',
                            border: '1px solid #E2E8F0', borderRadius: 10,
                            fontSize: 13, fontWeight: 500, color: '#0F172A',
                            background: 'white', outline: 'none',
                            transition: 'border-color 0.15s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                        onFocus={e => e.target.style.borderColor = '#0D7377'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute', right: 10, top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#F1F5F9', border: 'none', borderRadius: 5,
                                fontSize: 9, fontWeight: 700, color: '#64748B',
                                padding: '2px 6px', cursor: 'pointer',
                            }}
                        >
                            ESC
                        </button>
                    )}
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                    {filtered.length} of {districts.length} shown
                </span>
            </div>

            {/* ── List view column headers ──────────────────── */}
            {viewMode === 'list' && !isLoading && (
                <div style={{
                    display: 'flex', gap: 16, padding: '0 16px',
                    borderBottom: '1px solid #F1F5F9', paddingBottom: 8,
                }}>
                    {[
                        { label: 'District',    flex: '0 0 180px' },
                        { label: 'Risk',        flex: '0 0 100px' },
                        { label: 'Area',        flex: 1 },
                        { label: 'Population',  flex: 1 },
                        { label: 'Events',      flex: '0 0 60px' },
                        { label: 'Last Update', flex: '0 0 130px' },
                    ].map(col => (
                        <div key={col.label} style={{ flex: col.flex as any, fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {col.label}
                        </div>
                    ))}
                    <div style={{ width: 14 }} />
                </div>
            )}

            {/* ── Grid / List ───────────────────────────────── */}
            {isLoading ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
                    gap: 12,
                }}>
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                /* Empty state */
                <div style={{
                    padding: '60px 40px', textAlign: 'center',
                    background: '#F8FAFC', borderRadius: 16,
                    border: '1px dashed #E2E8F0',
                }}>
                    <Search size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        No districts found
                    </h3>
                    <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, margin: '0 auto 16px' }}>
                        No districts match your current search or filter.
                    </p>
                    <button
                        onClick={() => { setSearchQuery(''); setRiskFilter(null); }}
                        style={{
                            padding: '8px 18px', background: '#0D7377', color: 'white',
                            border: 'none', borderRadius: 8, fontWeight: 700,
                            fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
                    gap: viewMode === 'grid' ? 12 : 6,
                }}>
                    {filtered.map((d: any) => (
                        viewMode === 'grid'
                            ? <DistrictCard key={d._id} d={d} />
                            : <DistrictRow  key={d._id} d={d} />
                    ))}
                </div>
            )}
        </div>
    );
}
