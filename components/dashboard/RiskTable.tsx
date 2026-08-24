'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import ConfidenceBar from '@/components/shared/ConfidenceBar';
import { formatDate } from '@/lib/utils/formatters';
import { List, Droplets, FlaskConical, Navigation } from 'lucide-react';

const COLUMNS = [
    { key: 'farm',        label: 'Farm Plot'    },
    { key: 'crop',        label: 'Crop'         },
    { key: 'healthScore', label: 'Health'       },
    { key: 'ndvi_ndmi',   label: 'NDVI / NDMI'  },
    { key: 'needs',       label: 'Prescription' },
    { key: 'date',        label: 'Date'         },
];

export default function RiskTable() {
    const { data, isLoading } = useSWR('/api/insights/latest?limit=20', fetcher, { refreshInterval: 60000 });

    if (isLoading) {
        return (
            <div style={{
                background: 'white', border: '1px solid #E2E8F0',
                borderRadius: 16, overflow: 'hidden',
            }}>
                <div style={{ height: 3, background: '#0D7377' }} />
                <div style={{ height: 340, animation: 'pulse 1.5s ease-in-out infinite', background: '#F8FAFC' }} />
            </div>
        );
    }

    const events = data?.events ?? [];

    return (
        <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
            {/* Header */}
            <div style={{
                padding: '24px 24px 16px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: '#0D737712', color: '#0D7377',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <List size={16} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>Precision Plot Status</span>
                    <span style={{
                        marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#0D7377',
                        background: 'rgba(13,115,119,0.08)', border: '1px solid rgba(13,115,119,0.2)',
                        borderRadius: 5, padding: '2px 7px',
                    }}>
                        {events.length} plots assessed
                    </span>
                </div>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Refreshes every 60s</span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#FAFAFA' }}>
                            {COLUMNS.map(col => (
                                <th key={col.key} style={{
                                    padding: '10px 16px', textAlign: 'left',
                                    fontSize: 10, fontWeight: 700, color: '#94A3B8',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    whiteSpace: 'nowrap', borderBottom: '1px solid #F1F5F9',
                                }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#CBD5E1' }}>
                                    <List size={28} style={{ margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', margin: 0 }}>
                                        No farm data available.
                                    </p>
                                </td>
                            </tr>
                        ) : events.map((e: any) => {
                            let healthColor = '#10B981';
                            if (e.healthScore < 50) healthColor = '#F97316';
                            if (e.healthScore < 25) healthColor = '#EF4444';
                            
                            return (
                                <tr key={e._id}
                                    style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.12s' }}
                                >
                                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                        {e.farmId?.farmName ?? 'Unknown'}
                                        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Navigation size={9} />
                                            {(e.farmId?.areaSqm / 10000).toFixed(2)} Ha
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                                        {e.farmId?.cropType}
                                    </td>
                                    <td style={{ padding: '12px 16px', minWidth: 100 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                                                <div style={{ width: `${e.healthScore}%`, height: '100%', background: healthColor }} />
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: healthColor }}>{e.healthScore}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span>I: {e.avgNDVI.toFixed(2)}</span>
                                            <span>M: {e.avgNDMI.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                 <Droplets size={12} color="#0ea5e9" />
                                                 <span style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9' }}>
                                                    {e.waterDeficitLiters.toLocaleString(undefined, {maximumFractionDigits: 0})} L
                                                 </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                 <FlaskConical size={12} color="#8b5cf6" />
                                                 <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>
                                                    {e.nitrogenReqKg.toLocaleString(undefined, {maximumFractionDigits: 1})} Kg N
                                                 </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {formatDate(e.date)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
