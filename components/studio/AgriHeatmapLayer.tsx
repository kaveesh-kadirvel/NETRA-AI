'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface PixelCell {
    lat: number;
    lon: number;
    sar_vv: number;  // dB — negative values, deeper = more water deficit
    ndvi: number;    // 0-1, lower = more nitrogen/crop stress
    demo?: boolean;
}

interface Props {
    bounds: number[][];   // [[minLat,minLon],[maxLat,maxLon]]
    cfg: any;             // pipeline config (dates, thresholds)
    sarThresh: number;    // SAR deficit threshold (e.g. -2.0 dB)
    ndviThresh: number;   // NDVI deficit threshold (e.g. -0.12)
}

/**
 * AgriHeatmapLayer — REAL satellite pixel heatmap
 *
 * Fetches actual Sentinel-1 SAR backscatter and Sentinel-2 NDVI values
 * via the /api/studio/pixel-grid endpoint (which calls GEE directly).
 * Each pixel cell's lat/lon comes from real GEE sample points.
 *
 * Colour encoding:
 *   🔵 Blue  → SAR VV below sarThresh → water deficit (soil saturated / under-irrigated)
 *   🔴 Red   → NDVI below ndviThresh  → nitrogen stress / crop health loss
 *   🟢 Green → both within normal range → healthy crop
 */
export default function AgriHeatmapLayer({ bounds, cfg, sarThresh, ndviThresh }: Props) {
    const map = useMap();
    const layerRef = useRef<L.Layer | null>(null);
    const [cells, setCells] = useState<PixelCell[]>([]);
    const [isDemo, setIsDemo] = useState(false);

    // ── Fetch real pixel data from GEE ──────────────────────────────────
    useEffect(() => {
        if (!bounds || bounds.length < 2) return;
        const [sw, ne] = bounds;

        const fetchGrid = async () => {
            try {
                const res = await fetch('/api/studio/pixel-grid', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        min_lon: sw[1], min_lat: sw[0],
                        max_lon: ne[1], max_lat: ne[0],
                        post_start: cfg?.post_start || '2024-02-01',
                        post_end:   cfg?.post_end   || '2024-02-28',
                        threshold:  sarThresh,
                        ndvi_thresh: ndviThresh,
                        cloud_pct:  cfg?.cloud_pct  || 25,
                        scale:      cfg?.scale      || 150,
                    }),
                });
                const json = await res.json();
                if (json.success && Array.isArray(json.cells) && json.cells.length > 0) {
                    setCells(json.cells);
                    setIsDemo(json.cells[0]?.demo === true);
                }
            } catch (e) {
                console.error('[AgriHeatmap] Pixel grid fetch failed:', e);
            }
        };

        fetchGrid();
    }, [bounds, sarThresh, ndviThresh, cfg?.post_start, cfg?.post_end]);

    // ── Render canvas from real pixel cells ──────────────────────────────
    useEffect(() => {
        if (!cells.length || !bounds || bounds.length < 2) return;
        const [sw, ne] = bounds;

        if (layerRef.current) map.removeLayer(layerRef.current);

        const CanvasLayer = L.Layer.extend({
            onAdd(map: L.Map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'agri-heatmap-canvas');
                const size = map.getSize();
                this._canvas.width  = size.x;
                this._canvas.height = size.y;
                Object.assign(this._canvas.style, {
                    position: 'absolute', top: '0', left: '0',
                    pointerEvents: 'none', zIndex: '300',
                });
                map.getPanes().overlayPane.appendChild(this._canvas);
                map.on('moveend zoomend resize', this._draw, this);
                this._draw();
            },
            onRemove(map: L.Map) {
                map.off('moveend zoomend resize', this._draw, this);
                if (this._canvas?.parentNode) {
                    this._canvas.parentNode.removeChild(this._canvas);
                }
            },
            _draw() {
                if (!this._canvas || !this._map) return;
                const map = this._map;
                const size = map.getSize();
                this._canvas.width  = size.x;
                this._canvas.height = size.y;
                const ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
                if (!ctx) return;
                ctx.clearRect(0, 0, size.x, size.y);

                const topLeft = map.containerPointToLayerPoint([0, 0]);
                L.DomUtil.setPosition(this._canvas, topLeft);

                // Estimate blob radius from cell density
                const ptSW = map.latLngToContainerPoint([sw[0], sw[1]]);
                const ptNE = map.latLngToContainerPoint([ne[0], ne[1]]);
                const pxWidth  = Math.abs(ptNE.x - ptSW.x);
                const pxHeight = Math.abs(ptSW.y - ptNE.y);
                const cellCount = Math.sqrt(this._cells.length);
                const radius = Math.max(Math.min(pxWidth, pxHeight) / cellCount * 0.85, 4);

                for (const cell of (this._cells as PixelCell[])) {
                    const pt = map.latLngToContainerPoint([cell.lat, cell.lon]);

                    // Determine cell type from real SAR/NDVI values
                    const isWater    = cell.sar_vv < this._sarThresh;
                    const isNitrogen = cell.ndvi   < this._ndviThresh;

                    let intensity: number;
                    let grad: CanvasGradient;

                    if (isWater) {
                        // Intensity = how far below threshold (deeper deficit = brighter)
                        intensity = Math.min(Math.abs(cell.sar_vv - this._sarThresh) / 3, 1);
                        intensity = Math.max(intensity, 0.35);
                        ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';
                        ctx.shadowBlur  = 10;
                        grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
                        grad.addColorStop(0,   `rgba(56, 189, 248, ${intensity})`);
                        grad.addColorStop(0.4, `rgba(14, 165, 233, ${intensity * 0.7})`);
                        grad.addColorStop(1,   'rgba(2, 132, 199, 0)');

                    } else if (isNitrogen) {
                        intensity = Math.min(Math.abs(cell.ndvi - this._ndviThresh) / 0.3, 1);
                        intensity = Math.max(intensity, 0.35);
                        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
                        ctx.shadowBlur  = 12;
                        grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
                        grad.addColorStop(0,   `rgba(239, 68, 68, ${intensity})`);
                        grad.addColorStop(0.4, `rgba(249, 115, 22, ${intensity * 0.7})`);
                        grad.addColorStop(1,   'rgba(253, 186, 116, 0)');

                    } else {
                        // Healthy — light green, lower opacity
                        intensity = 0.25;
                        ctx.shadowColor = 'rgba(34, 197, 94, 0.2)';
                        ctx.shadowBlur  = 5;
                        grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius * 0.8);
                        grad.addColorStop(0, `rgba(34, 197, 94, ${intensity})`);
                        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    }

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            },
        });

        const layer = new (CanvasLayer as any)();
        layer._cells     = cells;
        layer._sarThresh = sarThresh;
        layer._ndviThresh = ndviThresh;
        layer.addTo(map);
        layerRef.current = layer;

        return () => {
            if (layerRef.current) map.removeLayer(layerRef.current);
        };
    }, [map, cells, bounds, sarThresh, ndviThresh]);

    return null;
}
