'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Cell { lat: number; lon: number; sar_vv: number; ndvi: number; demo?: boolean; }

/**
 * NdviLayer
 * Canvas heatmap for real Sentinel-2 NDVI values.
 * Colour scale:
 *   Red    → NDVI < 0    (bare soil / dead crops)
 *   Orange → 0 – 0.2    (sparse/stressed)
 *   Yellow → 0.2 – 0.4  (moderate growth)
 *   Green  → 0.4+        (healthy dense vegetation)
 */
export default function NdviLayer({ cells }: { cells: Cell[] }) {
    const map   = useMap();
    const layer = useRef<L.Layer | null>(null);

    useEffect(() => {
        if (!cells.length) return;
        if (layer.current) map.removeLayer(layer.current);

        const CanvasLayer = L.Layer.extend({
            onAdd(map: L.Map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'ndvi-canvas');
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

                const pts = this._cells.map((c: Cell) => map.latLngToContainerPoint([c.lat, c.lon]));
                let minX = Infinity, maxX = -Infinity;
                pts.forEach((p: { x: number; y: number }) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
                const radius = Math.max((maxX - minX) / Math.sqrt(this._cells.length) * 0.75, 5);

                this._cells.forEach((cell: Cell, i: number) => {
                    const pt = pts[i];
                    const v  = cell.ndvi;              // typically -0.3 to 0.8

                    // Map NDVI to colour
                    let r: number, g: number, b: number, alpha: number;
                    if (v < 0) {
                        // Red — bare soil or dead
                        r = 220; g = 38; b = 38; alpha = 0.55 + Math.min(Math.abs(v), 0.4) * 0.6;
                    } else if (v < 0.2) {
                        // Orange — sparse / stressed
                        r = 249; g = 115; b = 22; alpha = 0.45 + v * 1.5;
                    } else if (v < 0.4) {
                        // Yellow-green — moderate
                        r = 163; g = 230; b = 53; alpha = 0.40 + v;
                    } else {
                        // Deep green — healthy
                        r = 22; g = 163; b = 74; alpha = 0.45 + Math.min(v - 0.4, 0.4) * 0.8;
                    }
                    alpha = Math.min(alpha, 0.90);

                    ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
                    ctx.shadowBlur  = 10;
                    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
                    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
                    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
            },
        });

        const l = new (CanvasLayer as any)();
        l._cells = cells;
        l.addTo(map);
        layer.current = l;
        return () => { if (layer.current) map.removeLayer(layer.current); };
    }, [map, cells]);

    return null;
}
