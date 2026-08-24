'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

/* ── Leaflet default icon fix ─────────────────────────── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ── Risk colours ─────────────────────────────────────── */
const RISK: Record<string, { fill: string; border: string }> = {
    CRITICAL: { fill: '#FF2E2E', border: '#991B1B' },
    HIGH: { fill: '#FF8A00', border: '#9A3412' },
    MEDIUM: { fill: '#FFD600', border: '#854D0E' },
    LOW: { fill: '#00FF85', border: '#166534' },
    UNKNOWN: { fill: '#64748B', border: '#334155' },
};

/* ── Tile URLs ────────────────────────────────────────── */
const TILES = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    hybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

/* ── Advanced Radar Pulse Marker CSS ── */
const PULSE_STYLES = `
    .pulse-marker {
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .pulse-marker::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .pulse-marker::after {
        content: '';
        position: absolute;
        width: 30%;
        height: 30%;
        border-radius: 50%;
        background: white;
        box-shadow: 0 0 10px rgba(255,255,255,0.8);
    }
    @keyframes radar-ping {
        75%, 100% { transform: scale(3.5); opacity: 0; }
    }
    
    .pulse-critical { background: rgba(255, 46, 46, 0.7); }
    .pulse-critical::before { background: rgba(255, 46, 46, 0.9); }
    
    .pulse-high { background: rgba(255, 138, 0, 0.7); }
    .pulse-high::before { background: rgba(255, 138, 0, 0.9); animation-delay: 0.2s; }
    
    .pulse-medium { background: rgba(255, 214, 0, 0.7); }
    .pulse-medium::before { background: rgba(255, 214, 0, 0.9); animation-delay: 0.4s; }
    
    .pulse-low { background: rgba(0, 255, 133, 0.7); }
    .pulse-low::before { background: rgba(0, 255, 133, 0.9); animation-delay: 0.6s; }
    
    .pulse-marker.hovered {
        transform: scale(1.3);
    }
    .pulse-marker.selected {
        transform: scale(1.6);
        box-shadow: 0 0 0 4px rgba(255,255,255,0.9), 0 0 30px rgba(0,0,0,0.8) !important;
        z-index: 10000 !important;
    }
    .pulse-marker.selected::after { width: 50%; height: 50%; }
`;


function getEventCenter(e: any): [number, number] | null {
    const geo = e.farmId?.geometry;
    if (!geo || !geo.coordinates) return null;

    try {
        const type = geo.type;
        let coords: number[] | null = null;

        if (type === 'Point') {
            coords = geo.coordinates;
        } else if (type === 'Polygon') {
            coords = geo.coordinates[0][0];
        } else if (type === 'MultiPolygon') {
            const poly = geo.coordinates[0];
            if (poly && poly[0] && poly[0][0]) {
                coords = poly[0][0];
            }
        }

        if (coords && coords.length >= 2) {
            if (coords[1] !== 0 && coords[0] !== 0) {
                return [coords[1], coords[0]];
            }
        }
    } catch (err) {
        console.error('Tactical coordinate extraction failed:', err);
    }
    return null;
}

function MapUpdater({ events }: { events: any[] }) {
    const map = useMap();
    useEffect(() => {
        if (events.length > 0) {
            const group = new L.FeatureGroup(events.map(e => {
                const center = getEventCenter(e);
                if (center) return L.marker(center);
                if (e.farmId?.geometry) return L.geoJSON(e.farmId.geometry);
                return L.marker([20, 78]); // Fallback center
            }));
            const bounds = group.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [100, 100], maxZoom: 10 });
            }
        }
    }, [events.length, map]); 
    return null;
}

function SelectionManager({ events, selectedId }: { events: any[], selectedId: string | null }) {
    const map = useMap();
    const lastSelectedId = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedId || selectedId === lastSelectedId.current) return;
        lastSelectedId.current = selectedId;

        const event = events.find(e => e._id === selectedId);
        if (!event) return;

        const center = getEventCenter(event);
        if (center) {
            map.flyTo(center, 13, { 
                duration: 2.5, 
                easeLinearity: 0.15 
            });
        }
    }, [selectedId, events, map]);

    return null;
}

function InjectStyles() {
    useEffect(() => {
        const id = 'cosmeon-map-tactical-styles';
        let s = document.getElementById(id) as HTMLStyleElement;
        if (!s) {
            s = document.createElement('style');
            s.id = id;
            document.head.appendChild(s);
        }
        s.textContent = `
            ${PULSE_STYLES}
            .leaflet-popup-content-wrapper {
                background: rgba(15, 23, 42, 0.92) !important;
                backdrop-filter: blur(24px) !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                border-radius: 16px !important;
                box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1) !important;
                color: #F8FAFC !important;
                padding: 0 !important;
            }
            .leaflet-popup-tip { background: rgba(15, 23, 42, 0.92) !important; }
            .leaflet-popup-content { margin: 0 !important; }
            .cosmeon-flood-polygon { cursor: pointer; transition: all 0.3s; }
            .weather-estimate-polygon { stroke-dasharray: 6, 4; }
            
            /* Add alert button styling */
            .popup-container .alert-btn { opacity: 0; pointer-events: none; transition: all 0.2s ease; margin-left: auto; }
            .popup-container:hover .alert-btn { opacity: 1; pointer-events: auto; }
        `;
    }, []);
    return null;
}

if (typeof window !== 'undefined' && !(window as any).dispatchMapAlert) {
    // area and healthScore added as extra params (positions 7+)
    (window as any).dispatchMapAlert = async (
        id: string, name: string, level: string, score: number,
        lat: number, lng: number, btn: HTMLButtonElement,
        area?: string, healthScore?: number
    ) => {
        if (!btn || btn.disabled) return;
        const orig = btn.innerText;
        const origBg = btn.style.background;
        btn.disabled = true;
        btn.innerText = '⏳ Dispatching…';
        btn.style.background = '#6366F1';
        btn.style.cursor = 'wait';
        try {
            const res = await fetch('/api/dispatch/mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmId: id,
                    farmName: name,
                    actionType: 'fertilizer',
                    riskLevel: level,
                    quantity: '60–80 kg/ha Urea',
                    area: area || '—',
                    healthScore: healthScore ?? score,
                    lat, lng,
                }),
            });
            const data = await res.json();
            if (data.success) {
                btn.innerText = `✓ ${data.missionId}`;
                btn.style.background = '#10B981';
                btn.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 280, fill: 'forwards' });
            } else {
                btn.innerText = 'Error — retry';
                btn.style.background = '#EF4444';
            }
        } catch (err) {
            btn.innerText = 'Network Error';
            btn.style.background = '#EF4444';
        } finally {
            setTimeout(() => {
                if (btn) { btn.disabled = false; btn.innerText = orig; btn.style.background = origBg; btn.style.cursor = 'pointer'; }
            }, 5000);
        }
    };
}

function FloodPopupContent({ properties: p }: { properties: any }) {
    let level = 'LOW';
    if(p.healthScore < 50) level = 'MEDIUM';
    if(p.healthScore < 25) level = 'CRITICAL';
    const rc = RISK[level] ?? RISK.UNKNOWN;
    
    const dn = p.farmId?.farmName ?? 'Field Observation';
    const score = typeof p.healthScore === 'number' ? p.healthScore.toFixed(0) : '0';
    const numScore = Number(score);
    const area = typeof p.farmId?.areaSqm === 'number' ? `${(p.farmId?.areaSqm / 10000).toFixed(2)} Ha` : '—';
    const ndvi = p.avgNDVI ? p.avgNDVI.toFixed(2) : '—';
    const center = getEventCenter(p);
    const lat = center ? center[0] : 20.59;
    const lng = center ? center[1] : 78.96;

    return (
        <div className="popup-container" style={{ padding: '16px', minWidth: '280px', fontFamily: "'Inter', sans-serif", color: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: rc.fill, boxShadow: `0 0 12px ${rc.fill}` }} />
                    <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', color: '#E2E8F0', textTransform: 'uppercase' }}>{dn}</div>
                </div>
                <div style={{ fontSize: '10px', background: `${rc.fill}20`, color: rc.fill, padding: '2px 6px', borderRadius: '4px', fontWeight: 800, border: `1px solid ${rc.fill}40` }}>
                    {level} HEALTH
                </div>
            </div>

            {/* Confidence Bar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                    <span>Crop Vitality Score</span>
                    <span style={{ color: numScore > 70 ? rc.fill : '#94A3B8' }}>{score}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: rc.fill, boxShadow: `0 0 10px ${rc.fill}` }} />
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Farm Area</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC' }}>{area}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Avg NDVI</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC' }}>{ndvi}</div>
                </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D7377', animation: 'pulse 2s infinite' }}/>
                    {p.farmId?.cropType || 'Crop'}
                </div>
                <div 
                    dangerouslySetInnerHTML={{ __html: `
                        <button 
                            class="alert-btn"
                            onclick="window.dispatchMapAlert('${p._id}', '${dn.replace(/'/g, "\\'")}', '${level}', ${numScore}, ${lat}, ${lng}, event.currentTarget, '${area}', ${numScore})"
                            style="background: #10B981; color: white; border: none; border-radius: 4px; padding: 6px 14px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);"
                        >
                            Apply Fertilizer
                        </button>
                    ` }}
                />
            </div>
        </div>
    );
}

import LocationOnboardingPanel from './LocationOnboardingPanel';

interface FloodMapProps {
    events: any[];
    tileMode: string;
    geeTiles?: Record<string, string>;
    onSelect?: (id: string) => void;
    selectedId?: string | null;
    onPolygonChange?: (geoJson: any) => void; // Allow parent to catch the onboarding polygon
}

export default function FloodMap({ events, tileMode, geeTiles, onSelect, selectedId, onPolygonChange }: FloodMapProps) {
    return (
        <MapContainer
            center={[20.59, 78.96]}
            zoom={5}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
        >
            <InjectStyles />
            <MapUpdater events={events} />
            <SelectionManager events={events} selectedId={selectedId} />
            <ZoomControl position="bottomright" />

            {/* NEW: Multi-mode Location Onboarding Panel */}
            <LocationOnboardingPanel 
                onComplete={async (geoJson: any) => {
                    console.log("[Map] New location onboarded:", geoJson);
                    try {
                        const res = await fetch('/api/farm', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ geoJson, name: 'Farmer Onboarded Plot', cropType: 'Wheat' })
                        });
                        const data = await res.json();
                        if (data.success) {
                            alert("✅ Farm boundary successfully saved to Database!");
                            window.location.reload(); // Refresh to pull DB update
                        } else {
                            alert("Failed to save: " + data.error);
                        }
                    } catch (err) {
                        alert("Network error while saving.");
                    }
                    if (onPolygonChange) onPolygonChange(geoJson);
                }} 
            />

            <TileLayer
                key={tileMode}
                url={TILES[tileMode as keyof typeof TILES]}
                attribution='&copy; ESRI &copy; CARTO'
                maxZoom={19}
            />
            {tileMode === 'satellite' && (
                <TileLayer
                    url={TILES.hybrid}
                    opacity={0.8}
                    zIndex={2}
                />
            )}

            {/* GEE Pipeline Tiles */}
            {geeTiles?.flood && <TileLayer url={geeTiles.flood} opacity={0.8} zIndex={4} />}
            {geeTiles?.confidence && <TileLayer url={geeTiles.confidence} opacity={0.6} zIndex={5} />}

            <GeoJSON
                key={`sat-${events.length}-${selectedId}`}
                data={{
                    type: 'FeatureCollection',
                    features: events.map(e => ({
                        type: 'Feature',
                        geometry: e.farmId?.geometry,
                        properties: e
                    })).filter(f => !!f.geometry)
                } as any}
                style={(f: any) => {
                    let level = 'LOW';
                    if(f.properties.healthScore < 50) level = 'MEDIUM';
                    if(f.properties.healthScore < 25) level = 'CRITICAL';
                    
                    return {
                        fillColor: RISK[level]?.fill || '#94A3B8',
                        fillOpacity: f.properties._id === selectedId ? 0.7 : 0.4,
                        color: RISK[level]?.border || '#334155',
                        weight: f.properties._id === selectedId ? 5 : 2,
                        className: 'cosmeon-flood-polygon'
                    };
                }}
                onEachFeature={(f, l) => {
                    const html = renderToStaticMarkup(<FloodPopupContent properties={f.properties} />);
                    l.bindPopup(html, { maxWidth: 300 });
                    l.on('click', () => onSelect?.(f.properties._id));
                }}
            />

            {/* Pulse Intel Markers */}
            {events.map((e, idx) => {
                const center = getEventCenter(e);
                if (!center) return null;

                let level = 'LOW';
                if(e.healthScore < 50) level = 'MEDIUM';
                if(e.healthScore < 25) level = 'CRITICAL';

                const isSelected = selectedId === e._id;
                const icon = L.divIcon({
                    className: `pulse-marker pulse-${(level).toLowerCase()} ${isSelected ? 'selected' : ''}`,
                    iconSize: [isSelected ? 36 : 24, isSelected ? 36 : 24],
                    iconAnchor: [isSelected ? 18 : 12, isSelected ? 18 : 12]
                });

                return (
                    <Marker
                        key={`${e._id}-${idx}`}
                        position={center}
                        icon={icon}
                        zIndexOffset={isSelected ? 1000 : 0}
                        eventHandlers={{ click: () => onSelect?.(e._id) }}
                    >
                        <Popup maxWidth={300}>
                            <FloodPopupContent properties={e} />
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
