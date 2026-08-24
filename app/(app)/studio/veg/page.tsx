'use client';

import React, { useEffect, useState } from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import dynamic from 'next/dynamic';
import { Leaf, Info, AlertTriangle, Droplets, FlaskConical, Zap } from 'lucide-react';
import MissionDispatchModal from '@/components/studio/MissionDispatchModal';

const VegMap = dynamic(() => import('@/components/studio/VegetationMap'), { ssr: false });

interface Cell { lat: number; lon: number; sar_vv: number; ndvi: number; demo?: boolean; }

function StatCard({ emoji, label, value, color, sub }: { emoji: string; label: string; value: string; color: string; sub: string }) {
    return (
        <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: 14,
            padding: '16px 20px', flex: 1, minWidth: 130,
        }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{label}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
        </div>
    );
}

export default function VegetationNDVIPage() {
    const { results, cfg, drawnBounds } = useStudio();
    const metrics = results?.metrics || {};

    const [cells, setCells]    = useState<Cell[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDemo, setIsDemo]  = useState(false);
    const [missionOpen,  setMissionOpen]  = useState(false);
    const [missionPayload, setMissionPayload] = useState<any>(null);

    function openMission(actionType: 'fertilizer' | 'irrigation', quantity: string) {
        setMissionPayload({
            farmName:    results?.farm_name || 'Selected Field',
            actionType,
            healthScore: Math.round((metrics.peak_confidence ?? 0.75) * 100),
            area:        `${(metrics.aoi_km2 ?? 0).toFixed(1)} km²`,
            quantity,
            riskLevel:   (metrics.peak_confidence ?? 0) > 0.7 ? 'HIGH' : 'MEDIUM',
            lat:         aoi ? (aoi[1] + aoi[3]) / 2 : undefined,
            lng:         aoi ? (aoi[0] + aoi[2]) / 2 : undefined,
        });
        setMissionOpen(true);
    }

    // Derive AOI
    const aoi: [number, number, number, number] | undefined = (() => {
        if (drawnBounds) return [drawnBounds[0], drawnBounds[1], drawnBounds[2], drawnBounds[3]];
        const b = metrics.bounds;
        if (b && b.length >= 2) return [b[0][1], b[0][0], b[1][1], b[1][0]];
        if (cfg.min_lon && cfg.max_lon) return [cfg.min_lon, cfg.min_lat, cfg.max_lon, cfg.max_lat];
        return undefined;
    })();

    // Fetch real GEE NDVI grid
    useEffect(() => {
        if (!aoi) return;
        const [minLon, minLat, maxLon, maxLat] = aoi;
        setLoading(true);
        fetch('/api/studio/pixel-grid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                min_lon: minLon, min_lat: minLat,
                max_lon: maxLon, max_lat: maxLat,
                post_start: results?.pre_start || '2024-02-01',
                post_end:   results?.post_end  || '2024-02-28',
                threshold:   cfg.threshold   || -2.0,
                ndvi_thresh: cfg.ndvi_thresh || -0.12,
                cloud_pct:   cfg.cloud_pct   || 25,
                scale: Math.max(cfg.scale || 150, 300),
            }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success && d.cells?.length) {
                    setCells(d.cells);
                    setIsDemo(d.cells[0]?.demo === true);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [JSON.stringify(aoi)]);

    // Derived stats from real NDVI values
    const totalCells   = cells.length || 1;
    const healthy      = cells.filter(c => c.ndvi > 0.4).length;
    const stressed     = cells.filter(c => c.ndvi >= 0.2 && c.ndvi <= 0.4).length;
    const critical     = cells.filter(c => c.ndvi < 0.2).length;
    const avgNdvi      = cells.length ? (cells.reduce((a, b) => a + b.ndvi, 0) / cells.length).toFixed(2) : '—';
    const healthyPct   = Math.round(healthy   / totalCells * 100);
    const criticalPct  = Math.round(critical  / totalCells * 100);

    const waterArea = (metrics.flood_area    ?? 0).toFixed(1);
    const fertArea  = (metrics.ndvi_loss_area ?? 0).toFixed(1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Leaf size={16} color="#16A34A" />
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                        Crop Health Map
                    </h2>
                    {isDemo && (
                        <span style={{ fontSize: 9, fontWeight: 800, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 6, padding: '2px 8px' }}>
                            DEMO DATA
                        </span>
                    )}
                    {!isDemo && cells.length > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 800, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px' }}>
                            🛰 LIVE GEE · Sentinel-2
                        </span>
                    )}
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    Colour-coded map of your field — green is healthy, red means your crops need fertilizer
                </p>
            </div>

            {/* ── Stats strip ────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <StatCard emoji="🌿" label="Healthy Zones" value={`${healthyPct}%`} color="#16A34A" sub={`NDVI > 0.4 · ${healthy} points`} />
                <StatCard emoji="⚠️" label="Crop Stressed" value={`${criticalPct}%`} color="#D97706" sub={`NDVI < 0.2 · ${critical} points`} />
                <StatCard emoji="📊" label="Avg NDVI" value={avgNdvi} color="#0D7377" sub="Field average (0–1 scale)" />
                <StatCard emoji="💧" label="Needs Water" value={`${waterArea} km²`} color="#1D4ED8" sub="Apply 20–40mm today" />
                <StatCard emoji="🌱" label="Needs Fertilizer" value={`${fertArea} km²`} color="#DC2626" sub="Apply 60–80 kg/ha Urea" />
            </div>

            {/* ── NDVI Map ───────────────────────────────────────────── */}
            <div style={{
                height: 420, borderRadius: 18, overflow: 'hidden',
                border: '1px solid #E2E8F0', position: 'relative',
                background: '#0F172A',
            }}>
                {!aoi ? (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: '#F8FAFC', gap: 12,
                    }}>
                        <Leaf size={36} color="#CBD5E1" />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Draw your farm first</div>
                            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Go to the Map tab → draw your field → run the scan</p>
                        </div>
                    </div>
                ) : loading ? (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: '#0F172A', gap: 12, zIndex: 10,
                    }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#4ADE80', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Fetching Sentinel-2 NDVI data…</span>
                    </div>
                ) : (
                    <VegMap cells={cells} bounds={aoi} />
                )}
            </div>

            {/* ── Prescription Cards with ACTION BUTTONS ───────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* WATER / IRRIGATION */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ background: '#2563EB', borderRadius: 8, padding: 7, display: 'flex' }}>
                            <Droplets size={14} color="white" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>Irrigation Needed</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#1D4ED8', marginBottom: 6, letterSpacing: '-0.03em' }}>
                        {waterArea} km²
                    </div>
                    <p style={{ fontSize: 11, color: '#3B82F6', lineHeight: 1.7, margin: '0 0 14px' }}>
                        SAR backscatter confirms soil moisture below critical threshold. Apply <strong>20–40mm of water</strong> today.
                    </p>
                    <button
                        onClick={() => openMission('irrigation', '20–40mm water')}
                        style={{
                            width: '100%', background: 'linear-gradient(135deg, #1D4ED8, #0369A1)',
                            border: 'none', borderRadius: 10, padding: '11px',
                            color: 'white', fontSize: 12, fontWeight: 800,
                            cursor: 'pointer', letterSpacing: '0.03em',
                            boxShadow: '0 6px 20px rgba(29,78,216,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                    >
                        <Zap size={13} />
                        💧 Dispatch Irrigation Mission
                    </button>
                </div>

                {/* FERTILIZER */}
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ background: '#16A34A', borderRadius: 8, padding: 7, display: 'flex' }}>
                            <FlaskConical size={14} color="white" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>Fertilizer Needed</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#15803D', marginBottom: 6, letterSpacing: '-0.03em' }}>
                        {fertArea} km²
                    </div>
                    <p style={{ fontSize: 11, color: '#16A34A', lineHeight: 1.7, margin: '0 0 14px' }}>
                        NDVI dropped &gt;12% — nitrogen deficiency. Apply <strong>60–80 kg/ha Urea</strong>. Treat red zones first.
                    </p>
                    <button
                        onClick={() => openMission('fertilizer', '60–80 kg/ha Urea')}
                        style={{
                            width: '100%', background: 'linear-gradient(135deg, #16A34A, #0D7377)',
                            border: 'none', borderRadius: 10, padding: '11px',
                            color: 'white', fontSize: 12, fontWeight: 800,
                            cursor: 'pointer', letterSpacing: '0.03em',
                            boxShadow: '0 6px 20px rgba(22,163,74,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                    >
                        <Zap size={13} />
                        🌱 Dispatch Fertilizer Mission
                    </button>
                </div>
            </div>

            {/* ── Explain what NDVI means ────────────────────────────── */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14 }}>
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 8, flexShrink: 0 }}>
                    <Info size={15} color="#16A34A" />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>What is NDVI?</div>
                    <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.7, margin: 0 }}>
                        NDVI (Normalized Difference Vegetation Index) measures how green and alive your crops are using satellite photos.
                        A value of <strong>1.0</strong> means very lush crops. A value of <strong>0</strong> means bare soil.
                        A value <strong>below 0.2</strong> means your crops are severely stressed and need immediate attention.
                        This data comes directly from the <strong>Sentinel-2 satellite</strong> processed in Google Earth Engine.
                    </p>
                    {criticalPct > 15 && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>
                            <AlertTriangle size={13} color="#DC2626" />
                            <span style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>
                                {criticalPct}% of your field is in critical stress (NDVI &lt; 0.2). Act within 48 hours to prevent yield loss.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── Mission Dispatch Modal ──────────────────────── */}
            <MissionDispatchModal
                open={missionOpen}
                payload={missionPayload}
                onClose={() => setMissionOpen(false)}
            />
        </div>
    );
}
