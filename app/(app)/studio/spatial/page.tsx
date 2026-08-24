'use client';

import React, { useState } from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import dynamic from 'next/dynamic';
import {
    Map as MapIcon, Layers, Satellite as SatelliteIcon, MapPin,
    Eye, Droplets, FlaskConical, Leaf, Activity, Zap, Info,
} from 'lucide-react';

const StudioMap = dynamic<any>(() => import('@/components/studio/StudioMap'), { ssr: false });

const LAYER_DEFS = [
    { id: 'sarBase',   label: 'Soil Moisture Baseline',  desc: 'S1 Backscatter',    color: '#6366F1', explain: 'Sentinel-1 SAR VV/VH backscatter showing soil moisture levels. Dark = dry, Bright = wet.' },
    { id: 'flood',     label: 'Water Deficit Mask',       desc: 'Composite',          color: '#0EA5E9', explain: 'Areas where VV backscatter dropped >2dB — indicating severe water deficit / saturation anomaly.' },
    { id: 'optWater',  label: 'Vitality Indices',         desc: 'S2 Verification',   color: '#2DD4BF', explain: 'Sentinel-2 optical confirmation of moisture anomalies using NDWI water index.' },
    { id: 'vegDamage', label: 'Nitrate Stress Map',       desc: 'NDVI Delta',         color: '#F43F5E', explain: 'NDVI drop exceeding 12% threshold — pinpoints cells needing immediate nitrogen fertilization.' },
];

const BASE_LAYERS = [
    { id: 'satellite', icon: SatelliteIcon, label: 'Satellite' },
    { id: 'light',     icon: MapIcon,       label: 'Light'     },
    { id: 'dark',      icon: Layers,        label: 'Dark'      },
    { id: 'terrain',   icon: MapPin,        label: 'Terrain'   },
];

// Colour legend for the heatmap
const HEAT_LEGEND = [
    { color: '#0EA5E9', label: 'Water Deficit',    sub: 'SAR −2dB anomaly' },
    { color: '#EF4444', label: 'Nitrogen Deficit', sub: 'NDVI −12% drop' },
    { color: '#22C55E', label: 'Healthy Zone',     sub: 'Baseline normal' },
    { color: '#22C55E', label: 'PELICAN Path',     sub: 'Drone routing', dashed: true },
];

export default function SpatialInsightsPage() {
    const { results, layerVisibility, setLayerVisibility, baseLayer, setBaseLayer } = useStudio();
    const m = results?.metrics || {};
    const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

    const dataCards = results ? [
        {
            icon: Droplets,
            label: 'Sentinel-1 SAR',
            value: `${(m.flood_area ?? 0).toFixed(1)} km²`,
            sub: 'Water Deficit Zone',
            color: '#0EA5E9',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            detail: `${m.n_pre_s1 ?? 0} pre + ${m.n_post_s1 ?? 0} post scenes fused`,
        },
        {
            icon: FlaskConical,
            label: 'Sentinel-2 NDVI',
            value: `${(m.ndvi_loss_area ?? 0).toFixed(1)} km²`,
            sub: 'Nitrogen Deficit Zone',
            color: '#EF4444',
            bg: '#FEF2F2',
            border: '#FECACA',
            detail: `${m.n_pre_s2 ?? 0} pre + ${m.n_post_s2 ?? 0} post scenes · ${m.used_cloud ?? 25}% cloud`,
        },
        {
            icon: Leaf,
            label: 'Yield Impact',
            value: `${Math.round(m.exposed_pop ?? 0).toLocaleString()} T`,
            sub: 'Projected Depletion',
            color: '#D97706',
            bg: '#FFFBEB',
            border: '#FDE68A',
            detail: `NDVI mean Δ = ${(m.ndvi_mean ?? 0).toFixed(4)}`,
        },
        {
            icon: Activity,
            label: 'Model Confidence',
            value: `${((m.peak_confidence ?? 0) * 100).toFixed(1)}%`,
            sub: 'Bayesian Ensemble',
            color: '#0D7377',
            bg: '#F0FDFA',
            border: '#99F6E4',
            detail: `SAR Δ = ${(m.sar_mean ?? 0).toFixed(3)} dB`,
        },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

            {/* ── Toolbar ─────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <SatelliteIcon size={13} color="#0D7377" />
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
                            Geospatial Precision Map
                        </h2>
                    </div>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                        Live Sentinel-1 SAR + Sentinel-2 NDVI heatmap · Draw an AOI to run analysis
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 3, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4 }}>
                    {BASE_LAYERS.map(mode => (
                        <button key={mode.id} onClick={() => setBaseLayer(mode.id as any)} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 11px', borderRadius: 7, fontSize: 11,
                            fontWeight: 700, cursor: 'pointer', border: 'none',
                            transition: 'all 0.15s',
                            background: baseLayer === mode.id ? '#0F172A' : 'transparent',
                            color: baseLayer === mode.id ? 'white' : '#94A3B8',
                        }}>
                            <mode.icon size={11} />
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Data Story Cards (visible when pipeline ran) ── */}
            {results && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, flexShrink: 0 }}>
                    {dataCards.map(card => (
                        <div key={card.label} style={{
                            background: card.bg, border: `1px solid ${card.border}`,
                            borderRadius: 12, padding: '12px 14px',
                            display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ background: card.color, borderRadius: 7, padding: 5, display: 'flex' }}>
                                    <card.icon size={11} color="white" />
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 800, color: card.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.label}</span>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>{card.value}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: card.color }}>{card.sub}</div>
                            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>{card.detail}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Map canvas ──────────────────────────────── */}
            <div style={{
                position: 'relative', flex: 1, minHeight: 400,
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid #E2E8F0', background: '#111827',
                flexShrink: 0,
            }}>
                <StudioMap
                    bounds={results?.metrics?.bounds}
                    tiles={results?.tiles}
                    visibility={layerVisibility}
                    baseLayer={baseLayer}
                />

                {/* Live pulse badge */}
                <div style={{
                    position: 'absolute', top: 14, left: 14, zIndex: 1000,
                    background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)',
                    color: 'white', padding: '7px 14px', borderRadius: 20,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#2DD4BF',
                        boxShadow: '0 0 0 0 rgba(45,212,191,0.5)',
                        animation: 'ripple 1.8s ease-in-out infinite',
                    }} />
                    {results ? '🛰 GEE Downlink Active' : '⬡ Draw AOI to Activate'}
                </div>

                {/* Data source badge */}
                {results && (
                    <div style={{
                        position: 'absolute', top: 14, right: 14, zIndex: 1000,
                        background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)',
                        color: 'white', padding: '7px 14px', borderRadius: 20,
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 10, fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                        <Zap size={10} color="#FBBF24" />
                        {results.demo_mode ? 'DEMO · Seeded ARD' : `LIVE · ${results.scale ?? 150}m/px Sentinel`}
                    </div>
                )}

                {/* Heatmap colour legend */}
                <div style={{
                    position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
                    background: 'rgba(15,23,42,0.90)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
                    padding: '14px 16px', minWidth: 200,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Eye size={11} color="#94A3B8" />
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Heatmap Legend
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {HEAT_LEGEND.map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 28, height: 8, borderRadius: 4,
                                    background: item.dashed
                                        ? `repeating-linear-gradient(90deg, ${item.color} 0, ${item.color} 6px, transparent 6px, transparent 10px)`
                                        : `linear-gradient(90deg, ${item.color}dd, ${item.color}44)`,
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{item.label}</div>
                                    <div style={{ fontSize: 8, color: '#64748B', fontWeight: 600 }}>{item.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Layer toggles inside legend */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: 8, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Satellite Layers
                        </div>
                        {LAYER_DEFS.map(layer => (
                            <label
                                key={layer.id}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 6 }}
                                onMouseEnter={() => setHoveredLayer(layer.id)}
                                onMouseLeave={() => setHoveredLayer(null)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: 2,
                                        background: layer.color,
                                        boxShadow: `0 0 6px ${layer.color}90`,
                                        flexShrink: 0,
                                    }} />
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: layerVisibility[layer.id] ? 'white' : '#475569' }}>{layer.label}</div>
                                        <div style={{ fontSize: 8, color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>{layer.desc}</div>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={layerVisibility[layer.id]}
                                    onChange={e => setLayerVisibility({ ...layerVisibility, [layer.id]: e.target.checked })}
                                    style={{ width: 13, height: 13, accentColor: layer.color, cursor: 'pointer' }}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Layer explainer tooltip */}
                {hoveredLayer && (
                    <div style={{
                        position: 'absolute', bottom: 16, right: 16, zIndex: 1100,
                        background: 'rgba(15,23,42,0.96)', backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                        padding: '12px 14px', maxWidth: 240,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Info size={11} color="#2DD4BF" />
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#2DD4BF' }}>
                                {LAYER_DEFS.find(l => l.id === hoveredLayer)?.label}
                            </span>
                        </div>
                        <p style={{ fontSize: 10, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                            {LAYER_DEFS.find(l => l.id === hoveredLayer)?.explain}
                        </p>
                    </div>
                )}

                {/* No-results prompt */}
                {!results && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 500,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
                            padding: '24px 32px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🌾</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 4 }}>
                                Draw an AOI on the map
                            </div>
                            <p style={{ fontSize: 11, color: '#64748B', margin: 0, maxWidth: 220 }}>
                                Click &amp; drag to select a farm region. The GEE pipeline will fetch live Sentinel-1/2 satellite data and render a water + nitrogen deficit heatmap.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes ripple {
                    0%   { box-shadow: 0 0 0 0 rgba(45,212,191,0.5); }
                    70%  { box-shadow: 0 0 0 8px rgba(45,212,191,0); }
                    100% { box-shadow: 0 0 0 0 rgba(45,212,191,0); }
                }
            `}</style>
        </div>
    );
}
