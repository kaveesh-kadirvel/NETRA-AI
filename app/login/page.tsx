'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Satellite, Eye, EyeOff, ArrowRight, Shield, Lock, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const DEMO_EXPERT = 'expert@netra.ai';
const DEMO_FARMER = 'farmer@netra.ai';
const DEMO_PASS = 'netra2026';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fillDemo = (type: 'expert' | 'farmer') => {
        setEmail(type === 'expert' ? DEMO_EXPERT : DEMO_FARMER);
        setPassword(DEMO_PASS);
        setError('');
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        setTimeout(() => {
            if ((email === DEMO_EXPERT || email === DEMO_FARMER) && password === DEMO_PASS) {
                // Set RBAC Session State
                sessionStorage.setItem('netra_role', email === DEMO_FARMER ? 'FARMER' : 'EXPERT');
                router.push('/dashboard');
            } else {
                setError('Invalid credentials. Use the demo accounts below.');
                setLoading(false);
            }
        }, 1200);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#04080F',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* Animated Background grid */}
            <div className="animated-grid" style={{
                position: 'absolute', inset: -100,
                backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
                zIndex: 0,
            }} />

            {/* Orbiting Glow effects */}
            <motion.div 
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute', top: '10%', left: '20%',
                    width: 600, height: 600,
                    background: 'radial-gradient(circle, rgba(13,115,119,0.1) 0%, transparent 60%)',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} 
            />
            <motion.div 
                animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute', bottom: '-10%', right: '10%',
                    width: 500, height: 500,
                    background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 60%)',
                    filter: 'blur(60px)',
                    zIndex: 0
                }} 
            />

            {/* Left Panel — Branding */}
            <div style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center',
                padding: '60px 60px 60px 10%',
                position: 'relative', zIndex: 1,
            }}>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    style={{ marginBottom: 40 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, #0D7377, #14A5AA)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(13,115,119,0.5)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <Satellite size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                NETRA<span style={{ color: '#14A5AA' }}>.AI</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#14A5AA', fontWeight: 800, letterSpacing: '0.15em' }}>
                                COMMAND ENGINE
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{
                        fontSize: 'clamp(40px, 4.5vw, 64px)',
                        fontWeight: 900, color: '#fff',
                        lineHeight: 1.1, letterSpacing: '-0.04em',
                        margin: '0 0 24px 0',
                    }}
                >
                    Geospatial<br />
                    <span style={{
                        background: 'linear-gradient(135deg, #14A5AA, #22D3EE, #F8FAFC)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        animation: 'shine 4s linear infinite'
                    }}>
                        Risk Intelligence
                    </span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                        fontSize: 18, color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.6, maxWidth: 480, margin: 0,
                    }}
                >
                    Real-time situational awareness powered by Sentinel-1 SAR, Google Earth Engine, and Bayesian predictive modeling.
                </motion.p>

                {/* Animated Trust Badges */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 48 }}
                >
                    {[
                        { icon: Shield, label: 'SAR + Optical Array' },
                        { icon: Lock, label: 'Audit-Grade Security' },
                        { icon: Activity, label: 'Live Telemetry' },
                    ].map((b, i) => (
                        <div key={i} style={{ 
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 30,
                            background: 'rgba(20, 165, 170, 0.05)',
                            border: '1px solid rgba(20, 165, 170, 0.15)'
                        }}>
                            <b.icon size={14} color="#14A5AA" />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.02em' }}>
                                {b.label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Right Panel — Login Form */}
            <div style={{
                width: '50%', maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px', position: 'relative', zIndex: 1,
            }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.2 }}
                    style={{
                        width: '100%', maxWidth: 420,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 24, padding: '48px 40px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                >
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{
                            fontSize: 26, fontWeight: 800, color: '#fff',
                            letterSpacing: '-0.02em', margin: '0 0 8px 0',
                        }}>
                            Secure Uplink
                        </h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>
                            Authenticate to access the operational dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#14A5AA', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Operator ID
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@netra.ai"
                                required
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 12, color: '#fff', fontSize: 15,
                                    outline: 'none', transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => {
                                    e.currentTarget.style.borderColor = '#14A5AA';
                                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20,165,170,0.1)';
                                }}
                                onBlur={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 32 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#14A5AA', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Passkey
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%', padding: '14px 44px 14px 16px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 12, color: '#fff', fontSize: 15,
                                        outline: 'none', transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = '#14A5AA';
                                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20,165,170,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        height: '100%'
                                    }}
                                >
                                    {showPass
                                        ? <EyeOff size={18} color="rgba(255,255,255,0.3)" />
                                        : <Eye size={18} color="rgba(255,255,255,0.3)" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    fontSize: 12, color: '#EF4444', fontWeight: 600,
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                                }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px 0',
                                background: loading
                                    ? 'rgba(13,115,119,0.5)'
                                    : 'linear-gradient(135deg, #0D7377, #14A5AA)',
                                color: '#fff', border: 'none', borderRadius: 12,
                                fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                boxShadow: '0 8px 24px rgba(13,115,119,0.4)',
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading ? (
                                <div style={{
                                    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: '#fff', borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite',
                                }} />
                            ) : (
                                <>Access Dashboard <ArrowRight size={18} /></>
                            )}
                        </motion.button>
                    </form>

                    {/* Demo credentials */}
                    <div style={{
                        marginTop: 28, padding: '20px',
                        background: 'rgba(20,165,170,0.06)',
                        border: '1px solid rgba(20,165,170,0.15)',
                        borderRadius: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Sparkles size={14} color="#14A5AA" />
                            <div style={{
                                fontSize: 10, fontWeight: 800, color: '#14A5AA',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                            }}>
                                Demo Credentials
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Expert:</span> <strong style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>{DEMO_EXPERT}</strong>
                            </div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Farmer:</span> <strong style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>{DEMO_FARMER}</strong>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => fillDemo('expert')}
                                style={{
                                    flex: 1, padding: '10px 0',
                                    background: 'rgba(20,165,170,0.1)', border: '1px solid rgba(20,165,170,0.2)',
                                    borderRadius: 10, color: '#14A5AA', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Expert Role
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemo('farmer')}
                                style={{
                                    flex: 1, padding: '10px 0',
                                    background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
                                    borderRadius: 10, color: '#16A34A', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Farmer Role
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes panBg { from { background-position: 0 0; } to { background-position: -50px -50px; } }
                @keyframes shine { 
                    0% { background-position: -200% center; } 
                    100% { background-position: 200% center; } 
                }
                .animated-grid {
                    animation: panBg 4s linear infinite;
                }
                input::placeholder { color: rgba(255,255,255,0.2) !important; }
            `}</style>
        </div>
    );
}
