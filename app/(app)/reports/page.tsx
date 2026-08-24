import { FileText, Download, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export const metadata = { title: 'Reports · NETRA.AI' };

const MOCK_REPORTS = [
    { id: 'RPT-2026-001', title: 'Assam Flood Assessment — Feb 2026',    date: '2026-02-22', status: 'ready',      districts: 5,  critical: 1 },
    { id: 'RPT-2026-002', title: 'Brahmaputra Basin Risk Summary',        date: '2026-02-15', status: 'ready',      districts: 8,  critical: 2 },
    { id: 'RPT-2026-003', title: 'Monthly Climate Risk Digest — Jan',     date: '2026-01-31', status: 'ready',      districts: 12, critical: 0 },
    { id: 'RPT-2026-004', title: 'Emergency Assessment — Dhubri Flood',   date: '2026-01-18', status: 'generating', districts: 1,  critical: 1 },
];

export default function ReportsPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <FileText size={15} color="#0D7377" />
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                        Assessment Reports
                    </h1>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                    Auto-generated JSON & PDF reports from pipeline runs
                </p>
            </div>

            {/* Summary chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                    { label: 'Total Reports', val: MOCK_REPORTS.length,                                   color: '#0F172A' },
                    { label: 'Ready',         val: MOCK_REPORTS.filter(r => r.status === 'ready').length, color: '#16A34A' },
                    { label: 'Generating',    val: MOCK_REPORTS.filter(r => r.status !== 'ready').length, color: '#D97706' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 12, padding: '12px 16px',
                    }}>
                        <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* Report rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MOCK_REPORTS.map(r => (
                    <div key={r.id} style={{
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 12, padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 16,
                        transition: 'border-color 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#0D7377'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                    >
                        {/* Icon */}
                        <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: '#F0FDFA', color: '#0D7377',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <FileText size={18} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>{r.id}</span>
                                <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
                                <span style={{ fontSize: 10, color: '#94A3B8' }}>{formatDate(r.date)}</span>
                                <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
                                <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{r.districts} districts</span>
                                {r.critical > 0 && (
                                    <>
                                        <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#EF4444', fontWeight: 700 }}>
                                            <AlertTriangle size={9} /> {r.critical} critical
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Status + Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                                background: r.status === 'ready' ? '#F0FDF4' : '#FFF7ED',
                                color:      r.status === 'ready' ? '#16A34A' : '#C2410C',
                                border:     `1px solid ${r.status === 'ready' ? '#BBF7D0' : '#FED7AA'}`,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                {r.status === 'ready' ? null : <Clock size={9} />}
                                {r.status === 'ready' ? 'Ready' : 'Generating…'}
                            </span>
                            {r.status === 'ready' && (
                                <button style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 12px', background: 'white',
                                    border: '1px solid #E2E8F0', borderRadius: 8,
                                    fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#F8FAFC';
                                        e.currentTarget.style.borderColor = '#0D7377';
                                        e.currentTarget.style.color = '#0D7377';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.color = '#475569';
                                    }}
                                >
                                    <Download size={11} /> JSON
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
