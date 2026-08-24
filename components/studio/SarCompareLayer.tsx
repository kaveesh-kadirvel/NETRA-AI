'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Cell { lat: number; lon: number; sar_vv: number; ndvi: number; demo?: boolean; }

interface Props {
    cells: Cell[];
    mode: 'pre' | 'post';   // pre = healthy baseline, post = deficit view
    sarThresh: number;
}

/**
 * SarCompareLayer
 * Renders a canvas heatmap from real GEE SAR backscatter values.
 * pre-mode  → shows green (healthy baseline, cells above threshold)
 * post-mode → shows blue/red (deficit cells, below threshold)
 */
export default function SarCompareLayer({ cells, mode, sarThresh }: Props) {
    const map = useMap();
    const layerRef = useRef<L.Layer | null>(null);

    useEffect(() => {
        if (!cells.length) return;
        if (layerRef.current) map.removeLayer(layerRef.current);

        const CanvasLayer = L.Layer.extend({
            onAdd(map: L.Map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'sar-canvas');
                const sz = map.getSize();
                this._canvas.width = sz.x; this._canvas.height = sz.y;
                Object.assign(this._canvas.style, {
                    position: 'absolute', top: 0, left: 0,
                    pointerEvents: 'none', zIndex: '400',
                });
                map.getPanes().overlayPane.appendChild(this._canvas);
                map.on('moveend zoomend resize', this._draw, this);
                this._draw();
            },
            onRemove(map: L.Map) {
                map.off('moveend zoomend resize', this._draw, this);
                this._canvas?.parentNode?.removeChild(this._canvas);
            },
            _draw() {
                if (!this._canvas || !this._map) return;
                const map = this._map;
                const sz = map.getSize();
                this._canvas.width = sz.x; this._canvas.height = sz.y;
                const ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.clearRect(0, 0, sz.x, sz.y);
                L.DomUtil.setPosition(this._canvas, map.containerPointToLayerPoint([0, 0]));

                // Estimate blob radius from spread of points
                const pts = this._cells.map((c: Cell) => map.latLngToContainerPoint([c.lat, c.lon]));
                let minX = Infinity, maxX = -Infinity;
                pts.forEach((p: { x: number; y: number }) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
                const approxCols = Math.sqrt(this._cells.length);
                const radius = Math.max((maxX - minX) / approxCols * 0.7, 5);

                this._cells.forEach((cell: Cell, i: number) => {
                    const pt = pts[i];
                    const isDeficit = cell.sar_vv < this._sarThresh;

                    let grad: CanvasGradient;
                    if (this._mode === 'pre') {
                        // PRE: show everything green (baseline — fields were healthy)
                        const alpha = 0.30 + Math.min(Math.abs(cell.sar_vv + 8) / 8, 1) * 0.35;
                        grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
                        grad.addColorStop(0, `rgba(34, 197, 94, ${alpha})`);
                        grad.addColorStop(1, 'rgba(16,185,129,0)');
                        ctx.shadowColor = 'rgba(34,197,94,0.3)';
                        ctx.shadowBlur  = 6;
                    } else {
                        // POST: deficit = blue, healthy = light green
                        if (isDeficit) {
                            const intensity = Math.min(Math.abs(cell.sar_vv - this._sarThresh) / 4, 1);
                            const alpha = 0.4 + intensity * 0.45;
                            grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
                            grad.addColorStop(0, `rgba(56, 189, 248, ${alpha})`);
                            grad.addColorStop(0.5, `rgba(14,165,233,${alpha * 0.6})`);
                            grad.addColorStop(1, 'rgba(2,132,199,0)');
                            ctx.shadowColor = 'rgba(14,165,233,0.5)';
                            ctx.shadowBlur  = 12;
                        } else {
                            const alpha = 0.18;
                            grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius * 0.8);
                            grad.addColorStop(0, `rgba(34,197,94,${alpha})`);
                            grad.addColorStop(1, 'rgba(16,185,129,0)');
                            ctx.shadowBlur = 3;
                        }
                    }

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
            },
        });

        const layer = new (CanvasLayer as any)();
        layer._cells    = cells;
        layer._mode     = mode;
        layer._sarThresh = sarThresh;
        layer.addTo(map);
        layerRef.current = layer;

        return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
    }, [map, cells, mode, sarThresh]);

    return null;
}
