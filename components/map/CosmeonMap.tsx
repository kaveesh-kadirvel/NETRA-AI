'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    MapContainer, TileLayer, GeoJSON, ZoomControl, useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

/* ── Leaflet icon fix ─────────────────────────────────── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ── Constants ────────────────────────────────────────── */
const RISK_COLORS: Record<string, string> = {
    CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308',
    LOW: '#22C55E', UNKNOWN: '#94A3B8',
};

const FIRE_COLORS: Record<string, { fill: string; border: string; size: number; glow: string }> = {
    EXTREME: { fill: '#FF1744', border: '#FF6D00', size: 14, glow: 'rgba(255,23,68,0.6)' },
    HIGH: { fill: '#FF6D00', border: '#FFD600', size: 10, glow: 'rgba(255,109,0,0.5)' },
    MODERATE: { fill: '#FFD600', border: '#FF8F00', size: 7, glow: 'rgba(255,214,0,0.4)' },
    LOW: { fill: '#FF8F00', border: '#E65100', size: 5, glow: 'rgba(255,143,0,0.3)' },
};

/* ── Map tile themes ──────────────────────────────────── */
const TILES = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

/* ── Fire marker factory ──────────────────────────────── */
function makeFireIcon(intensity: string, frp: number) {
    const cfg = FIRE_COLORS[intensity] ?? FIRE_COLORS.LOW;
    const pulse = intensity === 'EXTREME' || intensity === 'HIGH';
    const html = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${pulse ? `<div style="
        position:absolute;width:${cfg.size * 2.4}px;height:${cfg.size * 2.4}px;
        border-radius:50%;background:${cfg.glow};
        animation:firePulse 1.5s ease-in-out infinite;"></div>` : ''}
      <div style="
        width:${cfg.size}px;height:${cfg.size}px;border-radius:50%;
        background:radial-gradient(circle at 35% 35%, ${cfg.border}, ${cfg.fill});
        border:2px solid ${cfg.border};
        box-shadow:0 0 ${cfg.size}px ${cfg.glow};
        position:relative;z-index:1;">
      </div>
    </div>`;
    return L.divIcon({
        html,
        className: '',
        iconSize: [cfg.size * 3, cfg.size * 3],
        iconAnchor: [cfg.size * 1.5, cfg.size * 1.5],
    });
}

/* ── CSS injection for animations ────────────────────── */
function InjectCSS() {
    useEffect(() => {
        const id = 'cosmeon-fire-styles';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      @keyframes firePulse {
        0%,100% { transform:scale(1); opacity:0.7; }
        50%      { transform:scale(1.6); opacity:0.2; }
      }
      .leaflet-popup-content-wrapper {
        background: #0D1B2A !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
        color: #E2E8F0 !important;
        padding: 0 !important;
      }
      .leaflet-popup-tip { background: #0D1B2A !important; }
      .leaflet-popup-content { margin: 0 !important; }
      .leaflet-container { font-family: 'Inter', sans-serif !important; }
    `;
        document.head.appendChild(style);
    }, []);
    return null;
}

/* ── Fire markers layer ───────────────────────────────── */
function FireLayer({ fires, filter }: { fires: any[]; filter: string }) {
    const map = useMap();
    const layerRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        if (layerRef.current) map.removeLayer(layerRef.current);
        const group = L.layerGroup();

        const filtered = filter === 'ALL'
            ? fires
            : fires.filter(f => f.intensity === filter);

        filtered.forEach(f => {
            const icon = makeFireIcon(f.intensity, f.frp);
            const marker = L.marker([f.lat, f.lon], { icon });

            const cfg = FIRE_COLORS[f.intensity] ?? FIRE_COLORS.LOW;
            const timeStr = f.acq_time ? `${f.acq_time.slice(0, 2)}:${f.acq_time.slice(2)}` : 'N/A';

            marker.bindPopup(`
        <div style="padding:16px 18px;min-width:220px;font-family:'Inter',sans-serif">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:10px;height:10px;border-radius:50%;background:${cfg.fill};box-shadow:0 0 8px ${cfg.glow}"></div>
            <div style="font-weight:700;font-size:13px;color:#F8FAFC">
              ${f.intensity} Fire Event
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:12px">
            <div style="color:#94A3B8">FRP</div>
            <div style="color:#FFF;font-weight:600">${f.frp?.toFixed(1)} MW</div>
            <div style="color:#94A3B8">Date</div>
            <div style="color:#FFF;font-weight:600">${f.acq_date}</div>
            <div style="color:#94A3B8">Time</div>
            <div style="color:#FFF;font-weight:600">${timeStr} UTC</div>
            <div style="color:#94A3B8">Satellite</div>
            <div style="color:#FFF;font-weight:600">${f.instrument || f.satellite || 'VIIRS'}</div>
            <div style="color:#94A3B8">Confidence</div>
            <div style="color:#FFF;font-weight:600">${f.confidence}</div>
            <div style="color:#94A3B8">Day/Night</div>
            <div style="color:#FFF;font-weight:600">${f.daynight === 'D' ? '☀ Day' : '🌙 Night'}</div>
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:10px;color:#64748B">
            Source: NASA FIRMS (${f.source})<br/>
            ${f.lat.toFixed(4)}°N, ${f.lon.toFixed(4)}°E
          </div>
        </div>
      `, { maxWidth: 280 });

            group.addLayer(marker);
        });

        group.addTo(map);
        layerRef.current = group;
        return () => { map.removeLayer(group); };
    }, [fires, filter, map]);

    return null;
}

/* ── Flood GeoJSON layer ─────────────────────────────── */
function FloodLayer({ events }: { events: any[] }) {
    // Accept events with geometry OR with floodBbox in metadata
    const drawableEvents = events.filter(e => {
        const geomOk = e.floodGeometry?.type === 'Polygon' ||
            e.floodGeometry?.type === 'MultiPolygon';
        const bboxOk = e.metadata?.floodBbox?.length === 4;
        return geomOk || bboxOk;
    });

    const features = drawableEvents.map(e => {
        // Prefer real geometry; fall back to bbox
        if (e.floodGeometry?.type === 'Polygon' || e.floodGeometry?.type === 'MultiPolygon') {
            return {
                type: 'Feature' as const,
                properties: { ...e, districtName: e.districtId?.districtName ?? e.districtName ?? 'Unknown' },
                geometry: e.floodGeometry,
            };
        }
        // Build Polygon from floodBbox [w, s, e, n]
        const [w, s, east, n] = e.metadata.floodBbox;
        return {
            type: 'Feature' as const,
            properties: { ...e, districtName: e.districtId?.districtName ?? e.districtName ?? 'Unknown' },
            geometry: {
                type: 'Polygon' as const,
                coordinates: [[[w, s], [east, s], [east, n], [w, n], [w, s]]],
            },
        };
    });

    const geoData = { type: 'FeatureCollection' as const, features };

    const styleFeature = (feature: any) => {
        const color = RISK_COLORS[feature.properties.riskLevel] ?? '#94A3B8';
        return { fillColor: color, fillOpacity: 0.25, color, weight: 2, opacity: 0.9 };
    };

    const onEachFeature = (feature: any, layer: any) => {
        const p = feature.properties;
        layer.bindPopup(`
      <div style="padding:16px 18px;min-width:240px;font-family:'Inter',sans-serif">
        <div style="font-weight:700;font-size:14px;color:#F8FAFC;margin-bottom:2px">
          ${p.districtName}
        </div>
        <div style="font-size:11px;color:#64748B;margin-bottom:10px">
          ${p.districtId?.stateName ?? p.stateName ?? 'Assam, India'} · GEE Flood Detection
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:12px">
          <div style="color:#94A3B8">Risk Level</div>
          <div style="color:${RISK_COLORS[p.riskLevel]};font-weight:700">${p.riskLevel}</div>
          <div style="color:#94A3B8">Risk Score</div>
          <div style="color:#FFF;font-weight:600">${p.riskScore?.toFixed(1)} / 100</div>
          <div style="color:#94A3B8">Flood Area</div>
          <div style="color:#FFF;font-weight:600">${p.floodAreaKm2?.toFixed(1)} km²</div>
          <div style="color:#94A3B8">Affected Pop</div>
          <div style="color:#FFF;font-weight:600">${p.affectedPopEst?.toLocaleString()}</div>
          <div style="color:#94A3B8">Δ Prev. Detection</div>
          <div style="color:${(p.changeFromPrevKm2 ?? 0) > 0 ? '#EF4444' : '#22C55E'};font-weight:600">
            ${(p.changeFromPrevKm2 ?? 0) > 0 ? '+' : ''}${(p.changeFromPrevKm2 ?? 0).toFixed(1)} km²
          </div>
          <div style="color:#94A3B8">SAR VV Change</div>
          <div style="color:#FFF;font-weight:600">${p.metadata?.sarChangeDb?.toFixed(2) ?? 'N/A'} dB</div>
          <div style="color:#94A3B8">NDWI Index</div>
          <div style="color:#FFF;font-weight:600">${p.metadata?.ndwiMean?.toFixed(4) ?? 'N/A'}</div>
          <div style="color:#94A3B8">Confidence</div>
          <div style="color:#FFF;font-weight:600">${Math.round((p.confidenceScore ?? 0) * 100)}%</div>
          <div style="color:#94A3B8">Method</div>
          <div style="color:#0D7377;font-weight:600">${p.detectionMethod ?? 'SAR+NDWI'}</div>
        </div>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:10px;color:#64748B">
          Change detection: ${p.metadata?.referenceWindow ?? 'N/A'} vs ${p.metadata?.analysisWindow ?? 'current'}<br/>
          Source: Google Earth Engine (Sentinel-1 SAR + Sentinel-2 NDWI)
        </div>
      </div>
    `, { maxWidth: 300 });
        layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.55, weight: 3 }));
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.25, weight: 2 }));
    };

    if (!features.length) return null;

    return (
        <GeoJSON
            key={features.length}
            data={geoData as any}
            style={styleFeature}
            onEachFeature={onEachFeature}
        />
    );
}

/* ── Main Component ──────────────────────────────────── */
interface Props {
    events: any[];
    fires: any[];
    showFlood: boolean;
    showFire: boolean;
    fireFilter: string;
    tileMode: keyof typeof TILES;
}

export default function CosmeonMap({
    events, fires, showFlood, showFire, fireFilter, tileMode,
}: Props) {
    return (
        <MapContainer
            center={[25.5, 92.5]}
            zoom={7}
            zoomControl={false}
            style={{ width: '100%', height: '580px', minHeight: '580px' }}
        >
            <InjectCSS />
            <ZoomControl position="bottomright" />

            <TileLayer
                key={tileMode}
                attribution='&copy; <a href="https://carto.com">CARTO</a> | &copy; <a href="https://www.openstreetmap.org">OSM</a>'
                url={TILES[tileMode]}
                maxZoom={19}
            />

            {/* Flood layer */}
            {showFlood && <FloodLayer events={events} />}

            {/* Fire layer */}
            {showFire && fires.length > 0 && (
                <FireLayer fires={fires} filter={fireFilter} />
            )}
        </MapContainer>
    );
}
