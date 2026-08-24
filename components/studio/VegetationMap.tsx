'use client';

import React from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useStudio } from './StudioContext';
import dynamic from 'next/dynamic';

const NdviLayer = dynamic(() => import('./NdviLayer'), { ssr: false });

interface Cell { lat: number; lon: number; sar_vv: number; ndvi: number; demo?: boolean; }

function FitToAOI({ bounds }: { bounds?: [number, number, number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (!bounds) return;
        const [minLon, minLat, maxLon, maxLat] = bounds;
        map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24], maxZoom: 14 });
    }, [bounds, map]);
    return null;
}

export default function VegetationMap({ cells, bounds }: {
    cells: Cell[];
    bounds?: [number, number, number, number];
}) {
    const { baseLayer } = useStudio();

    const tileUrl = baseLayer === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const healthyCount = cells.filter(c => c.ndvi > 0.4).length;
    const stressedCount = cells.filter(c => c.ndvi < 0.2).length;
    const avgNdvi = cells.length ? (cells.reduce((a, b) => a + b.ndvi, 0) / cells.length).toFixed(2) : '—';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer center={[22.5, 82.5]} zoom={5} zoomControl style={{ width: '100%', height: '100%' }}>
                <TileLayer url={tileUrl} />
                <FitToAOI bounds={bounds} />
                {cells.length > 0 && <NdviLayer cells={cells} />}
            </MapContainer>

            {/* NDVI Colour Legend */}
            <div style={{
                position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
                background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)',
                borderRadius: 12, padding: '11px 14px', border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>NDVI Scale</div>
                {[
                    { color: '#DC2626', label: 'Dead / Bare soil', range: '< 0.0' },
                    { color: '#F97316', label: 'Crop Stressed', range: '0 – 0.2' },
                    { color: '#A3E635', label: 'Moderate Growth', range: '0.2 – 0.4' },
                    { color: '#16A34A', label: 'Healthy Crops', range: '> 0.4' },
                ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: '#E2E8F0', fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontSize: 9, color: '#64748B', marginLeft: 'auto' }}>{s.range}</span>
                    </div>
                ))}
            </div>

            {/* Quick stats badge */}
            <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 1000,
                background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)',
                borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', gap: 16,
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#4ADE80' }}>{avgNdvi}</div>
                    <div style={{ fontSize: 8, color: '#64748B', fontWeight: 700 }}>AVG NDVI</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#4ADE80' }}>{healthyCount}</div>
                    <div style={{ fontSize: 8, color: '#64748B', fontWeight: 700 }}>HEALTHY</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#F97316' }}>{stressedCount}</div>
                    <div style={{ fontSize: 8, color: '#64748B', fontWeight: 700 }}>STRESSED</div>
                </div>
            </div>
        </div>
    );
}
