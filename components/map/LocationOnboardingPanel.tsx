'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Smartphone, Check, Loader2, MousePointer2, X } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────────────────────────── */

export interface LocationOnboardingPanelProps {
    /** 
     * Called when a final GeoJSON polygon is produced.
     * The python pipeline expects standard format.
     */
    onComplete: (geoJson: any) => void;
}

type Mode = 'search' | 'telegram' | 'draw' | null;

/* ────────────────────────────────────────────────────────────────────────
   UTILITY: Generate 1-hectare (100x100m) box from lat/lng
──────────────────────────────────────────────────────────────────────── */

const generateOneHectareSquareGeoJSON = (lat: number, lng: number) => {
    // 1 deg lat is approx 111km. So 100m is ~0.0009 degrees.
    const degOffset = 0.00045; // half offset for 100m total width/height
    const coords = [
        [lng - degOffset, lat - degOffset], // BL
        [lng + degOffset, lat - degOffset], // BR
        [lng + degOffset, lat + degOffset], // TR
        [lng - degOffset, lat + degOffset], // TL
        [lng - degOffset, lat - degOffset], // BL (close loop)
    ];

    return {
        type: 'Polygon',
        coordinates: [coords]
    };
};

/* ────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT — Designed to drop right inside <MapContainer>
──────────────────────────────────────────────────────────────────────── */

export default function LocationOnboardingPanel({ onComplete }: LocationOnboardingPanelProps) {
    const map = useMap();
    const [mode, setMode] = useState<Mode>(null);

    // Mode 1 State (Draw)
    const [drawPoints, setDrawPoints] = useState<L.LatLng[]>([]);
    const [previewPoint, setPreviewPoint] = useState<L.LatLng | null>(null);

    // Mode 2 State (Search)
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Mode 3 State (Telegram)
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('Waiting for Telegram Pin...');

    // Draw lines layer ref
    const polylineRef = useRef<L.Polyline | null>(null);
    const polygonRef = useRef<L.Polygon | null>(null);

    const [isOpen, setIsOpen] = useState(true);

    /* ── EFFECT: Handle mode switching cleanup ── */
    useEffect(() => {
        // Only run cleanup if we are closing the panel or cancelling a mode
        if (mode === null) {
            setDrawPoints([]);
            setPreviewPoint(null);
            setIsSyncing(false);
            setSearchQuery('');
            if (polylineRef.current) map.removeLayer(polylineRef.current);
            if (polygonRef.current) map.removeLayer(polygonRef.current);
        }
    }, [mode, map, isOpen]);

    /* ── MODE 1: NATIVE DRAW LOGIC ── */
    useMapEvents({
        click(e) {
            if (mode !== 'draw') return;

            // Check if clicking close to the first point to close the polygon
            if (drawPoints.length >= 3) {
                const firstPt = drawPoints[0];
                const distList = map.latLngToLayerPoint(e.latlng).distanceTo(map.latLngToLayerPoint(firstPt));
                if (distList < 20) { // 20px snap radius
                    completeDrawing();
                    return;
                }
            }
            setDrawPoints(prev => [...prev, e.latlng]);
        },
        mousemove(e) {
            if (mode === 'draw' && drawPoints.length > 0) {
                setPreviewPoint(e.latlng);
            }
        }
    });

    useEffect(() => {
        if (mode !== 'draw') return;

        // Cleanup old lines
        if (polylineRef.current) map.removeLayer(polylineRef.current);
        if (polygonRef.current) map.removeLayer(polygonRef.current);

        const pts = previewPoint ? [...drawPoints, previewPoint] : drawPoints;
        if (pts.length > 0) {
            polylineRef.current = L.polyline(pts, { color: '#0D7377', weight: 4, dashArray: '5, 10' }).addTo(map);
            
            // Draw snapping circle on first point if >2 points
            if (drawPoints.length >= 3) {
                L.circleMarker(drawPoints[0], { radius: 8, color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.5 }).addTo(polylineRef.current);
            }
        }
    }, [drawPoints, previewPoint, map, mode]);

    const completeDrawing = () => {
        if (drawPoints.length < 3) return;
        
        // Remove active drawing lines
        if (polylineRef.current) map.removeLayer(polylineRef.current);

        // Draw final filled polygon on map
        polygonRef.current = L.polygon(drawPoints, {
            color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.4, weight: 3
        }).addTo(map);

        // Convert to GeoJSON Feature
        const coords = drawPoints.map(p => [p.lng, p.lat]);
        coords.push(coords[0]); // Close loop

        const geoJson = {
            type: 'Polygon',
            coordinates: [coords]
        };

        setMode(null);
        onComplete(geoJson);
    };

    /* ── MODE 2: NOMINATIM SEARCH LOGIC ── */
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                
                // Fly there
                map.flyTo([lat, lng], 17, { animate: true, duration: 2 });
                
                // Generate 1-ha square output
                const geoJson = generateOneHectareSquareGeoJSON(lat, lng);

                setTimeout(() => {
                    // Draw it so the user sees something happened
                    if (polygonRef.current) map.removeLayer(polygonRef.current);
                    polygonRef.current = L.geoJSON(geoJson as any, {
                        style: { color: '#D97706', fillColor: '#F59E0B', fillOpacity: 0.4, weight: 3 }
                    }).addTo(map);
                    
                    onComplete(geoJson);
                    setMode(null);
                }, 2000); // Trigger after flyTo finishes
            } else {
                alert("Location not found.");
            }
        } catch (err) {
            console.error("Geocoding failed:", err);
            alert("Search failed. Check network.");
        } finally {
            setIsSearching(false);
        }
    };

    /* ── MODE 3: TELEGRAM SYNC LOGIC ── */
    useEffect(() => {
        if (mode !== 'telegram' || !isSyncing) return;

        let interval: any;
        const pollLocation = async () => {
            try {
                const res = await fetch('/api/telegram/location');
                const data = await res.json();

                if (data.success && data.data) {
                    const loc = data.data;
                    
                    // Check if it's recent (within last 3 minutes)
                    if (Date.now() - loc.timestamp < 3 * 60 * 1000) {
                        clearInterval(interval);
                        setSyncMessage(`Location acquired from ${loc.user}!`);
                        
                        // Fly to farmer's live phone GPS
                        map.flyTo([loc.lat, loc.lng], 18, { animate: true, duration: 2.5 });
                        
                        const geoJson = generateOneHectareSquareGeoJSON(loc.lat, loc.lng);
                        
                        setTimeout(() => {
                            if (polygonRef.current) map.removeLayer(polygonRef.current);
                            polygonRef.current = L.geoJSON(geoJson as any, {
                                style: { color: '#0369A1', fillColor: '#0EA5E9', fillOpacity: 0.4, weight: 3 }
                            }).addTo(map);
                            
                            onComplete(geoJson);
                            setIsSyncing(false);
                            setMode(null);
                        }, 2500);
                    }
                }
            } catch (err) {
                console.warn("Polling error:", err);
            }
        };

        // Poll every 3 seconds
        interval = setInterval(pollLocation, 3000);
        return () => clearInterval(interval);
    }, [mode, isSyncing, map, onComplete]);


    /* ── UI RENDER ── */
    if (!isOpen) {
        return (
            <div style={{ position: 'absolute', top: 20, left: 60, zIndex: 1000 }}>
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        background: '#0F172A', color: 'white', border: 'none',
                        padding: '10px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s'
                    }}
                >
                    <MapPin size={16} /> Add Farm Boundary
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            top: 20, left: 60, // Sits top-left inside map container
            zIndex: 1000,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            width: 320,
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Initial Farm Setup</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                        Select a method to define the farm boundaries for the satellite pipeline.
                    </p>
                </div>
                <button 
                    onClick={() => { setIsOpen(false); setMode(null); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Mode Selection Buttons (Visible when no mode is active) */}
            {!mode && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    
                    {/* Draw Tool Button */}
                    <button onClick={() => setMode('draw')} style={btnStyle('#16A34A', '#F0FDF4', '#BBF7D0')}>
                        <div style={iconBox('#16A34A')}><MousePointer2 size={16} /></div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Draw on Map</div>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Trace exact farm boundaries</div>
                        </div>
                    </button>

                    {/* Search Button */}
                    <button onClick={() => setMode('search')} style={btnStyle('#D97706', '#FFFBEB', '#FDE68A')}>
                        <div style={iconBox('#D97706')}><Search size={16} /></div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Address Search</div>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Generates 1-Hectare square</div>
                        </div>
                    </button>

                    {/* Telegram Sync Button */}
                    <button onClick={() => { setMode('telegram'); setIsSyncing(true); }} style={btnStyle('#0369A1', '#EFF6FF', '#BFDBFE')}>
                        <div style={iconBox('#0369A1')}><Smartphone size={16} /></div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Telegram GPS Sync</div>
                            <div style={{ fontSize: 10, color: '#64748B' }}>"Farmer Drop Pin" integration</div>
                        </div>
                    </button>

                </div>
            )}

            {/* Active Mode UI: DRAW */}
            {mode === 'draw' && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', marginBottom: 4 }}>Mapping Mode Active</div>
                        <div style={{ fontSize: 11, color: '#15803D' }}>Click on the map to place corners. Click the starting point again to finish drawing.</div>
                    </div>
                    {drawPoints.length > 0 && (
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                            {drawPoints.length} points placed
                        </div>
                    )}
                    <button onClick={() => setMode(null)} style={cancelBtnStyle}>Cancel Drawing</button>
                </div>
            )}

            {/* Active Mode UI: SEARCH */}
            {mode === 'search' && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input 
                        type="text" 
                        placeholder="e.g., Nerul, Maharashtra" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: 8,
                            border: '1px solid #CBD5E1', fontSize: 12, outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={handleSearch} disabled={isSearching} style={{
                            flex: 1, background: '#0F172A', color: 'white', border: 'none',
                            padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            cursor: isSearching ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center'
                        }}>
                            {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search & Zoom'}
                        </button>
                        <button onClick={() => setMode(null)} style={cancelBtnStyle}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Active Mode UI: TELEGRAM */}
            {mode === 'telegram' && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '16px', borderRadius: 12, textAlign: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0EA5E9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'pulse 1.5s infinite' }}>
                            <MapPin size={20} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0369A1', marginBottom: 4 }}>Listening to Phone</div>
                        <div style={{ fontSize: 11, color: '#0284C7', lineHeight: 1.4 }}>
                            Send a location pin via the Telegram Bot.<br/>The dashboard will catch it instantly.
                        </div>
                    </div>
                    
                    <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} color="#16A34A" />}
                        {syncMessage}
                    </div>

                    <button onClick={() => { setMode(null); setIsSyncing(false); }} style={cancelBtnStyle}>Cancel Polling</button>
                </div>
            )}
        </div>
    );
}

// Inline Styles
const btnStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
    background: 'white',
    border: `1px solid #E2E8F0`,
    padding: '12px',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
});

const iconBox = (color: string): React.CSSProperties => ({
    width: 36, height: 36,
    borderRadius: 8,
    background: `${color}15`,
    color: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
});

const cancelBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #E2E8F0',
    color: '#64748B',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
};
