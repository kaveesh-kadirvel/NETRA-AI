'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import { AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { formatPopulation, formatArea } from '@/lib/utils/formatters';

export default function AlertBanner() {
    const { data } = useSWR('/api/insights/latest?limit=10', fetcher, { refreshInterval: 60000 });

    const criticalEvents = (data?.events ?? []).filter((e: any) => e.riskLevel === 'CRITICAL' && e.status === 'active');

    if (!criticalEvents.length) {
        return (
            <div style={{
                background: 'rgba(240, 253, 244, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: 20,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
                <div style={{ background: '#DCFCE7', borderRadius: 12, padding: 10, color: '#16A34A' }}>
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 950, color: '#064E3B', letterSpacing: '-0.01em' }}>
                        Alert Center · <span style={{ color: '#059669' }}>System Nominal</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#065F46', fontWeight: 600, opacity: 0.8, marginTop: 2 }}>
                        No critical flood anomalies detected across 2,400+ monitored grid cells.
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="pulse-dot" style={{ background: '#22C55E' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monitoring Active</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderLeft: '5px solid #EF4444',
            borderRadius: 20,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.08)'
        }}>
            <div style={{ background: '#FEE2E2', borderRadius: 12, padding: 10, color: '#EF4444', marginTop: 2 }}>
                <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 950, color: '#991B1B', marginBottom: 8, letterSpacing: '-0.02em' }}>
                    🚨 {criticalEvents.length} CRITICAL Threat Zone{criticalEvents.length > 1 ? 's' : ''} Identified
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {criticalEvents.slice(0, 4).map((e: any) => (
                        <span
                            key={e._id}
                            style={{
                                fontSize: 11, fontWeight: 800, color: '#B91C1C',
                                background: 'white', padding: '6px 14px', borderRadius: 10,
                                border: '1px solid rgba(185, 28, 28, 0.15)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                display: 'flex', alignItems: 'center', gap: 6
                            }}
                        >
                            <Activity size={12} />
                            {e.districtId?.districtName ?? 'District'} · {formatArea(e.floodAreaKm2)} · {formatPopulation(e.affectedPopEst)} POP
                        </span>
                    ))}
                    {criticalEvents.length > 4 && (
                        <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 800, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                            +{criticalEvents.length - 4} MORE THREATS
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
