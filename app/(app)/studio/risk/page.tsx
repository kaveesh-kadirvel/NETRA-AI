'use client';

import React from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import { AlertCircle, TrendingUp, Users, ShieldCheck, Activity, Database } from 'lucide-react';

export default function RiskSeverityPage() {
    const { results } = useStudio();
    const metrics = results?.metrics || {};

    const score = metrics.severity_score ?? 0;
    const riskLabel = score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Moderate' : score >= 20 ? 'Low' : 'Minimal';
    const riskColor = score >= 80 ? '#EF4444' : score >= 60 ? '#F97316' : score >= 40 ? '#D97706' : score >= 20 ? '#10B981' : '#0D7377';
    const riskBg    = score >= 80 ? '#FEF2F2' : score >= 60 ? '#FFF7ED' : score >= 40 ? '#FFFBEB' : score >= 20 ? '#F0FDF4' : '#F0FDFA';

    const kpis = [
        { label: 'Water Deficit Area', val: (metrics.flood_area ?? 0).toFixed(1), unit: 'km²', icon: Activity, color: '#0369A1' },
        { label: 'Nitrate Stress Area',  val: (metrics.ndvi_loss_area ?? 0).toFixed(1), unit: 'km²', icon: Database, color: '#10B981' },
        { label: 'Yield Depletion', val: Math.round(metrics.exposed_pop ?? 0).toLocaleString(), unit: 'Tons', icon: Users, color: '#D97706' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <AlertCircle size={13} color={riskColor} />
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
                        Yield Risk & Deficit Analysis
                    </h2>
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                    Composite risk synthesis factoring satellite indices and real-world crop yield thresholds
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Score card */}
                    <div style={{
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 14, padding: '20px 24px',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: riskColor, borderRadius: '14px 0 0 14px' }} />
                        <div style={{ paddingLeft: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Composite Loss Index
                            </div>
                            <div style={{ fontSize: 72, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.04em' }}>
                                {score.toFixed(1)}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 8, maxWidth: 320, lineHeight: 1.5 }}>
                                Multi-dimensional yield loss synthesis factoring moisture anomalies and predicted harvest deficits.
                            </div>
                        </div>
                        <div style={{
                            background: riskBg, color: riskColor,
                            border: `1px solid ${riskColor}30`,
                            borderRadius: 10, padding: '6px 14px',
                            fontSize: 11, fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: 6,
                            flexShrink: 0,
                        }}>
                            <AlertCircle size={12} />{riskLabel.toUpperCase()}
                        </div>
                    </div>

                    {/* KPI chips */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {kpis.map(k => (
                            <div key={k.label} style={{
                                background: 'white', border: '1px solid #E2E8F0',
                                borderRadius: 12, padding: '14px 16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <k.icon size={11} color={k.color} />
                                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        {k.label}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                    <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{k.val}</span>
                                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{k.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right breakdown column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Breakdown bars */}
                    <div style={{
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 14, padding: '16px 18px', flex: 1,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                            <TrendingUp size={12} color="#0D7377" />
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>Yield Impact Breakdown</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {metrics.severity_breakdown
                                ? Object.entries(metrics.severity_breakdown).map(([key, val]: any) => (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#0F172A' }}>{(val).toFixed(2)}/10</span>
                                        </div>
                                        <div style={{ height: 5, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${val * 10}%`,
                                                background: riskColor, borderRadius: 10,
                                                transition: 'width 1.2s ease',
                                            }} />
                                        </div>
                                    </div>
                                ))
                                : (
                                    <div style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
                                        Run pipeline to see breakdown
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Advisory */}
                    <div style={{
                        background: '#F8FAFC', border: '1px dashed #CBD5E1',
                        borderRadius: 12, padding: '14px 16px',
                        display: 'flex', gap: 10,
                    }}>
                        <ShieldCheck size={14} color="#0D7377" style={{ flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                                Square-Meter Resource Optimizer
                            </div>
                            <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                                <strong style={{ color: '#0F172A' }}>WATER:</strong> {(metrics.flood_area ?? 1.2).toFixed(1)} km² requires urgent drainage or restricted irrigation today.
                                <br />
                                <strong style={{ color: '#0F172A' }}>FERTILIZER:</strong> {(metrics.ndvi_loss_area ?? 2.4).toFixed(1)} km² requires targeted Nitrogen (N) applications at exact square-meter deficit coordinates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
