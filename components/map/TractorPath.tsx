'use client';

/**
 * TractorPath.tsx — PELICAN Navigation Overlay
 * Draws a waypoint route through a farm that avoids waterlogged / flooded zones.
 * Uses the farm GeoJSON polygon + heatmap cells to compute a safe path.
 * Rendered as an animated dashed Leaflet Polyline.
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Cell { lat: number; lon: number; sar_vv?: number; ndvi?: number; demo?: boolean; }

interface TractorPathProps {
    farmBounds: [number, number][];    // [ [lat,lng], ... ] polygon boundary
    floodCells?: Cell[];               // pixel-grid cells (waterlogged = sar_vv < -1.5)
    visible: boolean;
}

/** Simple boustrophedon (back-and-forth rows) path generator */
function computeSafePath(bounds: [number, number][], floodCells: Cell[]): [number, number][] {
    if (!bounds || bounds.length < 3) return [];

    // Polygon bounding box
    const lats = bounds.map(b => b[0]);
    const lngs = bounds.map(b => b[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

    // Flooded cell centres (bad zones to avoid)
    const floodSet = new Set(
        floodCells.filter(c => (c.sar_vv ?? 0) < -1.5)
            .map(c => `${c.lat.toFixed(3)},${c.lon.toFixed(3)}`)
    );

    function isFlooded(lat: number, lng: number): boolean {
        // Check within ~50m radius (0.0005° ≈ 55m)
        return floodCells.some(c =>
            (c.sar_vv ?? 0) < -1.5 &&
            Math.abs(c.lat - lat) < 0.0008 &&
            Math.abs(c.lon - lng) < 0.001
        );
    }

    const rows = 8;
    const waypoints: [number, number][] = [];
    const padding = 0.0002;

    for (let r = 0; r < rows; r++) {
        const lat = minLat + padding + (r + 0.5) * ((maxLat - maxLat * 0.001) - minLat) / rows;
        const leftToRight = r % 2 === 0;
        const start: [number, number] = [lat, leftToRight ? minLng + padding : maxLng - padding];
        const end: [number, number]   = [lat, leftToRight ? maxLng - padding : minLng + padding];

        // Insert avoidance waypoints around flooded cells
        const steps = 6;
        let prev = start;
        waypoints.push(start);
        for (let s = 1; s < steps; s++) {
            const frac = s / steps;
            let wLng = start[1] + (end[1] - start[1]) * frac;
            let wLat = lat;
            if (isFlooded(wLat, wLng)) {
                // Dodge around it — shift north or south by ~150m
                wLat = lat + (r % 2 === 0 ? 0.0014 : -0.0014);
            }
            waypoints.push([wLat, wLng]);
            prev = [wLat, wLng];
        }
        waypoints.push(end);
    }

    return waypoints;
}

/** Tractor icon marker */
function makeTractorIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:#0D7377;border:2px solid white;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            animation:tractorBlink 1s infinite alternate;
        ">🚜</div>
        <style>@keyframes tractorBlink{from{transform:scale(1)}to{transform:scale(1.1)}}</style>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

export default function TractorPath({ farmBounds, floodCells = [], visible }: TractorPathProps) {
    const map = useMap();

    useEffect(() => {
        if (!visible || farmBounds.length < 3) return;

        const waypoints = computeSafePath(farmBounds, floodCells);
        if (waypoints.length < 2) return;

        const layers: L.Layer[] = [];

        // Flood avoidance zone shading
        floodCells.filter(c => (c.sar_vv ?? 0) < -1.5).forEach(c => {
            const circle = L.circle([c.lat, c.lon], {
                radius: 60,
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.12,
                weight: 1,
                dashArray: '4 4',
            }).addTo(map);
            circle.bindPopup('⚠️ Waterlogged — PELICAN avoided this zone');
            layers.push(circle);
        });

        // Main path line (dashed teal)
        const pathLine = L.polyline(waypoints, {
            color: '#0D7377',
            weight: 3,
            dashArray: '10 6',
            dashOffset: '0',
            opacity: 0.85,
            lineCap: 'round',
        }).addTo(map);
        pathLine.bindPopup('🚜 PELICAN Safe Route — avoids ' + floodCells.filter(c => (c.sar_vv ?? 0) < -1.5).length + ' waterlogged zones');
        layers.push(pathLine);

        // Direction arrows at each row turn
        for (let i = 0; i < waypoints.length - 1; i += 6) {
            const marker = L.circleMarker(waypoints[i], {
                radius: 3, color: '#14B8A6', fillColor: '#14B8A6',
                fillOpacity: 1, weight: 0,
            }).addTo(map);
            layers.push(marker);
        }

        // Animated tractor head
        const tractorMarker = L.marker(waypoints[0], { icon: makeTractorIcon(), zIndexOffset: 1000 }).addTo(map);
        tractorMarker.bindPopup('🚜 PELICAN tractor — navigating autonomously');
        layers.push(tractorMarker);

        // Animate tractor along the path
        let wpIdx = 0;
        const animate = setInterval(() => {
            wpIdx = (wpIdx + 1) % waypoints.length;
            tractorMarker.setLatLng(waypoints[wpIdx]);
        }, 900);

        // Legend popup
        const legendDiv = L.DomUtil.create('div');

        return () => {
            clearInterval(animate);
            layers.forEach(l => { try { map.removeLayer(l); } catch {} });
        };
    }, [visible, farmBounds, floodCells, map]);

    return null;
}
