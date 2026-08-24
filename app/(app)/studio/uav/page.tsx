'use client';

import React, { useState, useEffect } from 'react';
import { Target, Cpu, Activity, ShieldAlert, CheckCircle, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UAVPage() {
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [fps, setFps] = useState(30);

    // Simulated Real-time Inference Telemetry Feed
    useEffect(() => {
        const interval = setInterval(() => {
            setFps(30 + Math.floor(Math.random() * 4));

            const newLog = {
                id: Date.now(),
                timestamp: new Date().toISOString().split('T')[1].slice(0, 11),
                confidence: (85 + Math.random() * 14).toFixed(1),
                category: Math.random() > 0.8 ? 'Nematode Stress' : Math.random() > 0.5 ? 'Optimal Canopy' : 'Water Deficit',
                latency: (8 + Math.random() * 4).toFixed(1),
                critical: Math.random() > 0.85
            };

            setTelemetry(prev => [newLog, ...prev].slice(0, 8)); // Keep last 8
        }, 1200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Video size={20} color="#0D7377" />
                        Live UAV Uplink
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                        Real-time agricultural telemetry via Pelican-1 Edge Node. Running YOLOv8-Farm and thermal stream multiplexing.
                    </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Framerate</span>
                        <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 800 }}>{fps} <span style={{ fontSize: 10 }}>FPS</span></span>
                    </div>
                    <div style={{ width: 1, height: '100%', background: '#E2E8F0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Latency</span>
                        <span style={{ fontSize: 13, color: '#10B981', fontWeight: 800 }}>14 <span style={{ fontSize: 10 }}>ms</span></span>
                    </div>
                </div>
            </div>

            {/* ── MAIN FEED & TELEMETRY GRID ── */}
            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
                
                {/* Synthetic Video Box */}
                <div style={{ 
                    flex: 1, background: '#000', borderRadius: 16, overflow: 'hidden', 
                    position: 'relative', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                }}>
                    <video 
                        src="https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-tractor-working-in-field-427-large.mp4" 
                        loop autoPlay muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                    />
                    
                    {/* CSS Targeting Scanner */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `linear-gradient(rgba(13, 115, 119, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 115, 119, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px', pointerEvents: 'none'
                    }} />

                    {/* Animated Bounding Box 1 */}
                    <motion.div 
                        animate={{ 
                            x: [100, 150, 120, 100], 
                            y: [100, 80, 130, 100],
                            width: [180, 200, 170, 180]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', top: '20%', left: '30%', height: 140,
                            border: '2px solid #10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
                        }}
                    >
                        <div style={{ background: '#10B981', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 6px', marginTop: -18, textTransform: 'uppercase' }}>
                            TRACTOR · 99.1%
                        </div>
                        <Target size={18} color="#10B981" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }} />
                    </motion.div>

                    {/* Animated Bounding Box 2 (Anomaly) */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        style={{
                            position: 'absolute', top: '60%', left: '60%', width: 140, height: 120,
                            border: '2px dashed #EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
                        }}
                    >
                        <div style={{ background: '#EF4444', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '2px 6px', marginTop: -18 }}>
                            STRESS · 88.4%
                        </div>
                    </motion.div>

                    {/* Uplink status pill */}
                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>LIVE UPLINK</span>
                        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
                    </div>

                    {/* HUD Overlay Text */}
                    <div style={{ position: 'absolute', bottom: 16, left: 16, color: '#10B981', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                        <div style={{ textShadow: '0 1px 2px black' }}>ALT: 42.1m</div>
                        <div style={{ textShadow: '0 1px 2px black' }}>SPD: 4.2 km/h</div>
                        <div style={{ textShadow: '0 1px 2px black' }}>SENSORS: SAR+RGB</div>
                    </div>
                </div>

                {/* Inference Telemetry Feed */}
                <div style={{ width: 320, background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', borderRadius: '16px 16px 0 0' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Cpu size={14} color="#0D7377" /> Edge Inference Logs
                        </div>
                    </div>
                    <div style={{ padding: 16, flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence>
                            {telemetry.map(log => (
                                <motion.div 
                                    key={log.id}
                                    initial={{ opacity: 0, x: 20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    style={{
                                        background: log.critical ? '#FEF2F2' : '#F0FDFA',
                                        border: `1px solid ${log.critical ? '#FECACA' : '#CCFBF1'}`,
                                        borderRadius: 8, padding: 12, position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>{log.timestamp}</div>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: log.critical ? '#DC2626' : '#0D7377' }}>
                                            {log.confidence}% CONFD
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {log.critical ? <ShieldAlert size={14} color="#DC2626" /> : <CheckCircle size={14} color="#10B981" />}
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{log.category}</div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 6, right: 12, fontSize: 9, color: '#94A3B8' }}>{log.latency}ms</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    {/* Bottom Status */}
                    <div style={{ padding: '12px 20px', background: '#0F172A', color: 'white', borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={14} color="#10B981" />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>API Connected (wss://edge.netra.ai)</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
