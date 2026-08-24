'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DispatchPayload {
    farmId?: string;
    farmName: string;
    actionType: 'fertilizer' | 'irrigation' | 'drone' | 'alert';
    healthScore?: number;
    area?: string;
    quantity?: string;
    riskLevel?: string;
    lat?: number;
    lng?: number;
}

interface MissionResult {
    success: boolean;
    missionId: string;
    eta: string;
    actionType: string;
    farmName: string;
    quantity?: string;
    email: { sent: boolean; previewUrl?: string };
    dispatchedAt: string;
}

const ACTION_CONFIG = {
    fertilizer: {
        emoji: '🌱',
        label: 'Apply Fertilizer',
        title: 'Fertilizer Dispatch Mission',
        color: '#16A34A',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        logLines: [
            '[NETRA] Connecting to Kisan Network...',
            '[GEE]   NDVI deficit confirmed — nitrogen stress detected',
            '[AI]    Calculating optimal Urea dosage...',
            '[ICAR]  ICAR 2023 guardrails applied: 60–80 kg/ha',
            '[SMS]   Farmer notification queued...',
            '[EMAIL] Dispatching mission briefing...',
            '[DRONE] Field coordinates locked to GPS...',
        ],
    },
    irrigation: {
        emoji: '💧',
        label: 'Send Water',
        title: 'Irrigation Dispatch Mission',
        color: '#0369A1',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        logLines: [
            '[NETRA] Connecting to Kisan Network...',
            '[SAR]   Sentinel-1 soil moisture below threshold',
            '[AI]    Computing optimal irrigation volume...',
            '[METEO] Open-Meteo weather integration active...',
            '[EMAIL] Dispatching irrigation mission briefing...',
            '[PUMP]  Field irrigation schedule confirmed...',
            '[DRONE] Drip route calculated — 97% coverage...',
        ],
    },
    drone: {
        emoji: '🚁',
        label: 'Launch Drone Survey',
        title: 'PELICAN Drone Mission',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        logLines: [
            '[NETRA] PELICAN fleet status: READY',
            '[NAV]   Loading field boundary coordinates...',
            '[ROUTE] Calculating optimal survey path...',
            '[CAM]   Multispectral imaging pre-loaded...',
            '[EMAIL] Mission briefing dispatched...',
            '[COMM]  Operator uplink established...',
            '[LAUNCH] Drone authorized for takeoff...',
        ],
    },
    alert: {
        emoji: '⚠️',
        label: 'Critical Alert',
        title: 'Critical Field Alert Sent',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA',
        logLines: [
            '[ALERT] Critical threshold breach detected...',
            '[NETRA] Emergency protocol activated...',
            '[SMS]   Farmer SMS dispatched...',
            '[EMAIL] Alert email sent to field supervisor...',
            '[DRONE] Emergency survey mission scheduled...',
            '[AI]    Yield loss projected: 18–22% without action',
            '[ICAR]  Field flagged for priority intervention...',
        ],
    },
};

/* ─────────────── Typing terminal effect ─────────────── */
function TerminalLog({ lines, running }: { lines: string[]; running: boolean }) {
    const [shown, setShown] = useState<string[]>([]);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!running) return;
        setShown([]);
        let i = 0;
        const timer = setInterval(() => {
            if (i < lines.length) {
                setShown(prev => [...prev, lines[i]]);
                i++;
            } else clearInterval(timer);
        }, 420);
        return () => clearInterval(timer);
    }, [running, lines]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [shown]);

    return (
        <div style={{
            background: '#0A1628', borderRadius: 10,
            padding: '14px 16px', fontFamily: 'monospace',
            fontSize: 11, lineHeight: '1.9', overflowY: 'auto',
            maxHeight: 170, border: '1px solid rgba(255,255,255,0.08)',
        }}>
            {shown.map((line, i) => {
                const isErr   = line.includes('ERROR');
                const isOk    = line.includes('EMAIL') || line.includes('LAUNCH') || line.includes('DRONE');
                const isWarn  = line.includes('ALERT') || line.includes('PROJ');
                const color   = isErr ? '#F87171' : isOk ? '#4ADE80' : isWarn ? '#FBBF24' : '#94A3B8';
                const isCursor = i === shown.length - 1 && running;
                return (
                    <div key={i} style={{ color, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#1E40AF', userSelect: 'none' }}>›</span>
                        <span>{line}</span>
                        {isCursor && <span style={{ animation: 'blink 1s step-end infinite', color: '#4ADE80' }}>▮</span>}
                    </div>
                );
            })}
            <div ref={endRef} />
        </div>
    );
}

/* ─────────────── Countdown ring ─────────────── */
function CountdownRing({ eta }: { eta: string }) {
    const [secs, setSecs] = useState(15);
    useEffect(() => {
        const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, []);
    const pct = secs / 15;
    const r   = 28;
    const circ = 2 * Math.PI * r;
    return (
        <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={80} height={80} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
                <circle cx={40} cy={40} r={r} fill="none" stroke="#4ADE80" strokeWidth={5}
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'white', lineHeight: 1 }}>{secs}s</div>
                <div style={{ fontSize: 7, color: '#4ADE80', fontWeight: 700, letterSpacing: '0.05em' }}>CONFIRMING</div>
            </div>
        </div>
    );
}

/* ─────────────── Main Modal ─────────────── */
export interface MissionDispatchModalProps {
    open: boolean;
    payload: DispatchPayload | null;
    onClose: () => void;
}

export default function MissionDispatchModal({ open, payload, onClose }: MissionDispatchModalProps) {
    const [phase, setPhase] = useState<'idle' | 'dispatching' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<MissionResult | null>(null);
    const [logRunning, setLogRunning] = useState(false);
    const [copied, setCopied] = useState(false);

    const cfg = payload ? ACTION_CONFIG[payload.actionType] : ACTION_CONFIG.fertilizer;

    useEffect(() => {
        if (!open || !payload) return;
        setPhase('dispatching');
        setLogRunning(true);
        setResult(null);

        fetch('/api/dispatch/mission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(r => r.json())
            .then(d => {
                setLogRunning(false);
                if (d.success) { setPhase('success'); setResult(d); }
                else           { setPhase('error'); }
            })
            .catch(() => { setLogRunning(false); setPhase('error'); });
    }, [open, payload]);

    const handleCopy = () => {
        if (result?.missionId) {
            navigator.clipboard.writeText(result.missionId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!open || !payload) return null;

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)', zIndex: 9998,
                animation: 'fadeIn 0.2s ease',
            }} />

            {/* Modal */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999, width: '100%', maxWidth: 520,
                background: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                animation: 'slideUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                overflow: 'hidden',
            }}>

                {/* Top accent bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, #0D7377, #0EA5E9)` }} />

                {/* Header */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: cfg.color + '22', border: `1px solid ${cfg.color}55`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20,
                            }}>{cfg.emoji}</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>{cfg.title}</div>
                                <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, marginTop: 1 }}>
                                    {payload.farmName} · {payload.riskLevel || 'MEDIUM'} RISK
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.06)', border: 'none',
                            borderRadius: 8, width: 28, height: 28, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            color: '#64748B', cursor: 'pointer', fontSize: 14,
                        }}>✕</button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px' }}>

                    {/* Farm info chips */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                        {[
                            { label: 'Farm', val: payload.farmName },
                            { label: 'Area', val: payload.area || '—' },
                            { label: 'Health', val: payload.healthScore ? `${payload.healthScore}/100` : '—' },
                            { label: 'Dose', val: payload.quantity || '—' },
                        ].map(({ label, val }) => (
                            <div key={label} style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8, padding: '6px 12px',
                            }}>
                                <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#E2E8F0', marginTop: 1 }}>{val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Terminal log */}
                    {(phase === 'dispatching' || phase === 'success') && (
                        <TerminalLog lines={cfg.logLines} running={logRunning} />
                    )}

                    {/* Dispatching state */}
                    {phase === 'dispatching' && (
                        <div style={{
                            marginTop: 16, display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px',
                        }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'white', marginBottom: 4 }}>Dispatching Mission…</div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: cfg.color, animation: 'spin 0.8s linear infinite' }} />
                                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Contacting Kisan Network… Sending email…</span>
                                </div>
                            </div>
                            <CountdownRing eta="15s" />
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {phase === 'success' && result && (
                        <div style={{ marginTop: 16 }}>
                            {/* Mission ID */}
                            <div style={{
                                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                                borderRadius: 12, padding: '14px 18px', marginBottom: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div>
                                    <div style={{ fontSize: 9, color: '#4ADE80', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>✓ MISSION DISPATCHED</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: 'white', letterSpacing: '0.06em' }}>
                                        {result.missionId}
                                    </div>
                                </div>
                                <button onClick={handleCopy} style={{
                                    background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                                    color: copied ? '#4ADE80' : '#94A3B8', fontSize: 11, fontWeight: 700,
                                    transition: 'all 0.2s',
                                }}>
                                    {copied ? '✓ Copied!' : 'Copy ID'}
                                </button>
                            </div>

                            {/* Stats row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                                {[
                                    { emoji: '⏱', label: 'ETA', val: result.eta },
                                    { emoji: '📧', label: 'Email', val: result.email.sent ? 'Sent ✓' : 'Queued' },
                                    { emoji: '🛰', label: 'Action', val: result.actionType.charAt(0).toUpperCase() + result.actionType.slice(1) },
                                ].map(({ emoji, label, val }) => (
                                    <div key={label} style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 16, marginBottom: 3 }}>{emoji}</div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0' }}>{val}</div>
                                        <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Email preview link */}
                            {result.email?.previewUrl && (
                                <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, marginBottom: 4 }}>📬 Email Preview (Demo)</div>
                                    <a href={result.email.previewUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#38BDF8', wordBreak: 'break-all', fontWeight: 600 }}>
                                        {result.email.previewUrl}
                                    </a>
                                </div>
                            )}

                            {/* Close / Done */}
                            <button onClick={onClose} style={{
                                width: '100%', background: `linear-gradient(135deg, ${cfg.color}, #0D7377)`,
                                border: 'none', borderRadius: 12, padding: '13px',
                                color: 'white', fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', letterSpacing: '0.04em',
                                boxShadow: `0 8px 24px ${cfg.color}40`,
                                transition: 'all 0.2s',
                            }}>
                                {cfg.emoji} Mission Confirmed — Close
                            </button>
                        </div>
                    )}

                    {/* ERROR */}
                    {phase === 'error' && (
                        <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#F87171', marginBottom: 4 }}>Mission dispatch failed</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Check SMTP config in .env or try again</div>
                            <button onClick={onClose} style={{ marginTop: 12, background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 20px', color: '#94A3B8', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Close</button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
                @keyframes slideUp  { from { opacity:0; transform:translate(-50%,-46%) } to { opacity:1; transform:translate(-50%,-50%) } }
                @keyframes spin     { to   { transform: rotate(360deg) } }
                @keyframes blink    { 50%  { opacity:0 } }
            `}</style>
        </>
    );
}
