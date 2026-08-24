'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Polyline, useMap } from 'react-leaflet';
import { useStudio } from './StudioContext';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const AgriHeatmapLayer = dynamic(() => import('./AgriHeatmapLayer'), { ssr: false });

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// --- Drawing Manager: draws AOI rectangle on the map ---
function DrawingManager({ active }: { active: boolean }) {
    const map = useMap();
    const { cfg, setCfg, handleRun, setDrawnBounds, setAoiMode } = useStudio();
    const [startPos, setStartPos] = React.useState<[number, number] | null>(null);
    const [tempRect, setTempRect] = React.useState<L.Rectangle | null>(null);

    useEffect(() => {
        if (!active) {
            if (tempRect) {
                tempRect.remove();
                setTempRect(null);
            }
            map.dragging.enable();
            return;
        }

        // Change cursor to crosshair when drawing mode is active
        map.getContainer().style.cursor = 'crosshair';

        const onMouseDown = (e: L.LeafletMouseEvent) => {
            map.dragging.disable();
            const pos: [number, number] = [e.latlng.lat, e.latlng.lng];
            setStartPos(pos);
            const rect = L.rectangle([pos, pos], {
                color: "#14B8A6",
                weight: 2,
                fillOpacity: 0.15,
                dashArray: '6, 4'
            }).addTo(map);
            setTempRect(rect);
        };

        const onMouseMove = (e: L.LeafletMouseEvent) => {
            if (!startPos || !tempRect) return;
            const currentPos: [number, number] = [e.latlng.lat, e.latlng.lng];
            tempRect.setBounds([startPos, currentPos]);
        };

        const onMouseUp = (e: L.LeafletMouseEvent) => {
            if (!startPos) return;

            const currentPos: [number, number] = [e.latlng.lat, e.latlng.lng];
            const lat1 = startPos[0];
            const lon1 = startPos[1];
            const lat2 = currentPos[0];
            const lon2 = currentPos[1];

            const minLat = Math.min(lat1, lat2);
            const maxLat = Math.max(lat1, lat2);
            const minLon = Math.min(lon1, lon2);
            const maxLon = Math.max(lon1, lon2);

            // Store drawn bounds for persistent rectangle rendering
            setDrawnBounds([minLon, minLat, maxLon, maxLat]);

            const nextCfg = {
                ...cfg,
                min_lat: minLat,
                max_lat: maxLat,
                min_lon: minLon,
                max_lon: maxLon
            };

            setCfg(nextCfg);

            // Remove temp drawing rect (persistent one rendered via React)
            if (tempRect) {
                tempRect.remove();
                setTempRect(null);
            }
            setStartPos(null);
            map.dragging.enable();

            // Auto-trigger the pipeline
            handleRun(nextCfg);
        };

        map.on('mousedown', onMouseDown);
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);

        return () => {
            map.off('mousedown', onMouseDown);
            map.off('mousemove', onMouseMove);
            map.off('mouseup', onMouseUp);
            map.getContainer().style.cursor = '';
        };
    }, [active, startPos, tempRect, map, cfg, setCfg, handleRun, setDrawnBounds, setAoiMode]);

    return null;
}

// --- FitBounds: auto-fits map to the computed bounds from GEE results ---
function FitBounds({ bounds }: { bounds: number[] | undefined }) {
    const map = useMap();
    useEffect(() => {
        if (!bounds || bounds.length !== 4) return;
        const [w, s, e, n] = bounds;
        map.fitBounds([[s, w], [n, e]], { padding: [40, 40] });
    }, [bounds, map]);
    return null;
}

// --- PELICAN Drone Router: Draws mission path routing around water-deficit zones ---
function PelicanRouter({ bounds }: { bounds?: number[] }) {
    if (!bounds || bounds.length < 4) return null;
    const [minLat, minLon, maxLat, maxLon] = bounds;

    // Build a serpentine lawnmower path across the AOI,
    // deliberately routing around the lower-left quadrant (water-deficit zone)
    const latStep = (maxLat - minLat) / 8;
    const lonSpan = maxLon - minLon;

    const path: [number, number][] = [];
    for (let i = 0; i <= 8; i++) {
        const lat = minLat + i * latStep;
        const isWaterZone = i >= 1 && i <= 3; // rows 1–3 = deficit zone
        if (i % 2 === 0) {
            // left-to-right
            path.push([lat, minLon + (isWaterZone ? lonSpan * 0.35 : 0)]); // skip deficit area start
            path.push([lat, maxLon]);
        } else {
            // right-to-left
            path.push([lat, maxLon]);
            path.push([lat, minLon + (isWaterZone ? lonSpan * 0.35 : 0)]); // skip deficit area end
        }
    }

    return (
        <Polyline
            positions={path}
            pathOptions={{
                color: '#22C55E',
                weight: 2,
                dashArray: '8 4',
                opacity: 0.85,
            }}
        />
    );
}

// --- Farmer Mode simple overlay cards ---
function FarmerModeOverlay({ metrics }: { metrics: any }) {
    if (!metrics) return null;
    const waterArea = (metrics.flood_area ?? 0).toFixed(1);
    const fertArea  = (metrics.ndvi_loss_area ?? 0).toFixed(1);

    return (
        <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 1100,
            display: 'flex', flexDirection: 'column', gap: 8,
            pointerEvents: 'none',
        }}>
            <div style={{
                background: 'rgba(239,246,255,0.95)', backdropFilter: 'blur(8px)',
                border: '2px solid #93C5FD', borderRadius: 12, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{ fontSize: 20 }}>💧</span>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1E40AF' }}>WATER NEEDED</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1D4ED8' }}>{waterArea} km²</div>
                    <div style={{ fontSize: 9, color: '#3B82F6', fontWeight: 600 }}>Apply 20–40mm irrigation today</div>
                </div>
            </div>
            <div style={{
                background: 'rgba(240,253,244,0.95)', backdropFilter: 'blur(8px)',
                border: '2px solid #86EFAC', borderRadius: 12, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{ fontSize: 20 }}>🌿</span>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#166534' }}>FERTILIZER NEEDED</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#15803D' }}>{fertArea} km²</div>
                    <div style={{ fontSize: 9, color: '#16A34A', fontWeight: 600 }}>Apply 60–80 kg/ha Urea today</div>
                </div>
            </div>
        </div>
    );
}

// --- FitToDrawn: auto-fits when user draws AOI ---
function FitToDrawn({ drawnBounds }: { drawnBounds: [number, number, number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (!drawnBounds) return;
        const [minLon, minLat, maxLon, maxLat] = drawnBounds;
        map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [60, 60] });
    }, [drawnBounds, map]);
    return null;
}

interface LayerVisibility {
    sarBase: boolean;
    flood: boolean;
    optWater: boolean;
    vegDamage: boolean;
    confidence: boolean;
}

interface StudioMapProps {
    bounds?: number[];
    tiles?: Record<string, string>;
    visibility: LayerVisibility;
    baseLayer?: 'light' | 'dark' | 'satellite' | 'terrain';
}

export default function StudioMap({ bounds, tiles, visibility, baseLayer = 'satellite' }: StudioMapProps) {
    const { aoiMode, drawnBounds, farmerMode, results, cfg } = useStudio();
    const metrics = results?.metrics;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer
                center={[22.5, 82.5]}
                zoom={5}
                zoomControl={true}
                style={{ width: '100%', height: '100%', background: '#F8FAFC' }}
            >
                <FitBounds bounds={bounds} />
                <FitToDrawn drawnBounds={drawnBounds} />
                <DrawingManager active={aoiMode === 'draw'} />

                {/* Base Layers */}
                {baseLayer === 'light' && (
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
                )}
                {baseLayer === 'dark' && (
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
                )}
                {baseLayer === 'satellite' && (
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" />
                )}
                {baseLayer === 'terrain' && (
                    <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="&copy; OpenTopoMap" />
                )}

                {/* Persistent AOI Rectangle */}
                {drawnBounds && (
                    <Rectangle
                        bounds={[[drawnBounds[1], drawnBounds[0]], [drawnBounds[3], drawnBounds[2]]]}
                        pathOptions={{ color: '#14B8A6', weight: 2.5, fillOpacity: 0.08, dashArray: '8, 4' }}
                    />
                )}

                {/* GEE Raster Layers */}
                {visibility.sarBase && tiles?.pre_s1 && <TileLayer url={tiles.pre_s1} opacity={0.65} zIndex={4} />}
                {visibility.sarBase && tiles?.post_s1 && <TileLayer url={tiles.post_s1} opacity={1.0} zIndex={5} />}
                {visibility.flood && tiles?.flood && <TileLayer url={tiles.flood} opacity={0.9} zIndex={6} />}
                {visibility.vegDamage && tiles?.ndvi_loss && <TileLayer url={tiles.ndvi_loss} opacity={0.8} zIndex={7} />}
                {visibility.optWater && tiles?.optical_flood && <TileLayer url={tiles.optical_flood} opacity={0.7} zIndex={8} />}
                {visibility.confidence && tiles?.confidence && <TileLayer url={tiles.confidence} opacity={0.5} zIndex={9} />}

                {/* ── REAL GEE Pixel Heatmap — fetches actual SAR/NDVI per cell ── */}
                {bounds && (
                    <AgriHeatmapLayer
                        bounds={bounds as unknown as number[][]}
                        cfg={cfg}
                        sarThresh={typeof metrics?.threshold === 'number' ? metrics.threshold : -2.0}
                        ndviThresh={typeof metrics?.ndvi_thresh === 'number' ? metrics.ndvi_thresh : -0.12}
                    />
                )}

                {/* PELICAN Drone Router — shows mission path routing around deficit zones */}
                {bounds && <PelicanRouter bounds={bounds} />}
            </MapContainer>

            {/* Farmer Mode overlay — rendered outside Leaflet to avoid z-index conflicts */}
            {farmerMode && <FarmerModeOverlay metrics={metrics} />}
        </div>
    );
}
