'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import RiskBadge from '@/components/shared/RiskBadge';
import ConfidenceBar from '@/components/shared/ConfidenceBar';
import { formatArea, formatDate, formatPopulation, formatScore } from '@/lib/utils/formatters';
import {
    ArrowLeft, Droplets, Users, Activity,
    Calendar, Map as MapIcon, ShieldAlert, Zap,
    FileText, Download, Share2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DistrictDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data, isLoading } = useSWR(`/api/districts/${id}?days=60`, fetcher);

    if (isLoading) return (
        <div style={{ padding: 20 }}>
            <div className="shimmer" style={{ height: 40, width: 200, borderRadius: 8, marginBottom: 20 }} />
            <div className="shimmer" style={{ height: 300, borderRadius: 24 }} />
        </div>
    );

    if (!data?.district) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
            <ShieldAlert size={48} color="#94A3B8" />
            <div style={{ color: '#64748B', fontWeight: 600 }}>Intelligence Dossier not found.</div>
            <Link href="/districts" style={{ color: '#0D7377', fontWeight: 700, textDecoration: 'none' }}>Return to Command Center</Link>
        </div>
    );

    const { district, history } = data;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 28,
                width: '100%',
                paddingBottom: 60,
                // Alignment fix for pro-max layout
                paddingLeft: '4px'
            }}
        >
            {/* ── Header System ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Link href="/districts" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 700, color: '#64748B',
                    textDecoration: 'none', transition: 'color 0.2s'
                }} className="hover:text-teal">
                    <ArrowLeft size={14} /> Intelligence Overview
                </Link>

                <div style={{
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 20
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h1 style={{ fontSize: 36, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                {district.districtName || 'Unknown Sector'}
                            </h1>
                            <RiskBadge level={district.currentRiskLevel} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                            <MapIcon size={14} color="#94A3B8" />
                            {district.stateName || 'Unassigned State'} ·
                            <span style={{ color: '#94A3B8', fontWeight: 500 }}>
                                Sector ID: <span style={{ color: '#64748B', fontWeight: 700 }}>{district.gadmLevel2Id || 'N/A-SEC-' + district._id.toString().slice(-4).toUpperCase()}</span>
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="trigger-btn" style={{ padding: '10px 16px', borderRadius: 12, background: 'white', color: '#0F172A', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                            <Share2 size={14} />
                        </button>
                        <button className="trigger-btn" style={{ padding: '10px 20px', borderRadius: 12 }}>
                            <Download size={14} /> Export Dossier
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Key Tactical Metrics ────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    { icon: Droplets, label: 'Geo Area', val: formatArea(district.areaKm2 ?? 0), color: '#0D7377', bg: '#F0FDFA' },
                    { icon: Users, label: 'Pop. Exposure', val: formatPopulation(district.population2020 ?? 0), color: '#0369A1', bg: '#F0F9FF' },
                    { icon: Activity, label: 'Tactical Events', val: String(district.totalEventsCount ?? 0), color: '#7C3AED', bg: '#F5F3FF' },
                    { icon: zapToIcon(district.currentRiskLevel), label: 'Status Core', val: district.currentRiskLevel, color: getRiskColor(district.currentRiskLevel), bg: '#F8FAFC' },
                ].map(({ icon: Icon, label, val, color, bg }) => (
                    <div key={label} className="operational-card" style={{ padding: '20px', borderBottom: `4px solid ${color}30` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={15} color={color} />
                            </div>
                            <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.02em' }}>{val}</div>
                    </div>
                ))}
            </div>

            {/* ── Intelligence Dossier History ─────────────────────────────── */}
            <div className="operational-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <div style={{
                    padding: '20px 24px', background: 'linear-gradient(90deg, #F8FAFC, #FFFFFF)',
                    borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Intelligence History</h2>
                            <span style={{ background: '#0D737715', color: '#0D7377', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>60 DAY LOG</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: 500 }}>
                            Sequential tactical events detected via SAR & Open-Meteo fusion
                        </p>
                    </div>
                    <FileText size={18} color="#CBD5E1" />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                                {[
                                    { id: 'date', label: 'Detection Date', icon: Calendar },
                                    { id: 'risk', label: 'Risk Vector', icon: ShieldAlert },
                                    { id: 'score', label: 'Intensity', icon: Activity },
                                    { id: 'area', label: 'Impact Area', icon: Droplets },
                                    { id: 'pop', label: 'Exp. Pop', icon: Users },
                                    { id: 'conf', label: 'Confidence', icon: Activity },
                                    { id: 'status', label: 'Status', icon: Zap },
                                ].map((h) => (
                                    <th key={h.id} style={{
                                        padding: '14px 20px', fontSize: 10, fontWeight: 800,
                                        color: '#64748B', textTransform: 'uppercase',
                                        letterSpacing: '0.08em', whiteSpace: 'nowrap'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <h.icon size={11} />
                                            {h.label}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(history ?? []).map((e: any, idx: number) => (
                                <tr key={e._id} className="risk-table-row" style={{ borderBottom: '1px solid #F8FAFC' }}>
                                    <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                                        {formatDate(e.eventDate)}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <RiskBadge level={e.riskLevel} />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                            <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{formatScore(e.riskScore)}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                                        {formatArea(e.floodAreaKm2)}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                                        {formatPopulation(e.affectedPopEst)}
                                    </td>
                                    <td style={{ padding: '16px 20px', minWidth: 140 }}>
                                        <ConfidenceBar score={e.confidenceScore ?? 0.8} />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                                            background: e.status === 'active' ? '#FEF2F2' : '#F0FDF4',
                                            color: e.status === 'active' ? '#DC2626' : '#16A34A',
                                            border: `1px solid ${e.status === 'active' ? '#FECACA' : '#BBF7D0'}`,
                                            textTransform: 'uppercase', letterSpacing: '0.04em'
                                        }}>
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                                            {e.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!history || history.length === 0) && (
                                <tr>
                                    <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                                        <Activity size={32} color="#E2E8F0" style={{ marginBottom: 12 }} />
                                        <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600 }}>No event history recorded for this sector.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function zapToIcon(level: string) {
    if (level === 'CRITICAL' || level === 'HIGH') return ShieldAlert;
    return Zap;
}

function getRiskColor(level: string) {
    const colors: Record<string, string> = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E' };
    return colors[level] ?? '#94A3B8';
}
