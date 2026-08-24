'use client';

import {
    Satellite, ArrowRight, ChevronRight, CheckCircle,
    Zap, Shield, BarChart3, Layers, Globe, Radio,
    Cpu, Sprout, Droplets, FlaskConical, TrendingUp,
    MapPin, AlertTriangle, Map, Activity, Star,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const GlobeVis = dynamic(() => import('react-globe.gl'), { ssr: false });

/* =============================================
   DESIGN TOKENS  (Aurora + Teal SaaS)
   Plus Jakarta Sans — friendly, modern, clean
   Primary: #0D7377  Accent: #14B8A6
   CTA: #16A34A     Background: #F8FAFC
============================================= */
const C = {
    primary  : '#0D7377',
    primaryL : '#14B8A6',
    accent   : '#0EA5E9',
    green    : '#16A34A',
    orange   : '#EA580C',
    bg       : '#F8FAFC',
    bgDark   : '#0A1628',
    text     : '#0F172A',
    textMuted: '#475569',
    border   : '#E2E8F0',
};

/* ─────────────────────────────────────────────
   3D EARTH VISUAL  (react-globe.gl)
───────────────────────────────────────────── */
function EarthVisual() {
    const globeRef = useRef<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTimeout(() => {
            if (globeRef.current) {
                globeRef.current.controls().autoRotate = true;
                globeRef.current.controls().autoRotateSpeed = 0.7;
                globeRef.current.controls().enableZoom = false;
                globeRef.current.pointOfView({ lat: 20, lng: 80, altitude: 1.75 });
            }
        }, 600);
    }, []);

    const arcsData = [
        { startLat: 26.2, startLng: 92.9, endLat: 51.5, endLng: -0.1,  color: [C.primaryL, C.orange] },
        { startLat: 26.2, startLng: 92.9, endLat: 38.9, endLng: -77.0, color: [C.primary,  '#EF4444'] },
        { startLat: 20.5, startLng: 78.9, endLat: 35.7, endLng: 139.7, color: [C.accent,   C.green]  },
    ];

    const ringsData = [
        { lat: 26.2, lng: 92.9, maxR: 8, propagationSpeed: 2,   repeatPeriod: 1400, color: '#EF4444' },
        { lat: 20.5, lng: 78.9, maxR: 5, propagationSpeed: 1.2, repeatPeriod: 2200, color: C.primaryL },
        { lat: 28.6, lng: 77.2, maxR: 4, propagationSpeed: 1,   repeatPeriod: 2800, color: '#22C55E' },
        { lat: 13.0, lng: 80.2, maxR: 3, propagationSpeed: 0.9, repeatPeriod: 3000, color: C.accent  },
    ];

    const BADGES = [
        { label: 'BRAHMAPUTRA BASIN', sub: 'Crop Stress Detected',  color: '#EF4444', x: '-8%',  y: '22%' },
        { label: 'SAR ORBIT PASS',    sub: 'Sentinel-1 Live',       color: C.primaryL, x: '82%', y: '12%' },
        { label: 'NDVI HEALTH',       sub: '92.4% Accuracy',        color: '#22C55E', x: '78%', y: '78%' },
        { label: 'INDIA COVERAGE',    sub: '28 States Monitored',   color: C.accent,  x: '-2%', y: '76%' },
    ];

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '1/1', margin: '0 auto' }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', inset: '12%',
                background: `radial-gradient(circle, ${C.primary}30 0%, transparent 70%)`,
                borderRadius: '50%', filter: 'blur(56px)', zIndex: 0, pointerEvents: 'none',
            }} />

            {/* Globe */}
            {mounted && (
                <div style={{ zIndex: 1, cursor: 'grab', width: 520, height: 520, pointerEvents: 'auto' }}
                    onMouseDown={e => (e.currentTarget.style.cursor = 'grabbing')}
                    onMouseUp={e => (e.currentTarget.style.cursor = 'grab')}
                >
                    <GlobeVis
                        ref={globeRef}
                        width={520}
                        height={520}
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        backgroundColor="rgba(0,0,0,0)"
                        atmosphereColor={C.primaryL}
                        atmosphereAltitude={0.22}
                        arcsData={arcsData}
                        arcColor="color"
                        arcDashLength={0.45}
                        arcDashGap={4}
                        arcDashInitialGap={() => Math.random() * 5}
                        arcDashAnimateTime={2200}
                        ringsData={ringsData}
                        ringColor={(d: any) => d.color}
                        ringMaxRadius="maxR"
                        ringPropagationSpeed="propagationSpeed"
                        ringRepeatPeriod="repeatPeriod"
                    />
                </div>
            )}

            {/* Floating data badges */}
            {BADGES.map((b, i) => (
                <motion.div
                    key={i}
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 3.5 + i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', left: b.x, top: b.y, zIndex: 10,
                        background: 'rgba(10,22,40,0.88)', backdropFilter: 'blur(12px)',
                        border: `1px solid ${b.color}30`, borderRadius: 10,
                        padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 9,
                        pointerEvents: 'none',
                        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${b.color}10`,
                    }}
                >
                    <div style={{ width: 4, height: 22, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 8, fontWeight: 900, color: b.color, letterSpacing: '0.1em' }}>{b.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 600 }}>{b.sub}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/* ── Scroll-triggered fade-up wrapper ─── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── Animated number counter ──────────── */
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
    const [n, setN] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        let v = 0;
        const step = to / (1600 / 14);
        const t = setInterval(() => {
            v += step;
            if (v >= to) { setN(to); clearInterval(t); } else setN(Math.floor(v));
        }, 14);
        return () => clearInterval(t);
    }, [inView, to]);
    return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
            transition: 'all 0.3s ease',
            boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        }}>
            <div style={{
                maxWidth: 1200, margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px', height: 64,
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `linear-gradient(135deg, ${C.bgDark}, ${C.primary})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${C.primary}40`,
                    }}>
                        <Satellite size={17} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: C.text, letterSpacing: '-0.02em' }}>
                            NETRA<span style={{ color: C.primary }}>.AI</span>
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, letterSpacing: '0.06em' }}>
                            Kisan Saathi
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                    {['Platform', 'How it Works', 'Features', 'Data'].map(l => (
                        <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} style={{
                            fontSize: 13, fontWeight: 600, color: C.textMuted,
                            textDecoration: 'none', transition: 'color 0.18s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                        >{l}</a>
                    ))}
                </div>

                {/* CTA */}
                <a href="/login" style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryL})`,
                    color: 'white', fontWeight: 700, fontSize: 13,
                    textDecoration: 'none', cursor: 'pointer',
                    boxShadow: `0 4px 14px ${C.primary}40`,
                    transition: 'all 0.2s',
                }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 6px 20px ${C.primary}60`; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 14px ${C.primary}40`; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                >
                    Open Dashboard <ArrowRight size={14} />
                </a>
            </div>
        </nav>
    );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function Hero() {
    return (
        <section style={{
            background: `linear-gradient(160deg, #0A1628 0%, #0D2040 45%, #0A1628 100%)`,
            padding: '120px 32px 90px',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Grid overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: '56px 56px',
                WebkitMaskImage: 'radial-gradient(ellipse at 60% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)',
                maskImage: 'radial-gradient(ellipse at 60% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Ambient glows */}
            <div style={{ position: 'absolute', top: -80, left: '5%',  width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${C.primary}25 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 60,  right: '2%', width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}15 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>

                {/* LEFT — text */}
                <div>
                    {/* Live badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        style={{ marginBottom: 28 }}
                    >
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '7px 16px', borderRadius: 999,
                            background: `${C.primary}18`, border: `1px solid ${C.primary}35`,
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px rgba(34,197,94,0.25)', animation: 'pulseGlow 2s infinite' }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: C.primaryL, letterSpacing: '0.08em' }}>
                                LIVE · HackX 4.0 · Satellite AgriTech
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.08 }}
                        style={{
                            fontSize: 'clamp(34px, 4.5vw, 64px)',
                            fontWeight: 900, color: 'white', lineHeight: 1.1,
                            letterSpacing: '-0.035em', marginBottom: 22,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    >
                        Satellite Data.<br />
                        <span style={{
                            background: `linear-gradient(135deg, ${C.primaryL} 0%, #22D3EE 100%)`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Instant Farm Action.
                        </span>
                    </motion.h1>

                    {/* Sub */}
                    <motion.p
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.16 }}
                        style={{
                            fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75,
                            maxWidth: 460, marginBottom: 36, fontWeight: 500,
                        }}
                    >
                        NETRA.AI turns Sentinel-1 &amp; Sentinel-2 satellite imagery into real-time
                        crop health scores, irrigation alerts, and fertilizer plans — for every Indian farm,
                        automatically.
                    </motion.p>

                    {/* CTA Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }}
                        style={{ display: 'flex', gap: 12, marginBottom: 52, flexWrap: 'wrap' }}
                    >
                        <a href="/login" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '13px 26px', borderRadius: 12,
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryL})`,
                            color: 'white', fontWeight: 800, fontSize: 14,
                            textDecoration: 'none', cursor: 'pointer',
                            boxShadow: `0 6px 24px ${C.primary}55`,
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 12px 32px ${C.primary}65`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 6px 24px ${C.primary}55`; }}
                        >
                            Open Dashboard <ArrowRight size={16} />
                        </a>
                        <a href="#how-it-works" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '13px 22px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 14,
                            textDecoration: 'none', cursor: 'pointer',
                            backdropFilter: 'blur(8px)', transition: 'all 0.18s',
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.13)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'; }}
                        >
                            How it Works <ChevronRight size={15} />
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42, duration: 0.7 }}
                        style={{ display: 'flex', gap: 32, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {[
                            { val: 20, suffix: '+', label: 'Farms Monitored' },
                            { val: 97, suffix: '%', label: 'Satellite Accuracy' },
                            { val: 48, suffix: 'hr', label: 'Alert Window' },
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
                                    <Counter to={s.val} suffix={s.suffix} />
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* RIGHT — 3D Globe */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <EarthVisual />
                </motion.div>
            </div>

            <style>{`
                @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,0.25);} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0.08);} }
                @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
            `}</style>
        </section>
    );
}

/* ─────────────────────────────────────────────
   TRUST STRIP
───────────────────────────────────────────── */
function TrustStrip() {
    const sources = ['Sentinel-1 SAR', 'Sentinel-2 MSI', 'Landsat-8/9', 'Google Earth Engine', 'CHIRPS Rainfall', 'Open-Meteo API', 'WorldPop 100m', 'HackX 4.0'];
    return (
        <div style={{ background: 'white', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '16px 32px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 8 }}>Powered by</span>
                {sources.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {i > 0 && <span style={{ color: C.border }}>·</span>}
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>{s}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   HOW IT WORKS  (3-step)
───────────────────────────────────────────── */
function HowItWorks() {
    const steps = [
        {
            num: '01', Icon: Satellite, color: C.primary,
            title: 'Satellite Scans Your Farm',
            desc: 'Every 3–5 days, Sentinel-1 & Sentinel-2 satellites pass over India and capture detailed imagery of every crop field — automatically.',
        },
        {
            num: '02', Icon: Cpu, color: C.accent,
            title: 'AI Analyzes Crop Health',
            desc: 'Google Earth Engine processes the imagery to calculate NDVI (vegetation), soil moisture, and water stress scores for each farm plot.',
        },
        {
            num: '03', Icon: Zap, color: C.green,
            title: 'You Get Instant Alerts',
            desc: 'NETRA.AI sends email alerts with exact fertilizer doses and irrigation schedules in simple Hindi & English. No app download required.',
        },
    ];

    return (
        <section id="how-it-works" style={{ background: C.bg, padding: '100px 32px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <FadeUp>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                            How it Works
                        </div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 14 }}>
                            From Satellite to Your Phone<br />
                            <span style={{ color: C.primary }}>in 3 Simple Steps</span>
                        </h2>
                        <p style={{ fontSize: 16, color: C.textMuted, maxWidth: 480, margin: '0 auto' }}>
                            No technical knowledge needed. Just click and act.
                        </p>
                    </div>
                </FadeUp>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}>
                    {/* Connector line */}
                    <div style={{ position: 'absolute', top: 36, left: '16%', right: '16%', height: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.accent}, ${C.green})`, borderRadius: 1, opacity: 0.3 }} />

                    {steps.map((s, i) => (
                        <FadeUp key={i} delay={i * 0.12}>
                            <div style={{
                                background: 'white', border: `1px solid ${C.border}`,
                                borderRadius: 20, padding: '32px 28px',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                position: 'relative', cursor: 'default',
                                transition: 'all 0.2s',
                            }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 12px 36px ${s.color}18`; el.style.borderColor = `${s.color}40`; el.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; el.style.borderColor = C.border; el.style.transform = 'translateY(0)'; }}
                            >
                                {/* Step number */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: `${s.color}12`, border: `1.5px solid ${s.color}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 20, position: 'relative', zIndex: 1,
                                }}>
                                    <s.Icon size={22} color={s.color} />
                                </div>
                                <div style={{ fontSize: 36, fontWeight: 900, color: `${s.color}12`, letterSpacing: '-0.04em', position: 'absolute', top: 24, right: 24 }}>{s.num}</div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>{s.title}</h3>
                                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{s.desc}</p>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   FEATURES BENTO
───────────────────────────────────────────── */
function Features() {
    const feats = [
        { Icon: Radio, color: C.primary, span: 2, tag: 'LIVE DATA', title: 'Real-Time Crop Health Monitoring', desc: 'NDVI satellite index tracks your crop vitality score (0–100) from space. Get instant alerts when a field drops below the danger threshold — before visible damage appears.' },
        { Icon: Droplets, color: C.accent, span: 1, tag: 'WATER MGMT', title: 'Smart Irrigation Alerts', desc: 'Know exactly how many litres each field needs. Satellite soil-moisture + weather fusion eliminates guesswork from irrigation.' },
        { Icon: FlaskConical, color: '#7C3AED', span: 1, tag: 'SOIL INTEL', title: 'Precision Fertilizer Dose', desc: 'Nitrogen deficiency scores from Sentinel-2 tell you exactly how much urea or DAP to apply — per hectare, per field.' },
        { Icon: Shield, color: C.green, span: 1, tag: 'RISK ENGINE', title: 'Crop Risk Scoring', desc: 'Every farm gets a CRITICAL / HIGH / MEDIUM / LOW risk label updated after every satellite pass. Act before yield loss.' },
        { Icon: Globe, color: C.orange, span: 2, tag: 'MISSION DISPATCH', title: 'One-Click Action Dispatch + Email Alerts', desc: 'Click "Apply Fertilizer" on any field and NETRA.AI instantly dispatches a mission briefing email with exact doses, step-by-step instructions in Hindi & English, and a unique Mission ID for tracking.' },
    ];

    return (
        <section id="features" style={{ background: 'white', padding: '100px 32px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <FadeUp>
                    <div style={{ marginBottom: 56 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Platform Features</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                            Everything a Farmer Needs.<br />
                            <span style={{ color: C.primary }}>Powered by Satellites.</span>
                        </h2>
                    </div>
                </FadeUp>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {feats.map((f, i) => (
                        <FadeUp key={i} delay={i * 0.08}>
                            <div style={{
                                gridColumn: `span ${f.span}`,
                                background: C.bg, border: `1px solid ${C.border}`,
                                borderRadius: 20, padding: '28px 26px',
                                transition: 'all 0.22s', cursor: 'default',
                            }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 10px 32px ${f.color}15`; el.style.borderColor = `${f.color}35`; el.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.borderColor = C.border; el.style.transform = 'translateY(0)'; }}
                            >
                                <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 800, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}25`, borderRadius: 5, padding: '3px 8px', letterSpacing: '0.08em', marginBottom: 16 }}>
                                    {f.tag}
                                </span>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <f.Icon size={20} color={f.color} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
                                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   PIPELINE STEPS
───────────────────────────────────────────── */
function Pipeline() {
    const steps = [
        { num: '01', Icon: Satellite, color: '#22D3EE', title: 'Satellite Ingestion', desc: 'Sentinel-1/2 imagery pulled from ESA APIs, filtered by your area of interest, date, and cloud cover.' },
        { num: '02', Icon: Cpu, color: C.primaryL, title: 'GEE Processing', desc: 'NDVI, NDWI, and SAR backscatter algorithms run on Google Earth Engine cloud in seconds.' },
        { num: '03', Icon: Layers, color: C.green, title: 'Data Fusion', desc: 'Weather data, soil moisture, and crop indices are merged into a single per-farm score.' },
        { num: '04', Icon: BarChart3, color: C.orange, title: 'Risk Scoring', desc: 'A fusion model assigns 0–100 confidence scores and tiers every field: CRITICAL / HIGH / MEDIUM / LOW.' },
        { num: '05', Icon: Zap, color: '#8B5CF6', title: 'Action Dispatch', desc: 'Alerts sent via email with exact doses, Hindi instructions, and a unique Mission ID — instantly.' },
    ];

    return (
        <section id="platform" style={{ background: C.bgDark, padding: '100px 32px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <FadeUp>
                    <div style={{ textAlign: 'center', marginBottom: 72 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.primaryL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Automated Pipeline</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 14 }}>
                            From Raw Pixels to Farm Action<br />
                            <span style={{ color: C.primaryL }}>Fully Automated.</span>
                        </h2>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>
                            No manual steps. NETRA.AI processes every satellite pass over India automatically.
                        </p>
                    </div>
                </FadeUp>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 29, left: '8%', right: '8%', height: 1.5, background: `linear-gradient(90deg, transparent, ${C.primaryL}60, #8B5CF660, transparent)` }} />
                    {steps.map((s, i) => (
                        <FadeUp key={i} delay={i * 0.1}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px', position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    width: 58, height: 58, borderRadius: '50%',
                                    background: C.bgDark, border: `2px solid ${s.color}50`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 20, boxShadow: `0 0 24px ${s.color}20`,
                                    transition: 'all 0.2s', cursor: 'default',
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 36px ${s.color}50`; (e.currentTarget as HTMLDivElement).style.borderColor = s.color; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${s.color}20`; (e.currentTarget as HTMLDivElement).style.borderColor = `${s.color}50`; }}
                                >
                                    <s.Icon size={22} color={s.color} />
                                </div>
                                <div style={{ fontSize: 30, fontWeight: 900, color: 'rgba(255,255,255,0.05)', letterSpacing: '-0.04em', marginBottom: 8 }}>{s.num}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 8 }}>{s.title}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.6 }}>{s.desc}</div>
                            </div>
                        </FadeUp>
                    ))}
                </div>

                {/* Code block */}
                <FadeUp delay={0.5}>
                    <div style={{
                        marginTop: 64, background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 20, padding: '28px 32px',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
                    }}>
                        {[
                            { label: 'NDVI Crop Health Algorithm', color: C.primaryL, code: `# Sentinel-2 NDVI\nndvi = (NIR - RED) / (NIR + RED)\n\n# Health Score\nif ndvi > 0.6:  score = "Healthy"\nelif ndvi > 0.3: score = "Fair"\nelse:            score = "Critical"` },
                            { label: 'Mission Dispatch Trigger', color: C.orange, code: `# Auto Email Alert\nif health_score < 40:\n    send_mission(\n        to = farmer.email,\n        dose = "60-80 kg/ha Urea",\n        lang = ["hi", "en"],\n        mission_id = generate_id()\n    )` },
                        ].map(block => (
                            <div key={block.label}>
                                <div style={{ fontSize: 10, color: block.color, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{block.label}</div>
                                <pre style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.07)', lineHeight: 1.75, fontFamily: 'ui-monospace, monospace', margin: 0, overflow: 'auto' }}>
                                    {block.code}
                                </pre>
                            </div>
                        ))}
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   TESTIMONIAL / IMPACT SECTION
───────────────────────────────────────────── */
function Impact() {
    const cards = [
        { Icon: TrendingUp, color: C.green, bg: '#F0FDF4', border: '#BBF7D0', title: 'Increase Yield', stat: '+23%', desc: 'Average yield improvement when farmers act on NETRA.AI fertilizer recommendations within the satellite-suggested window.' },
        { Icon: Droplets, color: C.accent, bg: '#EFF6FF', border: '#BFDBFE', title: 'Save Water', stat: '40%', desc: 'Reduction in water usage through satellite-guided precision irrigation instead of blanket flood irrigation.' },
        { Icon: AlertTriangle, color: C.orange, bg: '#FFF7ED', border: '#FED7AA', title: 'Early Warning', stat: '48hr', desc: 'Average advance warning time before visible crop stress. Farmers can act before revenue loss occurs.' },
    ];

    return (
        <section style={{ background: C.bg, padding: '100px 32px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <FadeUp>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Real Impact</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                            Satellites that Actually
                            <span style={{ color: C.primary }}> Help Farmers</span>
                        </h2>
                    </div>
                </FadeUp>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {cards.map((c, i) => (
                        <FadeUp key={i} delay={i * 0.1}>
                            <div style={{
                                background: 'white', border: `1px solid ${C.border}`,
                                borderRadius: 20, padding: '28px',
                                transition: 'all 0.2s', cursor: 'default',
                            }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 12px 36px ${c.color}14`; el.style.borderColor = `${c.color}30`; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.borderColor = C.border; }}
                            >
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                    <c.Icon size={22} color={c.color} />
                                </div>
                                <div style={{ fontSize: 42, fontWeight: 900, color: c.color, letterSpacing: '-0.04em', marginBottom: 6 }}>{c.stat}</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 10 }}>{c.title}</div>
                                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{c.desc}</p>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   CHECKLIST SECTION  (what it checks)
───────────────────────────────────────────── */
function Checklist() {
    const items = [
        'NDVI crop health score per field — updated every satellite pass',
        'Soil moisture & water deficit calculation in litres',
        'Nitrogen (Khad) demand score per hectare',
        'Risk level: CRITICAL / HIGH / MEDIUM / LOW per farm',
        'One-click mission dispatch with email alert in Hindi + English',
        'Live weather integration (Open-Meteo) for each district',
        'Interactive India map with zoom-to-field satellite overlay',
        'PDF report generation for sharing with district officers',
    ];

    return (
        <section style={{ background: 'white', padding: '80px 32px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
                <FadeUp>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>What's Included</div>
                        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 24 }}>
                            Everything in one<br />
                            <span style={{ color: C.primary }}>Fasal Seva Platform</span>
                        </h2>
                        <a href="/login" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 10,
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryL})`,
                            color: 'white', fontWeight: 700, fontSize: 14,
                            textDecoration: 'none', cursor: 'pointer',
                            boxShadow: `0 4px 16px ${C.primary}35`, transition: 'all 0.18s',
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                        >
                            Start Using Free <ArrowRight size={14} />
                        </a>
                    </div>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                                <CheckCircle size={16} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: 13, color: C.text, fontWeight: 600, lineHeight: 1.5 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   FINAL CTA
───────────────────────────────────────────── */
function FinalCTA() {
    return (
        <section style={{ background: C.bgDark, padding: '100px 32px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                <FadeUp>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryL})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', boxShadow: `0 8px 24px ${C.primary}50`,
                    }}>
                        <Satellite size={28} color="white" />
                    </div>
                    <h2 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, color: 'white', letterSpacing: '-0.035em', lineHeight: 1.12, marginBottom: 18 }}>
                        Your farm deserves<br />
                        <span style={{ background: `linear-gradient(135deg, ${C.primaryL}, #22D3EE)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            satellite-grade intelligence.
                        </span>
                    </h2>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                        Join NETRA.AI — Kisan Saathi. Free to use. Powered by real satellite data. Built for India's 142 million farmers.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <a href="/login" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '15px 32px', borderRadius: 12,
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryL})`,
                            color: 'white', fontWeight: 800, fontSize: 15,
                            textDecoration: 'none', cursor: 'pointer',
                            boxShadow: `0 6px 28px ${C.primary}55`, transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                        >
                            Open Dashboard — It&apos;s Free <ArrowRight size={16} />
                        </a>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 20 }}>
                        No signup required · Real satellite data · HackX 4.0 Demo
                    </p>
                </FadeUp>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
    return (
        <footer style={{ background: '#050D1A', padding: '36px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.bgDark}, ${C.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Satellite size={14} color="white" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                        NETRA.AI · Kisan Saathi · HackX 4.0 · © 2026
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                    {['Sentinel-1', 'Sentinel-2', 'Google Earth Engine', 'Open-Meteo'].map(s => (
                        <span key={s} style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{s}</span>
                    ))}
                </div>
            </div>
        </footer>
    );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function LandingPage() {
    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: C.bg }}>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <Navbar />
            <Hero />
            <TrustStrip />
            <HowItWorks />
            <Features />
            <Pipeline />
            <Impact />
            <Checklist />
            <FinalCTA />
            <Footer />
        </div>
    );
}