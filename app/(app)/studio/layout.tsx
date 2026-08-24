'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StudioProvider, useStudio } from '@/components/studio/StudioContext';
import { Satellite as SatelliteIcon, Sprout, Cpu, BarChart2, Leaf, MessageSquare, FileText, Plane } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   FARMER SIDEBAR — Simple 3-step flow
═══════════════════════════════════════════════════════ */
function FarmerSidebar() {
    const { loading, handleRun, drawnBounds, setDrawnBounds, setCfg, cfg, results } = useStudio();
    const hasAOI = !!drawnBounds || (cfg.min_lon !== 0 && cfg.max_lon !== 0);

    const step = !hasAOI ? 1 : !results ? 2 : 3;

    return (
        <div style={{
            width: 280, flexShrink: 0,
            background: 'white',
            borderRight: '1px solid #E9ECEF',
            display: 'flex', flexDirection: 'column',
            height: '100%',
        }}>
            {/* Brand */}
            <div style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #0D7377, #14B8A6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Sprout size={18} color="white" />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>NETRA.AI</div>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Precision Farm Analysis</div>
                </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

                {/* Step indicators */}
                {[
                    { n: 1, emoji: '🗺️', title: 'Select Your Farm',  desc: 'Draw your field on the map' },
                    { n: 2, emoji: '🛰️', title: 'Scan with Satellite', desc: 'We analyze the latest data' },
                    { n: 3, emoji: '📋', title: 'Get Your Action Plan', desc: 'See exactly what to do today' },
                ].map(s => {
                    const done    = step > s.n;
                    const active  = step === s.n;
                    return (
                        <div key={s.n} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            opacity: active || done ? 1 : 0.4,
                            transition: 'opacity 0.3s',
                        }}>
                            {/* Circle */}
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: done ? '#D1FAE5' : active ? '#F0FDF4' : '#F8FAFC',
                                border: `2px solid ${done ? '#10B981' : active ? '#0D7377' : '#E2E8F0'}`,
                                fontSize: done ? 14 : 15,
                            }}>
                                {done ? '✓' : s.emoji}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: active ? '#0F172A' : '#64748B' }}>
                                    {s.title}
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>
                                    {s.desc}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                {/* Step 1 hint */}
                {step === 1 && (
                    <div style={{
                        background: '#F0FDF4', border: '1px solid #BBF7D0',
                        borderRadius: 12, padding: 16, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>✏️</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                            Draw your farm field
                        </div>
                        <p style={{ fontSize: 11, color: '#4ADE80', margin: 0, lineHeight: 1.6 }}>
                            Click and drag on the map to select your farm area
                        </p>
                    </div>
                )}

                {/* Step 2: AOI selected, ready to scan */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{
                            background: '#F0FDF4', border: '1px solid #BBF7D0',
                            borderRadius: 12, padding: 14,
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', marginBottom: 8 }}>
                                ✅ Farm field selected!
                            </div>
                            <p style={{ fontSize: 11, color: '#4B5563', margin: 0, lineHeight: 1.6 }}>
                                Now click the button below to analyze your field with satellite imagery.
                            </p>
                        </div>
                        <button
                            onClick={() => handleRun()} disabled={loading}
                            style={{
                                padding: '14px', borderRadius: 12, border: 'none',
                                background: loading
                                    ? 'linear-gradient(135deg, #94A3B8, #94A3B8)'
                                    : 'linear-gradient(135deg, #0D7377, #14B8A6)',
                                color: 'white', fontWeight: 800, fontSize: 14,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: loading ? 'none' : '0 4px 14px rgba(13,115,119,0.35)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading
                                ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Scanning farm…</>
                                : <><span style={{ fontSize: 18 }}>🛰️</span> Scan My Farm</>}
                        </button>
                        <button
                            onClick={() => { setDrawnBounds(null); setCfg({ ...cfg, min_lon: 0, max_lon: 0, min_lat: 0, max_lat: 0 }); }}
                            style={{
                                padding: '9px', borderRadius: 10, border: '1px solid #E2E8F0',
                                background: 'white', color: '#64748B', fontWeight: 700, fontSize: 11,  cursor: 'pointer',
                            }}
                        >
                            ↩ Redraw area
                        </button>
                    </div>
                )}

                {/* Step 3: Results ready */}
                {step === 3 && results && (() => {
                    const m = results.metrics || {};
                    const waterKm2 = (m.flood_area || 0).toFixed(1);
                    const nitrogenKm2 = (m.ndvi_loss_area || 0).toFixed(1);
                    const confidence = ((m.peak_confidence || 0) * 100).toFixed(0);
                    const yieldRisk = (m.severity_score || 0) >= 60 ? '🔴 High Risk' : (m.severity_score || 0) >= 40 ? '🟡 Medium Risk' : '🟢 Low Risk';
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Summary pill */}
                            <div style={{
                                background: 'linear-gradient(135deg, #0D7377, #14B8A6)',
                                borderRadius: 12, padding: '12px 14px', color: 'white',
                            }}>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>TODAY'S FARM STATUS</div>
                                <div style={{ fontSize: 18, fontWeight: 900 }}>{yieldRisk}</div>
                                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Confidence: {confidence}%</div>
                            </div>
                            {/* Water card */}
                            <div style={{
                                background: '#EFF6FF', border: '1px solid #BFDBFE',
                                borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <span style={{ fontSize: 24 }}>💧</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 900, color: '#1E40AF' }}>Needs Water</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1D4ED8' }}>{waterKm2} km²</div>
                                    <div style={{ fontSize: 10, color: '#3B82F6' }}>Apply 20–40mm irrigation</div>
                                </div>
                            </div>
                            {/* Fertilizer card */}
                            <div style={{
                                background: '#FEF2F2', border: '1px solid #FECACA',
                                borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <span style={{ fontSize: 24 }}>🌿</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 900, color: '#991B1B' }}>Needs Fertilizer</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#DC2626' }}>{nitrogenKm2} km²</div>
                                    <div style={{ fontSize: 10, color: '#EF4444' }}>Apply 60–80 kg/ha Urea</div>
                                </div>
                            </div>

                            <button
                                onClick={() => { setDrawnBounds(null); setCfg({ ...cfg, min_lon: 0, max_lon: 0, min_lat: 0, max_lat: 0 }); }}
                                style={{
                                    padding: '9px', borderRadius: 10, border: '1px solid #E2E8F0',
                                    background: 'white', color: '#64748B', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                                }}
                            >
                                ↩ Analyze another field
                            </button>
                        </div>
                    );
                })()}
            </div>

            {/* Bottom status bar */}
            <div style={{
                padding: '10px 20px', borderTop: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#F8FAFC',
            }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'ping 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Satellite connected — Ready</span>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   ENGINEER SIDEBAR — Full technical controls
═══════════════════════════════════════════════════════ */
function EngineerSidebar() {
    const { cfg, setCfg, loading, handleRun, aoiMode, setAoiMode, drawnBounds, setDrawnBounds } = useStudio();
    const hasAOI = !!drawnBounds || (cfg.min_lon !== 0);

    return (
        <div style={{
            width: 280, flexShrink: 0, background: 'white',
            borderRight: '1px solid #E2E8F0',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto', height: '100%',
        }}>
            <div style={{
                padding: '16px 18px', borderBottom: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(13,115,119,0.08)', color: '#0D7377',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Cpu size={13} />
                </div>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Pipeline Controls</div>
                    <div style={{ fontSize: 9, fontWeight: 500, color: '#94A3B8' }}>GEE Processing Config</div>
                </div>
            </div>

            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

                {[
                    { label: 'SAR Threshold (dB)', key: 'threshold', min: -6, max: 0, step: 0.1, accent: '#EF4444', fmt: (v: number) => v.toFixed(1) },
                    { label: 'NDVI Threshold', key: 'ndvi_thresh', min: -0.5, max: 0, step: 0.01, accent: '#10B981', fmt: (v: number) => `${(v*100).toFixed(0)}%` },
                    { label: 'Max Cloud Cover', key: 'cloud_pct', min: 5, max: 80, step: 1, accent: '#D97706', fmt: (v: number) => `${Math.round(v)}%` },
                    { label: 'Resolution', key: 'scale', min: 10, max: 1000, step: 10, accent: '#0D7377', fmt: (v: number) => `${Math.round(v)}m` },
                ].map(s => (
                    <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>{s.label}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: s.accent }}>{s.fmt(Number(cfg[s.key as keyof typeof cfg]))}</span>
                        </div>
                        <input
                            type="range" min={s.min} max={s.max} step={s.step}
                            value={Number(cfg[s.key as keyof typeof cfg])}
                            onChange={e => setCfg({ ...cfg, [s.key]: parseFloat(e.target.value) })}
                            style={{ width: '100%', accentColor: s.accent, height: 3, cursor: 'pointer' }}
                        />
                    </div>
                ))}

                <div style={{ height: 1, background: '#F1F5F9' }} />

                {/* AOI Mode */}
                <div style={{ display: 'flex', gap: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, padding: 3 }}>
                    {[{ id: 'draw', label: 'Draw AOI' }, { id: 'manual', label: 'Lat / Lon' }].map(m => (
                        <button key={m.id} onClick={() => setAoiMode(m.id as any)} style={{
                            flex: 1, padding: '7px', fontSize: 10, fontWeight: 700,
                            borderRadius: 7, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: aoiMode === m.id ? 'white' : 'transparent',
                            color: aoiMode === m.id ? '#0F172A' : '#94A3B8',
                            boxShadow: aoiMode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        }}>{m.label}</button>
                    ))}
                </div>

                {aoiMode === 'manual' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                            { label: 'Min Lon', key: 'min_lon' }, { label: 'Max Lon', key: 'max_lon' },
                            { label: 'Min Lat', key: 'min_lat' }, { label: 'Max Lat', key: 'max_lat' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>{f.label}</label>
                                <input
                                    type="number" step="0.1"
                                    value={Number(cfg[f.key as keyof typeof cfg])}
                                    onChange={e => setCfg({ ...cfg, [f.key]: parseFloat(e.target.value) })}
                                    style={{ width: '100%', background: 'white', border: '1px solid #E2E8F0', borderRadius: 7, padding: '6px 8px', fontSize: 11, fontWeight: 700, outline: 'none', color: '#0F172A' }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {drawnBounds && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 12px', fontSize: 10, color: '#15803D', fontWeight: 700 }}>
                        ✓ AOI: {drawnBounds[0].toFixed(3)}°, {drawnBounds[1].toFixed(3)}° → {drawnBounds[2].toFixed(3)}°, {drawnBounds[3].toFixed(3)}°
                        <button onClick={() => { setDrawnBounds(null); setCfg({ ...cfg, min_lon: 0, max_lon: 0, min_lat: 0, max_lat: 0 }); }}
                            style={{ display: 'block', marginTop: 6, padding: '4px 8px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                            Reset — Draw Again
                        </button>
                    </div>
                )}

                <button onClick={() => handleRun()} disabled={loading} style={{
                    padding: '11px', background: loading ? '#94A3B8' : '#0F172A',
                    border: 'none', borderRadius: 10, color: 'white', fontWeight: 800, fontSize: 11,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s',
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                            <span>Processing…</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Cpu size={13} />
                            <span>Run Pipeline</span>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   TOP HEADER — Clean minimal bar
═══════════════════════════════════════════════════════ */
function StudioHeader() {
    const { results, fromCache, farmerMode, setFarmerMode } = useStudio();
    const m = results?.metrics || {};
    const severity = m.severity_score ?? 0;
    const riskLabel = severity >= 60 ? 'High' : severity >= 40 ? 'Medium' : 'Low';
    const riskColor = severity >= 60 ? '#EF4444' : severity >= 40 ? '#D97706' : '#10B981';

    return (
        <div style={{
            padding: '12px 20px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            background: 'white',
        }}>
            {/* Title */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SatelliteIcon size={13} color="#0D7377" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Fasal Satellite Studio</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 5, padding: '1px 7px' }}>LIVE</span>
                    {fromCache && <span style={{ fontSize: 9, fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 5, padding: '1px 7px' }}>⚡ SAVED RESULT</span>}
                </div>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>
                    {farmerMode ? 'Simple Mode — Results in plain language for farmers' : 'Expert Mode — Google Earth Engine · Sentinel Satellite Data'}
                </p>
            </div>

            {/* Results chips — only when data exists */}
            {results && !farmerMode && (
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { label: 'Field Area',   val: `${(results.aoi_km2 ?? 0).toFixed(1)} km²`, color: '#0369A1' },
                        { label: 'Problem Area', val: `${(m.ndvi_loss_area ?? 0).toFixed(1)} km²`, color: '#EF4444' },
                        { label: 'Accuracy',     val: `${((m.peak_confidence ?? 0) * 100).toFixed(0)}%`, color: '#0D7377' },
                    ].map(chip => (
                        <div key={chip.label} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: chip.color, whiteSpace: 'nowrap' }}>{chip.val}</div>
                            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{chip.label}</div>
                        </div>
                    ))}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 14px', minWidth: 130 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Crop Risk</span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: riskColor }}>{riskLabel.toUpperCase()}</span>
                        </div>
                        <div style={{ height: 4, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, severity)}%`, background: 'linear-gradient(90deg, #10B981, #D97706, #EF4444)', borderRadius: 6, transition: 'width 1.2s ease' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Mode toggle */}
            <button
                onClick={() => setFarmerMode(!farmerMode)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: farmerMode ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${farmerMode ? '#86EFAC' : '#E2E8F0'}`,
                    borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                    transition: 'all 0.2s', flexShrink: 0, fontFamily: 'inherit',
                }}>
                {farmerMode
                    ? <><Sprout size={13} color="#16A34A" /><span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>Simple Mode (Farmer)</span></>
                    : <><Cpu size={13} color="#64748B" /><span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>Expert Mode</span></>}
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   TABS — Simple nav (hidden in Farmer Mode)
═══════════════════════════════════════════════════════ */
const TABS_FARMER = [
    { path: '/studio/spatial', emoji: '🗺️', label: 'My Farm Map' },
    { path: '/studio/veg',     emoji: '🌾', label: 'Crop Health' },
    { path: '/studio/risk',    emoji: '⚠️', label: 'What To Do' },
    { path: '/studio/ai',      emoji: '🤖', label: 'Ask AI' },
];

const TABS_ENGINEER = [
    { path: '/studio/spatial',    icon: SatelliteIcon, label: 'Map View'        },
    { path: '/studio/uav',        icon: Cpu,           label: 'LIVE UAV Feed'   },
    { path: '/studio/simulator',  icon: Plane,         label: 'PELICAN 3D Simulation' },
    { path: '/studio/core',       icon: Cpu,           label: 'Soil Moisture'   },
    { path: '/studio/veg',        icon: Leaf,          label: 'Crop Health'     },
    { path: '/studio/risk',       icon: BarChart2,     label: 'Risk'            },
    { path: '/studio/confidence', icon: BarChart2,     label: 'Accuracy'        },
    { path: '/studio/logs',       icon: FileText,      label: 'Logs'            },
    { path: '/studio/ai',         icon: MessageSquare, label: 'Ask AI'          },
];

function StudioTabs() {
    const { farmerMode } = useStudio();
    const pathname = usePathname();
    const tabs = farmerMode ? TABS_FARMER : TABS_ENGINEER;

    return (
        <div style={{
            display: 'flex', gap: 2, padding: '10px 20px',
            borderBottom: '1px solid #F1F5F9', flexShrink: 0,
            background: 'white', overflowX: 'auto',
        }}>
            {tabs.map((tab) => {
                const active = pathname === tab.path;
                return (
                    <Link key={tab.path} href={tab.path} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: farmerMode ? '8px 16px' : '7px 14px',
                        borderRadius: 9, fontSize: farmerMode ? 12 : 11, fontWeight: 700,
                        textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
                        background: active ? (farmerMode ? '#0D7377' : '#0F172A') : 'transparent',
                        color: active ? 'white' : '#64748B',
                    }}>
                        {farmerMode
                            ? <><span style={{ fontSize: 14 }}>{(tab as any).emoji}</span>{tab.label}</>
                            : (() => { const Icon = (tab as any).icon; return <><Icon size={12} />{tab.label}</>; })()}
                    </Link>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   ROOT LAYOUT SHELL
═══════════════════════════════════════════════════════ */
function StudioLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { farmerMode } = useStudio();
    const isFullPage = ['/studio/ai', '/studio/pdf'].includes(pathname);

    return (
        <div style={{ display: 'flex', height: '100%', background: '#F8FAFC' }}>
            {/* Sidebar — farmer or engineer */}
            {!isFullPage && (farmerMode ? <FarmerSidebar /> : <EngineerSidebar />)}

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                {!isFullPage && (
                    <>
                        <StudioHeader />
                        <StudioTabs />
                    </>
                )}
                <div style={{
                    flex: 1, overflowY: isFullPage ? 'hidden' : 'auto',
                    padding: isFullPage ? 0 : '20px 24px', minHeight: 0,
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <StudioProvider>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes ping { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                `}</style>
                <StudioLayoutContent>
                    {children}
                </StudioLayoutContent>
            </div>
        </StudioProvider>
    );
}
