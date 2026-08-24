'use client';

import React from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import { Target, Zap, ShieldCheck, Database, Activity } from 'lucide-react';

export default function ConfidenceEnginePage() {
    const { results, cfg } = useStudio();
    const metrics = results?.metrics || {};

    const confVal   = (metrics.peak_confidence ?? 0) * 100;
    const confColor = confVal >= 90 ? '#10B981' : confVal >= 70 ? '#D97706' : '#EF4444';
    const confLabel = confVal >= 90 ? 'High' : confVal >= 70 ? 'Nominal' : 'Low';
    const confBg    = confVal >= 90 ? '#F0FDF4' : confVal >= 70 ? '#FFFBEB' : '#FEF2F2';

    const biasItems = [
        { label: 'SAR Bias',     val: (cfg.sar_conf_base * 100).toFixed(1), icon: Zap,      color: '#0369A1' },
        { label: 'Optical Bias', val: (cfg.opt_conf_base * 100).toFixed(1), icon: Activity,  color: '#0D7377' },
    ];

    const techniqueItems = [
        { title: 'Morphological Smoothing', icon: Database,   color: '#0EA5E9', desc: 'Applied 10m focal filter for contiguous nutrient deficit zones.' },
        { title: 'Consensus Calibration',        icon: ShieldCheck, color: '#8B5CF6', desc: 'Cross-satellite multi-spectral consensus on structural crop health.' },
        { title: 'Temporal Filter',          icon: Activity,    color: '#10B981', desc: 'Baselines normalized from historical seasonal harvest telemetry.' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <Target size={13} color="#0D7377" />
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
                        Confidence Engine
                    </h2>
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                    Probabilistic precision metrics and ensemble reliability scoring
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Main score card */}
                    <div style={{
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 14, padding: '20px 24px',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: confColor, borderRadius: '14px 0 0 14px' }} />
                        <div style={{ paddingLeft: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Peak Ensemble Confidence
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                                <span style={{ fontSize: 64, fontWeight: 800, color: confColor, lineHeight: 1 }}>{confVal.toFixed(1)}</span>
                                <span style={{ fontSize: 20, color: confColor, fontWeight: 600, opacity: 0.7 }}>%</span>
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: confBg, color: confColor,
                                border: `1px solid ${confColor}30`, borderRadius: 8,
                                padding: '5px 12px', fontSize: 11, fontWeight: 700,
                            }}>
                                <ShieldCheck size={12} /> Model Reliability: {confLabel}
                            </div>
                        </div>
                    </div>

                    {/* Bias cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {biasItems.map(b => (
                            <div key={b.label} style={{
                                background: 'white', border: '1px solid #E2E8F0',
                                borderRadius: 12, padding: '14px 16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <b.icon size={11} color={b.color} />
                                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        {b.label}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                    <span style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{b.val}</span>
                                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column - techniques */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                        Precision Techniques
                    </div>
                    {techniqueItems.map(item => (
                        <div key={item.title} style={{
                            background: 'white', border: '1px solid #E2E8F0',
                            borderRadius: 12, padding: '14px 16px',
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            transition: 'border-color 0.15s, transform 0.15s',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = item.color + '60';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#E2E8F0';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: item.color + '12', color: item.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <item.icon size={13} />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{item.title}</div>
                                <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
