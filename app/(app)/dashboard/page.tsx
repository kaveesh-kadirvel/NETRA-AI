'use client';

import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WeatherPanel from '@/components/dashboard/WeatherPanel';
import { RefreshCw, Satellite, Zap, FileText, ArrowRight, Droplets, FlaskConical, AlertTriangle, CheckCircle, Clock, Map } from 'lucide-react';
import Link from 'next/link';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ════════════════════════════════════════
   QUICK ACTION CARD
════════════════════════════════════════ */
function QuickAction({ emoji, label, sub, href, color, bg }: { emoji: string; label: string; sub: string; href: string; color: string; bg: string }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div style={{
                background: 'white', border: `1px solid ${color}30`,
                borderRadius: 16, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'all 0.18s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}20`;
                    (e.currentTarget as HTMLDivElement).style.borderColor = color + '60';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = color + '30';
                }}
            >
                <div style={{
                    width: 46, height: 46, borderRadius: 13,
                    background: bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, fontWeight: 500 }}>{sub}</div>
                </div>
                <ArrowRight size={14} color={color} />
            </div>
        </Link>
    );
}

/* ════════════════════════════════════════
   FARM ROW — replaces dense table
════════════════════════════════════════ */
function FarmRow({ e }: { e: any }) {
    const score = e.healthScore ?? 0;
    let band: { color: string; bg: string; label: string; emoji: string };
    if (score >= 70) band = { color: '#16A34A', bg: '#F0FDF4', label: 'Healthy', emoji: '🟢' };
    else if (score >= 40) band = { color: '#D97706', bg: '#FFFBEB', label: 'Fair', emoji: '🟡' };
    else band = { color: '#DC2626', bg: '#FEF2F2', label: 'Poor', emoji: '🔴' };

    const areaHa = e.farmId?.areaSqm ? (e.farmId.areaSqm / 10000).toFixed(1) : '—';
    const water  = e.waterDeficitLiters != null ? (e.waterDeficitLiters / 1000).toFixed(1) + ' kL' : '—';
    const khad   = e.nitrogenReqKg != null ? e.nitrogenReqKg.toFixed(0) + ' kg' : '—';

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto auto',
            alignItems: 'center', gap: 12,
            padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
            transition: 'background 0.12s',
        }}
            onMouseEnter={e2 => (e2.currentTarget as HTMLDivElement).style.background = '#FAFAFA'}
            onMouseLeave={e2 => (e2.currentTarget as HTMLDivElement).style.background = 'transparent'}
        >
            {/* Farm name + crop */}
            <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                    {e.farmId?.farmName ?? 'Unknown Farm'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                    {e.farmId?.cropType ?? '—'} · {areaHa} Ha
                </div>
            </div>

            {/* Water */}
            <div style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0369A1', justifyContent: 'center' }}>
                    <Droplets size={11} />
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{water}</span>
                </div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>Water</div>
            </div>

            {/* Fertilizer */}
            <div style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7C3AED', justifyContent: 'center' }}>
                    <FlaskConical size={11} />
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{khad}</span>
                </div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>Khad</div>
            </div>

            {/* Health badge */}
            <div style={{
                background: band.bg, border: `1px solid ${band.color}30`,
                borderRadius: 10, padding: '6px 12px', textAlign: 'center', minWidth: 72,
            }}>
                <div style={{ fontSize: 14, lineHeight: 1 }}>{band.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: band.color, marginTop: 3 }}>{score}/100</div>
                <div style={{ fontSize: 9, color: band.color, fontWeight: 600 }}>{band.label}</div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   ALERT TICKER
════════════════════════════════════════ */
function AlertBanner({ events }: { events: any[] }) {
    const critical = events.filter(e => e.healthScore < 30);
    if (critical.length === 0) return null;

    return (
        <div style={{
            background: 'linear-gradient(90deg, #FEF2F2, #fff)',
            border: '1px solid #FCA5A5', borderRadius: 14,
            padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12,
            animation: 'slideIn 0.4s ease',
        }}>
            <div style={{
                background: '#DC2626', borderRadius: 10, padding: 8, flexShrink: 0,
                display: 'flex', animation: 'pulse 2s infinite',
            }}>
                <AlertTriangle size={14} color="white" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#991B1B' }}>
                    ⚠️ {critical.length} Fields Need URGENT Attention!
                </div>
                <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2, fontWeight: 500 }}>
                    {critical.slice(0, 3).map((e: any) => e.farmId?.farmName || 'Unknown').join(' · ')} — health score below 30/100
                </div>
            </div>
            <Link href="/studio/spatial" style={{ textDecoration: 'none' }}>
                <button style={{
                    background: '#DC2626', color: 'white', border: 'none',
                    borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 800,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                    View Now →
                </button>
            </Link>
        </div>
    );
}

/* ════════════════════════════════════════
   EXPERT DASHBOARD PAGE
════════════════════════════════════════ */
export function ExpertDashboard() {
    const { data: summaryData, mutate, isLoading: sumLoading } = useSWR('/api/insights/summary', fetcher, { refreshInterval: 60000 });
    const { data: latestData } = useSWR('/api/insights/latest?limit=20', fetcher, { refreshInterval: 60000 });

    const [tab, setTab] = useState<'all' | 'critical' | 'good'>('all');

    const lastUpdated = useMemo(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), [summaryData]);
    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Suprabhat 🌅' : greetingHour < 17 ? 'Namaste 🌞' : 'Shubh Sandhya 🌙';

    const events: any[] = latestData?.events ?? [];
    const filtered = tab === 'critical' ? events.filter(e => e.healthScore < 40)
        : tab === 'good' ? events.filter(e => e.healthScore >= 70)
            : events;

    const critCount  = events.filter(e => e.healthScore < 40).length;
    const goodCount  = events.filter(e => e.healthScore >= 70).length;
    const totalCount = events.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>

            {/* ── GREETING HEADER ────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0A1628 0%, #0D7377 60%, #14B8A6 100%)',
                borderRadius: 20, padding: '24px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 8px 32px rgba(13,115,119,0.25)',
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%', background: '#4ADE80',
                            boxShadow: '0 0 0 3px rgba(74,222,128,0.3)',
                            animation: 'pulse 2s infinite',
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
                            LIVE · {lastUpdated} IST
                        </span>
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.025em' }}>
                        {greeting}, Kisan Ji! 🌾
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 13, fontWeight: 500 }}>
                        Aaj aapke {totalCount} khet ka satellite se seedha haal — Poore Bharat Ka Live Data
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Link href="/studio/spatial" style={{ textDecoration: 'none' }}>
                        <button style={{
                            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 12, padding: '10px 18px', cursor: 'pointer',
                            color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7,
                            backdropFilter: 'blur(8px)', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        >
                            <Satellite size={13} /> Scan My Farm
                        </button>
                    </Link>
                    <button onClick={() => mutate()} style={{
                        background: '#16A34A', border: 'none',
                        borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
                        color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 12px rgba(22,163,74,0.4)', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── ALERT BANNER ────────────────────────────── */}
            <AlertBanner events={events} />

            {/* ── KPI STATS ───────────────────────────────── */}
            <StatsGrid />

            {/* ── MAIN 2-COLUMN LAYOUT ────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 310px', gap: 20, alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

                    {/* ── QUICK ACTIONS ──── */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ fontSize: 18 }}>⚡</div>
                            <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>Quick Actions</span>
                            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>— Ek click mein karo</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <QuickAction emoji="🛰" label="Scan My Farm" sub="Satellite se khet ki jaanch" href="/studio/spatial" color="#0D7377" bg="#F0FDFA" />
                            <QuickAction emoji="🌱" label="Crop Health Map" sub="NDVI se fasal ki sehat dekho" href="/studio/veg" color="#16A34A" bg="#F0FDF4" />
                            <QuickAction emoji="⚠️" label="Crop Risk Report" sub="Kaunsi fasal khatre mein hai?" href="/studio/risk" color="#D97706" bg="#FFFBEB" />
                            <QuickAction emoji="📄" label="Download Report" sub="PDF report banao aur share karo" href="/studio/pdf" color="#6366F1" bg="#F5F3FF" />
                        </div>
                    </div>

                    {/* ── FIELD STATUS TABLE ──── */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                        {/* Header */}
                        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>🌾 Aapke Saare Khet</span>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#0D7377', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, padding: '2px 8px' }}>
                                            {totalCount} fields
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                                        Paani, Khad aur Sehat — Ek Jagah
                                    </div>
                                </div>
                                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={10} /> Updates every 60s
                                </div>
                            </div>

                            {/* Tab filter */}
                            <div style={{ display: 'flex', gap: 6, paddingBottom: 0 }}>
                                {[
                                    { key: 'all', label: `All Fields (${totalCount})` },
                                    { key: 'critical', label: `🔴 Needs Help (${critCount})` },
                                    { key: 'good', label: `🟢 Healthy (${goodCount})` },
                                ].map(t => (
                                    <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                                        background: tab === t.key ? '#0D7377' : 'transparent',
                                        border: `1px solid ${tab === t.key ? '#0D7377' : '#E2E8F0'}`,
                                        borderBottom: 'none', borderRadius: '8px 8px 0 0',
                                        color: tab === t.key ? 'white' : '#64748B',
                                        padding: '7px 14px', fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}>{t.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Column headings */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                            gap: 12, padding: '10px 20px',
                            background: '#FAFAFA', borderBottom: '1px solid #F1F5F9',
                        }}>
                            {['Farm / Fasal', '💧 Paani', '🌱 Khad', '💚 Sehat'].map(h => (
                                <div key={h} style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: h !== 'Farm / Fasal' ? 72 : undefined, textAlign: h !== 'Farm / Fasal' ? 'center' : 'left' }}>{h}</div>
                            ))}
                        </div>

                        {/* Rows */}
                        {filtered.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>🌾</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>No fields found</div>
                                <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>Run the satellite pipeline first</div>
                            </div>
                        ) : filtered.map((e: any) => <FarmRow key={e._id} e={e} />)}

                        {filtered.length > 0 && (
                            <div style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
                                <Link href="/map" style={{ fontSize: 12, fontWeight: 700, color: '#0D7377', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <Map size={12} /> View all on India Map
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

                    {/* Health Summary Ring */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>📊</span> Field Health Summary
                        </div>
                        {[
                            { label: '🟢 Healthy (70–100)', count: goodCount, color: '#16A34A', bg: '#F0FDF4' },
                            { label: '🟡 Fair (40–69)', count: events.filter(e => e.healthScore >= 40 && e.healthScore < 70).length, color: '#D97706', bg: '#FFFBEB' },
                            { label: '🔴 Needs Help (<40)', count: critCount, color: '#DC2626', bg: '#FEF2F2' },
                        ].map(({ label, count, color, bg }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ background: bg, border: `1px solid ${color}25`, borderRadius: 8, padding: '6px 10px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color }}>{count}</span>
                                    </div>
                                    <div style={{ height: 4, background: `${color}25`, borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${totalCount > 0 ? (count / totalCount) * 100 : 0}%`, background: color, transition: 'width 1s ease', borderRadius: 2 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Fields Tracked</span>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>{totalCount}</span>
                        </div>
                    </div>

                    {/* Weather */}
                    <WeatherPanel />

                    {/* System OK card */}
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <CheckCircle size={14} color="#16A34A" />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D' }}>System Health — ALL GOOD ✓</span>
                        </div>
                        {[
                            { label: 'Satellite Data', val: 'Sentinel-1 + 2', ok: true },
                            { label: 'Weather Feed', val: 'Open-Meteo Live', ok: true },
                            { label: 'AI Engine', val: 'GEE Fusion v1.2', ok: true },
                            { label: 'Email Alerts', val: 'SMTP Active ✓', ok: true },
                        ].map(({ label, val, ok }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(22,163,74,0.1)' }}>
                                <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: 11, color: ok ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
            `}</style>
        </div>
    );
}

export default function Dashboard() {
    const [role, setRole] = useState<'EXPERT' | 'FARMER' | null>(null);
    
    useEffect(() => {
        setRole(sessionStorage.getItem('netra_role') as any || 'EXPERT');
    }, []);

    if (role === null) return <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>Authenticating Role...</div>;
    return role === 'FARMER' ? <FarmerDashboard /> : <ExpertDashboard />;
}
