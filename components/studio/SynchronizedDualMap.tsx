'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useStudio } from './StudioContext';
import dynamic from 'next/dynamic';

const SarCompareLayer = dynamic(() => import('./SarCompareLayer'), { ssr: false });

interface Cell { lat: number; lon: number; sar_vv: number; ndvi: number; demo?: boolean; }

function MapWatcher({ setMap }: { setMap: (m: L.Map) => void }) {
    const map = useMap();
    useEffect(() => { if (map) setMap(map); }, [map, setMap]);
    return null;
}

function FitToAOI({ bounds }: { bounds?: [number, number, number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (!bounds) return;
        const [minLon, minLat, maxLon, maxLat] = bounds;
        map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24], maxZoom: 14 });
    }, [bounds, map]);
    return null;
}

function SyncMaps({ map1, map2 }: { map1: L.Map | null; map2: L.Map | null }) {
    useEffect(() => {
        if (!map1 || !map2) return;
        const onMove1 = () => {
            if (map2.getCenter().distanceTo(map1.getCenter()) > 1 || map2.getZoom() !== map1.getZoom()) {
                map2.setView(map1.getCenter(), map1.getZoom(), { animate: false });
            }
        };
        const onMove2 = () => {
            if (map1.getCenter().distanceTo(map2.getCenter()) > 1 || map1.getZoom() !== map2.getZoom()) {
                map1.setView(map2.getCenter(), map2.getZoom(), { animate: false });
            }
        };
        map1.on('move', onMove1); map2.on('move', onMove2);
        return () => { map1.off('move', onMove1); map2.off('move', onMove2); };
    }, [map1, map2]);
    return null;
}

export default function SynchronizedDualMap({ cells, bounds, sarThresh = -2.0 }: {
    cells: Cell[];
    bounds?: [number, number, number, number];  // [minLon, minLat, maxLon, maxLat]
    sarThresh?: number;
}) {
    const [map1, setMap1] = useState<L.Map | null>(null);
    const [map2, setMap2] = useState<L.Map | null>(null);
    const { baseLayer } = useStudio();

    const tileUrl = baseLayer === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const deficitCount = cells.filter(c => c.sar_vv < sarThresh).length;
    const pct = cells.length ? Math.round(deficitCount / cells.length * 100) : 0;

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%', gap: 3 }}>
            {/* PRE-EVENT — Healthy Baseline */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '14px 0 0 14px' }}>
                <MapContainer center={[22.5, 82.5]} zoom={5} zoomControl style={{ width: '100%', height: '100%' }}>
                    <TileLayer url={tileUrl} />
                    <MapWatcher setMap={setMap1} />
                    <FitToAOI bounds={bounds} />
                    {cells.length > 0 && <SarCompareLayer cells={cells} mode="pre" sarThresh={sarThresh} />}
                </MapContainer>
                <div style={{
                    position: 'absolute', top: 12, left: 52, zIndex: 1000,
                    background: 'rgba(22,101,52,0.92)', backdropFilter: 'blur(8px)',
                    color: 'white', padding: '6px 14px', borderRadius: 8,
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
                    border: '1px solid rgba(134,239,172,0.4)',
                }}>
                    🟢 BEFORE — Baseline Moisture
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, background: 'rgba(15,23,42,0.85)', borderRadius: 8, padding: '5px 10px', color: '#86EFAC', fontSize: 10, fontWeight: 700 }}>
                    {cells.length || '—'} GEE sample points
                </div>
            </div>

            {/* POST-EVENT — Deficit View */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '0 14px 14px 0' }}>
                <MapContainer center={[22.5, 82.5]} zoom={5} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                    <TileLayer url={tileUrl} />
                    <MapWatcher setMap={setMap2} />
                    <FitToAOI bounds={bounds} />
                    {cells.length > 0 && <SarCompareLayer cells={cells} mode="post" sarThresh={sarThresh} />}
                </MapContainer>
                <div style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 1000,
                    background: 'rgba(30,64,175,0.92)', backdropFilter: 'blur(8px)',
                    color: 'white', padding: '6px 14px', borderRadius: 8,
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
                    border: '1px solid rgba(147,197,253,0.4)',
                }}>
                    🔵 NOW — Water Deficit Zones
                </div>
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'rgba(15,23,42,0.85)', borderRadius: 8, padding: '5px 10px', color: '#93C5FD', fontSize: 10, fontWeight: 700 }}>
                    {pct}% area deficit
                </div>
            </div>
            {map1 && map2 && <SyncMaps map1={map1} map2={map2} />}
        </div>
    );
}
