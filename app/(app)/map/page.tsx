'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import {
    RefreshCw, Satellite, Sun, Moon,
    Droplets, FlaskConical, Layers,
    Activity, AlertTriangle, CheckCircle, Circle, Map,
    Tractor, ShieldCheck, Eye, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MissionDispatchModal from '@/components/studio/MissionDispatchModal';
import AiSafetyMonitor from '@/components/shared/AiSafetyMonitor';

/* ── Dynamic map (SSR-off) ─────────────────────── */
const FarmMap = dynamic(() => import('@/components/map/FloodMap'), {
    ssr: false,
    loading: () => (
        <div style={{
            height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#F8FAFC',
            flexDirection: 'column', gap: 12,
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid #E2E8F0', borderTopColor: '#0D7377',
                animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Loading map…</span>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>
    ),
});

type TileMode   = 'satellite' | 'light' | 'dark';
type RiskFilter = 'ALL' | 'CRITICAL' | 'MEDIUM' | 'LOW';
type ViewMode   = 'farmer' | 'expert';

const RISK_COLOR: Record<string, string> = {
    CRITICAL: '#DC2626', MEDIUM: '#D97706', LOW: '#16A34A',
};
const RISK_BG: Record<string, string> = {
    CRITICAL: '#FEF2F2', MEDIUM: '#FFFBEB', LOW: '#F0FDF4',
};
const RISK_BORDER: Record<string, string> = {
    CRITICAL: '#FECACA', MEDIUM: '#FDE68A', LOW: '#BBF7D0',
};
const RISK_LABEL: Record<string, string> = {
    CRITICAL: 'Needs Urgent Help!', MEDIUM: 'Needs Attention', LOW: 'Healthy', ALL: 'All Fields',
};
const RISK_LABEL_EXPERT: Record<string, string> = {
    CRITICAL: 'Critical', MEDIUM: 'Medium', LOW: 'Low', ALL: 'All Fields',
};

function getRisk(score: number): string {
    if (score < 25) return 'CRITICAL';
    if (score < 50) return 'MEDIUM';
    return 'LOW';
}

function RiskIcon({ level, size = 12 }: { level: string; size?: number }) {
    const color = RISK_COLOR[level] ?? '#64748B';
    if (level === 'CRITICAL') return <AlertTriangle size={size} color={color} />;
    if (level === 'MEDIUM')   return <Circle size={size} color={color} fill={color} />;
    return <CheckCircle size={size} color={color} />;
}

/* ── FARMER MODE BADGE ────────────────────────── */
function FarmerBadge({ level }: { level: string }) {
    const msgs: Record<string, { emoji: string; text: string; color: string; bg: string }> = {
        CRITICAL: { emoji: '🚨', text: 'Aapke khet ko abhi madad chahiye!', color: '#991B1B', bg: '#FEF2F2' },
        MEDIUM:   { emoji: '⚠️', text: 'Is khet ko paani ya khad chahiye', color: '#92400E', bg: '#FFFBEB' },
        LOW:      { emoji: '✅', text: 'Yeh khet bilkul theek hai!',        color: '#166534', bg: '#F0FDF4' },
    };
    const m = msgs[level] ?? msgs.LOW;
    return (
        <div style={{ background: m.bg, border: `1px solid ${m.color}30`, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{m.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.text}</span>
        </div>
    );
}

/* ── FILTER CHIP ──────────────────────────────── */
function FilterChip({ level, count, active, onClick, viewMode }: {
    level: string; count: number; active: boolean; onClick: () => void; viewMode: ViewMode;
}) {
    const color  = level === 'ALL' ? '#0D7377' : RISK_COLOR[level];
    const bg     = active ? color : 'white';
    const border = active ? color : '#E2E8F0';
    const label  = viewMode === 'farmer'
        ? (level === 'ALL' ? 'All' : level === 'CRITICAL' ? 'Urgent' : level === 'MEDIUM' ? 'Needs Help' : 'Healthy')
        : (RISK_LABEL_EXPERT[level] ?? level);

    return (
        <button onClick={onClick} style={{
            flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
            background: bg, border: `1px solid ${border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            transition: 'all 0.15s', fontFamily: 'inherit',
        }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: active ? 'white' : '#0F172A', lineHeight: 1 }}>
                {count}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: active ? 'rgba(255,255,255,0.85)' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </span>
        </button>
    );
}

/* ── FARM LIST ROW ────────────────────────────── */
function FarmListRow({ event, selected, onSelect, viewMode }: {
    event: any; selected: boolean; onSelect: (id: string) => void; viewMode: ViewMode;
}) {
    const level = getRisk(event.healthScore);
    const color = RISK_COLOR[level];

    return (
        <div onClick={() => onSelect(event._id)} style={{
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: selected ? '#F0FDFA' : 'transparent',
            border: `1px solid ${selected ? '#99F6E4' : 'transparent'}`,
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.12s', marginBottom: 2,
        }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: RISK_BG[level], border: `1px solid ${RISK_BORDER[level]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <RiskIcon level={level} size={14} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.farmId?.farmName || 'Unknown Farm'}
                </div>
                {viewMode === 'farmer' ? (
                    <div style={{ fontSize: 10, color: color, fontWeight: 700, marginTop: 1 }}>
                        {RISK_LABEL[level]}
                    </div>
                ) : (
                    <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>
                        {event.farmId?.cropType || '—'} · Score: {event.healthScore}/100
                    </div>
                )}
            </div>

            <div style={{
                background: RISK_BG[level], border: `1px solid ${RISK_BORDER[level]}`,
                borderRadius: 6, padding: '3px 7px', flexShrink: 0,
            }}>
                <span style={{ fontSize: 11, fontWeight: 800, color }}>{event.healthScore}</span>
            </div>
        </div>
    );
}

/* ── FARM DETAIL BAR ──────────────────────────── */
function FarmDetailBar({ event, onDispatch, viewMode }: { event: any; onDispatch: (t: any) => void; viewMode: ViewMode }) {
    const level = getRisk(event.healthScore);
    const area  = event.farmId?.areaSqm ? (event.farmId.areaSqm / 10000).toFixed(2) + ' Ha' : '—';
    const water = event.waterDeficitLiters ? Math.round(event.waterDeficitLiters).toLocaleString() + ' L' : '—';
    const khad  = event.nitrogenReqKg ? Math.round(event.nitrogenReqKg) + ' KG' : '—';
    const color = RISK_COLOR[level];

    return (
        <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: 14,
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexWrap: 'wrap',
        }}>
            {/* Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: RISK_BG[level], border: `1px solid ${RISK_BORDER[level]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <RiskIcon level={level} size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.farmId?.farmName || 'Unknown Farm'}
                    </div>
                    {viewMode === 'farmer' ? (
                        <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 3 }}>
                            {RISK_LABEL[level]}
                        </div>
                    ) : (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {event.farmId?.cropType || 'Crop'} · <span style={{ color, fontWeight: 700 }}>{RISK_LABEL_EXPERT[level]} · {event.healthScore}/100</span>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === 'farmer' && (
                <FarmerBadge level={level} />
            )}

            <div style={{ width: 1, alignSelf: 'stretch', background: '#F1F5F9' }} />

            {/* Metrics */}
            {[
                { Icon: Map,          label: viewMode === 'farmer' ? 'Khet Ka Rukba' : 'Farm Area',  val: area  },
                { Icon: Droplets,     label: viewMode === 'farmer' ? 'Paani Chahiye' : 'Water Need', val: water },
                { Icon: FlaskConical, label: viewMode === 'farmer' ? 'Khad Chahiye'  : 'Fertilizer', val: khad  },
            ].map(({ Icon, label, val }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
                    <Icon size={14} color="#94A3B8" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{label}</div>
                </div>
            ))}

            <div style={{ width: 1, alignSelf: 'stretch', background: '#F1F5F9' }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => onDispatch({ type: 'irrigation', event })} style={{
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    borderRadius: 10, padding: '9px 14px', cursor: 'pointer',
                    color: '#1D4ED8', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#DBEAFE'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; }}
                >
                    <Droplets size={13} /> {viewMode === 'farmer' ? 'Paani Bhejo' : 'Send Water'}
                </button>
                <button onClick={() => onDispatch({ type: 'fertilizer', event })} style={{
                    background: '#0D7377', border: 'none',
                    borderRadius: 10, padding: '9px 14px', cursor: 'pointer',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                    boxShadow: '0 3px 10px rgba(13,115,119,0.3)', transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0f9094'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0D7377'; }}
                >
                    <FlaskConical size={13} /> {viewMode === 'farmer' ? 'Khad Lagao' : 'Apply Fertilizer'}
                </button>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function GeospatialMapPage() {
    const { data: floodData, mutate } = useSWR('/api/insights/latest?limit=100', fetcher, { refreshInterval: 60_000 });
    const allEvents: any[] = floodData?.events ?? [];

    const [riskFilter, setRiskFilter]       = useState<RiskFilter>('ALL');
    const [tileMode, setTileMode]           = useState<TileMode>('satellite');
    const [refreshing, setRefreshing]       = useState(false);
    const [selectedId, setSelectedId]       = useState<string | null>(null);
    const [missionOpen, setMissionOpen]     = useState(false);
    const [missionPayload, setMissionPayload] = useState<any>(null);
    const [viewMode, setViewMode]           = useState<ViewMode>('farmer');
    const [showTractor, setShowTractor]     = useState(false);

    const counts = useMemo(() => {
        const c = { CRITICAL: 0, MEDIUM: 0, LOW: 0 };
        allEvents.forEach(e => {
            const l = getRisk(e.healthScore);
            if (l in c) c[l as keyof typeof c]++;
        });
        return c;
    }, [allEvents]);

    const events = useMemo(() =>
        riskFilter === 'ALL' ? allEvents : allEvents.filter(e => getRisk(e.healthScore) === riskFilter),
        [allEvents, riskFilter]
    );

    const selectedEvent = useMemo(() =>
        allEvents.find(e => e._id === selectedId) || events[0],
        [allEvents, selectedId, events]
    );

    const totalHa = (allEvents.reduce((s, e) => s + (e.farmId?.areaSqm ?? 0), 0) / 10000).toFixed(1);

    const handleRefresh = async () => {
        setRefreshing(true);
        await mutate();
        setRefreshing(false);
        toast.success('Map refreshed');
    };

    function openDispatch({ type, event }: { type: 'fertilizer' | 'irrigation'; event: any }) {
        const level = getRisk(event.healthScore);
        setMissionPayload({
            farmName:   event.farmId?.farmName || 'Selected Field',
            farmId:     event._id,
            actionType: type,
            healthScore: event.healthScore,
            area:       event.farmId?.areaSqm ? (event.farmId.areaSqm / 10000).toFixed(2) + ' Ha' : undefined,
            quantity:   type === 'fertilizer' ? '60–80 kg/ha Urea' : '20–40mm water',
            riskLevel:  level,
            lat:        event.farmId?.geometry?.coordinates?.[1],
            lng:        event.farmId?.geometry?.coordinates?.[0],
        });
        setMissionOpen(true);
    }

    const isFarmer = viewMode === 'farmer';

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ── HEADER ─────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                {/* Title */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Map size={17} color="#0D7377" />
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                            {isFarmer ? 'Apne Khet Ka Haal Dekho 🌾' : 'India Farm Map'}
                        </h1>
                        <div style={{
                            background: '#F0FDF4', border: '1px solid #BBF7D0',
                            borderRadius: 6, padding: '2px 8px',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>Live</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, margin: '3px 0 0' }}>
                        {isFarmer
                            ? `${allEvents.length} khet dekhe ja rahe hain · ${totalHa} Hectare`
                            : `${allEvents.length} farm plots · ${totalHa} Ha · Sentinel-1 + 2`}
                    </p>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                    {/* ── FARMER / EXPERT MODE TOGGLE ── */}
                    <div style={{
                        display: 'flex', gap: 0, background: '#0A1628',
                        border: '1px solid #1E3A5F', borderRadius: 12, padding: 3, overflow: 'hidden',
                    }}>
                        {([
                            { mode: 'farmer', icon: Users,      label: 'Farmer Mode' },
                            { mode: 'expert', icon: ShieldCheck, label: 'Expert Mode' },
                        ] as { mode: ViewMode; icon: any; label: string }[]).map(({ mode, icon: Icon, label }) => (
                            <button key={mode} onClick={() => setViewMode(mode)} style={{
                                background: viewMode === mode
                                    ? (mode === 'farmer' ? '#16A34A' : '#0D7377')
                                    : 'transparent',
                                border: 'none', borderRadius: 9, padding: '7px 12px', cursor: 'pointer',
                                color: viewMode === mode ? 'white' : 'rgba(255,255,255,0.45)',
                                fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}>
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* ── TRACTOR PATH TOGGLE ── */}
                    <button onClick={() => { setShowTractor(v => !v); toast.success(showTractor ? 'PELICAN path hidden' : '🚜 PELICAN route activated!'); }} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: showTractor ? '#0D7377' : 'white',
                        border: `1px solid ${showTractor ? '#0D7377' : '#E2E8F0'}`,
                        borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                        fontSize: 11, fontWeight: 700,
                        color: showTractor ? 'white' : '#475569',
                        fontFamily: 'inherit', transition: 'all 0.2s',
                        boxShadow: showTractor ? '0 3px 10px rgba(13,115,119,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                        <Tractor size={13} /> {showTractor ? 'PELICAN ON' : 'Show Path'}
                    </button>

                    {/* Tile picker */}
                    <div style={{
                        display: 'flex', gap: 3, background: '#F1F5F9',
                        border: '1px solid #E2E8F0', borderRadius: 10, padding: 3,
                    }}>
                        {([
                            { mode: 'satellite', Icon: Satellite, label: 'Satellite' },
                            { mode: 'light',     Icon: Sun,       label: 'Light' },
                            { mode: 'dark',      Icon: Moon,      label: 'Dark' },
                        ] as { mode: TileMode; Icon: any; label: string }[]).map(({ mode, Icon, label }) => (
                            <button key={mode} onClick={() => setTileMode(mode)} style={{
                                background: tileMode === mode ? 'white' : 'transparent',
                                border: `1px solid ${tileMode === mode ? '#E2E8F0' : 'transparent'}`,
                                borderRadius: 7, padding: '6px 10px', cursor: 'pointer',
                                color: tileMode === mode ? '#0F172A' : '#94A3B8',
                                fontSize: 11, fontWeight: tileMode === mode ? 700 : 500,
                                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                                boxShadow: tileMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.12s',
                            }}>
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button onClick={handleRefresh} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'inherit',
                        transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#0D7377'; b.style.color = '#0D7377'; }}
                        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#E2E8F0'; b.style.color = '#475569'; }}
                    >
                        <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── FARMER MODE BANNER ─────────────────── */}
            {isFarmer && (
                <div style={{
                    background: 'linear-gradient(90deg, #F0FDF4, #ECFDF5)',
                    border: '1px solid #BBF7D0', borderRadius: 12,
                    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <span style={{ fontSize: 22 }}>👨‍🌾</span>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>Kisan Mode — Aapke Liye Aasaan Jankari</div>
                        <div style={{ fontSize: 11, color: '#4B7A5A', fontWeight: 500, marginTop: 2 }}>
                            Lal = abhi kuch karo · Peela = thoda dhyan do · Hara = sab theek hai
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                        {[
                            { emoji: '🔴', label: `${counts.CRITICAL} Khet`, sub: 'Abhi karo!' },
                            { emoji: '🟡', label: `${counts.MEDIUM} Khet`,   sub: 'Dhyan do' },
                            { emoji: '🟢', label: `${counts.LOW} Khet`,      sub: 'Theek hai' },
                        ].map(({ emoji, label, sub }, i) => (
                            <div key={`khet-${i}`} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16 }}>{emoji}</div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>{label}</div>
                                <div style={{ fontSize: 9, color: '#64748B' }}>{sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── BODY ───────────────────────────────── */}
            <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

                {/* LEFT SIDEBAR */}
                <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Filter chips */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <FilterChip level="ALL"      count={allEvents.length} active={riskFilter === 'ALL'}      onClick={() => setRiskFilter('ALL')} viewMode={viewMode} />
                        <FilterChip level="CRITICAL"  count={counts.CRITICAL} active={riskFilter === 'CRITICAL'} onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')} viewMode={viewMode} />
                        <FilterChip level="MEDIUM"    count={counts.MEDIUM}   active={riskFilter === 'MEDIUM'}   onClick={() => setRiskFilter(riskFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')} viewMode={viewMode} />
                        <FilterChip level="LOW"       count={counts.LOW}      active={riskFilter === 'LOW'}      onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')} viewMode={viewMode} />
                    </div>

                    {/* Farm list panel */}
                    <div style={{
                        flex: 1, background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '12px 14px', borderBottom: '1px solid #F1F5F9',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <Layers size={13} color="#94A3B8" />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                                    {isFarmer ? 'Aapke Saare Khet' : 'Active Farm Plots'}
                                </span>
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: '#0D7377',
                                background: '#F0FDFA', border: '1px solid #99F6E4',
                                borderRadius: 5, padding: '1px 6px',
                            }}>{events.length}</span>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                            {events.length === 0 ? (
                                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                                    <Activity size={24} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, margin: 0 }}>No fields in this filter</p>
                                </div>
                            ) : events.map(e => (
                                <FarmListRow key={e._id} event={e} selected={selectedId === e._id} onSelect={setSelectedId} viewMode={viewMode} />
                            ))}
                        </div>

                        <div style={{
                            padding: '10px 14px', borderTop: '1px solid #F1F5F9',
                            display: 'flex', alignItems: 'center', gap: 7, background: '#FAFAFA',
                        }}>
                            <Satellite size={12} color="#0D7377" />
                            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{totalHa} Ha total area monitored</span>
                        </div>
                    </div>

                    {/* AI Safety Monitor — visible in Expert mode */}
                    {!isFarmer && (
                        <AiSafetyMonitor compact />
                    )}
                </div>

                {/* MAP + DETAIL */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

                    {/* Map canvas */}
                    <div style={{
                        flex: 1, borderRadius: 16, overflow: 'hidden',
                        border: '1px solid #E2E8F0', position: 'relative',
                        background: '#F1F5F9', minHeight: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                        <FarmMap
                            events={events}
                            tileMode={tileMode}
                            geeTiles={undefined}
                            onSelect={setSelectedId}
                            selectedId={selectedId}
                        />

                        {/* PELICAN route badge overlay */}
                        {showTractor && (
                            <div style={{
                                position: 'absolute', top: 14, left: 14, zIndex: 1000,
                                background: '#0D7377', borderRadius: 10,
                                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 16px rgba(13,115,119,0.35)',
                                animation: 'tractorFadeIn 0.4s ease',
                            }}>
                                <Tractor size={14} color="white" />
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>PELICAN Navigation ACTIVE</div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>Avoiding {counts.CRITICAL} waterlogged zones</div>
                                </div>
                            </div>
                        )}

                        {/* Expert mode: Satellite status overlay */}
                        {!isFarmer && (
                            <div style={{
                                position: 'absolute', bottom: 18, left: 18, zIndex: 1000,
                                background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                padding: '10px 14px', width: 240, pointerEvents: 'none',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 7 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Satellite Live Feed</span>
                                </div>
                                {[
                                    'Sentinel-1 SAR — Soil moisture active',
                                    'Sentinel-2 NDVI — Crop health active',
                                    'GEE Fusion — Updating...',
                                ].map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 4 }}>
                                        <Satellite size={9} color={i < 2 ? '#4ADE80' : '#FBBF24'} />
                                        <span style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 500 }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Farmer mode: Simple colour legend */}
                        {isFarmer ? (
                            <div style={{
                                position: 'absolute', top: 14, right: 14, zIndex: 1000,
                                background: 'rgba(255,255,255,0.97)', borderRadius: 12,
                                padding: '12px 16px', boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
                                border: '1px solid #E2E8F0',
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Map Samjho 🗺️</div>
                                {[
                                    { color: '#DC2626', label: '🔴 Abhi kuch karo!', sub: 'Score < 25' },
                                    { color: '#D97706', label: '🟡 Thoda dhyan do', sub: 'Score 25–50' },
                                    { color: '#16A34A', label: '🟢 Sab theek hai!', sub: 'Score > 50' },
                                ].map(l => (
                                    <div key={l.label} style={{ marginBottom: 7 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: l.color }}>{l.label}</div>
                                        <div style={{ fontSize: 9, color: '#94A3B8' }}>{l.sub}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Expert legend
                            <div style={{
                                position: 'absolute', top: 14, right: 14, zIndex: 1000,
                                background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)',
                                border: '1px solid #E2E8F0', borderRadius: 10,
                                padding: '10px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                            }}>
                                <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Legend</div>
                                {[
                                    { color: '#16A34A', label: 'Healthy (70+)' },
                                    { color: '#D97706', label: 'Fair (25–70)' },
                                    { color: '#DC2626', label: 'Critical (<25)' },
                                ].map(l => (
                                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected farm detail bar */}
                    {selectedEvent && <FarmDetailBar event={selectedEvent} onDispatch={openDispatch} viewMode={viewMode} />}
                </div>
            </div>

            <MissionDispatchModal
                open={missionOpen}
                payload={missionPayload}
                onClose={() => setMissionOpen(false)}
            />

            <style>{`
                @keyframes spin         { to { transform:rotate(360deg); } }
                @keyframes tractorFadeIn{ from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
            `}</style>
        </div>
    );
}
