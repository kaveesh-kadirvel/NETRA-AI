'use client';

import React, { useEffect, useState } from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import dynamic from 'next/dynamic';
import { Droplets, Info, AlertTriangle } from 'lucide-react';

const DualMap = dynamic(() => import('@/components/studio/SynchronizedDualMap'), { ssr: false });

interface Cell { lat: number; lon: number; sar_vv: number; ndvi: number; demo?: boolean; }

/* ─── Small metric chip ──────────────────────────────────────── */
function MetricChip({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
        <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: 14,
            padding: '14px 20px', textAlign: 'center', flex: 1, minWidth: 110,
        }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{label}</div>
            {sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{sub}</div>}
        </div>
    );
}

export default function CoreAnalysisPage() {
    const { results, cfg, drawnBounds } = useStudio();
    const metrics = results?.metrics || {};
    const [cells, setCells]   = useState<Cell[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDemo, setIsDemo]  = useState(false);

    // Derive AOI bounds — prefer drawn over results
    const aoi: [number, number, number, number] | undefined = (() => {
        if (drawnBounds) return [drawnBounds[0], drawnBounds[1], drawnBounds[2], drawnBounds[3]];
        const b = metrics.bounds;
        if (b && b.length >= 2) return [b[0][1], b[0][0], b[1][1], b[1][0]];
        if (cfg.min_lon && cfg.max_lon) return [cfg.min_lon, cfg.min_lat, cfg.max_lon, cfg.max_lat];
        return undefined;
    })();

    // Fetch real GEE pixel grid
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
                threshold: cfg.threshold || -2.0,
                ndvi_thresh: cfg.ndvi_thresh || -0.12,
                cloud_pct: cfg.cloud_pct || 25,
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

    const deficitCount = cells.filter(c => c.sar_vv < (cfg.threshold || -2.0)).length;
    const deficitPct   = cells.length ? Math.round(deficitCount / cells.length * 100) : 0;
    const waterArea    = (metrics.flood_area ?? 0).toFixed(1);
    const confidence   = ((metrics.peak_confidence ?? 0) * 100).toFixed(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>

            {/* ── Title ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Droplets size={16} color="#0369A1" />
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                            Soil Moisture Comparison
                        </h2>
                        {isDemo && (
                            <span style={{ fontSize: 9, fontWeight: 800, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 6, padding: '2px 8px' }}>
                                DEMO DATA
                            </span>
                        )}
                        {!isDemo && cells.length > 0 && (
                            <span style={{ fontSize: 9, fontWeight: 800, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px' }}>
                                🛰 LIVE GEE
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                        Scroll both satellite maps in sync — left shows baseline health, right shows today's water deficit zones
                    </p>
                </div>

                {/* Quick metrics bar */}
                {results && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <MetricChip label="Water Deficit" value={`${waterArea} km²`} color="#1D4ED8" sub="SAR detected" />
                        <MetricChip label="Area Affected" value={`${deficitPct}%`} color="#DC2626" sub="of selected field" />
                        <MetricChip label="Confidence" value={`${confidence}%`} color="#0D7377" sub="Bayesian model" />
                    </div>
                )}
            </div>

            {/* ── Dual Synchronized Maps ─────────────────────────────── */}
            <div style={{
                height: 440, borderRadius: 18, overflow: 'hidden',
                border: '1px solid #E2E8F0',
                position: 'relative',
                background: '#0F172A',
            }}>
                {!aoi ? (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 12, background: '#F8FAFC',
                    }}>
                        <Droplets size={36} color="#CBD5E1" />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                                Draw your farm first
                            </div>
                            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                                Go to the map tab → draw your farm field → run the analysis
                            </p>
                        </div>
                    </div>
                ) : loading ? (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: '#0F172A', gap: 12, zIndex: 10,
                    }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#38BDF8', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Fetching Sentinel-1 moisture data…</span>
                    </div>
                ) : (
                    <DualMap cells={cells} bounds={aoi} sarThresh={cfg.threshold || -2.0} />
                )}
            </div>

            {/* ── What this means in plain English ──────────────────── */}
            <div style={{
                background: 'white', border: '1px solid #E2E8F0',
                borderRadius: 16, padding: '18px 22px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
                <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 8, flexShrink: 0 }}>
                    <Info size={16} color="#2563EB" />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>What am I seeing?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                            { dot: '#22C55E', text: 'Green dots = healthy soil moisture level (normal baseline from before the stress period)' },
                            { dot: '#38BDF8', text: 'Blue dots = water deficit zones where your crop needs irrigation right now' },
                            { dot: '#64748B', text: 'Data source: Sentinel-1 SAR satellite (10m resolution) processed via Google Earth Engine' },
                        ].map(({ dot, text }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 3 }} />
                                <span style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6 }}>{text}</span>
                            </div>
                        ))}
                    </div>

                    {deficitPct > 20 && (
                        <div style={{
                            marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA',
                            borderRadius: 10, padding: '10px 14px',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <AlertTriangle size={14} color="#DC2626" />
                            <span style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
                                {deficitPct}% of your field shows water stress. Apply 20–40mm irrigation to blue zones today.
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
