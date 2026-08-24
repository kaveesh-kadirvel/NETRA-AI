'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';
import {
    Terminal, Info, AlertTriangle, XCircle,
    RefreshCw, CheckCircle2, Clock,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';

const LEVEL: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    INFO:  { icon: Info,          color: '#0369A1', bg: '#EFF6FF', border: '#BFDBFE' },
    WARN:  { icon: AlertTriangle, color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
    ERROR: { icon: XCircle,       color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const STAGE_COLOR: Record<string, string> = {
    INIT: '#0D7377', GEE: '#7C3AED', INGEST: '#0369A1',
    DETECT: '#0891B2', ENRICH: '#C2410C', OUTPUT: '#16A34A', ERROR: '#DC2626',
};

export default function LogsPage() {
    const { data, isLoading, mutate } = useSWR('/api/pipeline/logs?limit=200', fetcher, {
        refreshInterval: 30_000,
    });

    const hasRealLogs = (data?.totalLogs ?? 0) > 0;
    const runs: any[] = data?.runs ?? [];
    const allLogs: any[] = data?.logs ?? [];

    const infoCount  = allLogs.filter(l => l.level === 'INFO').length;
    const warnCount  = allLogs.filter(l => l.level === 'WARN').length;
    const errorCount = allLogs.filter(l => l.level === 'ERROR').length;
    const maxMs      = allLogs.reduce((m, l) => Math.max(m, l.durationMs ?? 0), 0);

    const statItems = [
        { label: 'Total Logs',   val: allLogs.length,                             color: '#0F172A' },
        { label: 'Unique Runs',  val: hasRealLogs ? data.uniqueRuns : 0,          color: '#0D7377' },
        { label: 'Info Steps',   val: infoCount,                                  color: '#0369A1' },
        { label: 'Warnings',     val: warnCount,                                  color: '#C2410C' },
        { label: 'Errors',       val: errorCount,                                 color: '#DC2626' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Terminal size={15} color="#0D7377" />
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                            Pipeline Logs
                        </h1>
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                        {!isLoading && !hasRealLogs
                            ? 'No logs recorded. Trigger the GEE Pipeline to ingest data.'
                            : `${data?.totalLogs ?? 0} entries · ${data?.uniqueRuns ?? 0} run(s) — live from MongoDB`}
                    </p>
                </div>
                <button
                    onClick={() => mutate()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 9,
                        background: 'white', border: '1px solid #E2E8F0',
                        fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0D7377'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            {/* No-data warning */}
            {!hasRealLogs && !isLoading && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#FFF7ED', border: '1px solid #FED7AA',
                    borderRadius: 10, padding: '10px 16px',
                }}>
                    <AlertTriangle size={14} color="#C2410C" />
                    <span style={{ fontSize: 12, color: '#92400E' }}>
                        No pipeline runs found. Trigger the <strong>GEE Pipeline</strong> or <strong>Fetch Live Data</strong> to ingest.
                    </span>
                </div>
            )}

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {statItems.map(s => (
                    <div key={s.label} style={{
                        background: 'white', border: '1px solid #E2E8F0',
                        borderRadius: 12, padding: '12px 16px',
                    }}>
                        <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* Run badges */}
            {hasRealLogs && runs.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {runs.slice(0, 5).map((run: any) => (
                        <div key={run.runId} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#F0FDF4', border: '1px solid #BBF7D0',
                            borderRadius: 8, padding: '5px 12px',
                        }}>
                            <CheckCircle2 size={10} color="#0D7377" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                                {run.runId.slice(0, 8)}…
                            </span>
                            <span style={{ fontSize: 10, color: '#64748B' }}>
                                {run.stages.join(' → ')}
                            </span>
                            {run.errors > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>
                                    {run.errors} err
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Terminal */}
            <div style={{
                background: '#0A0F1A', borderRadius: 14,
                border: '1px solid rgba(13,115,119,0.25)',
                overflow: 'hidden',
            }}>
                {/* Terminal chrome */}
                <div style={{
                    padding: '10px 18px', background: '#111827',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                    </div>
                    <Terminal size={12} color="#0D7377" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>
                        netra-pipeline — {hasRealLogs ? 'live db logs' : 'no data'}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={10} color="#475569" />
                        <span style={{ fontSize: 10, color: '#475569' }}>
                            {maxMs > 0 ? `${(maxMs / 1000).toFixed(1)}s` : 'N/A'}
                        </span>
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: hasRealLogs ? '#22C55E' : '#F59E0B',
                        }} />
                    </div>
                </div>

                {/* Log entries */}
                <div style={{
                    padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 5,
                    maxHeight: 480, overflowY: 'auto',
                }}>
                    {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{
                                height: 48, borderRadius: 7,
                                background: 'rgba(255,255,255,0.04)',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                        ))
                        : allLogs.map((log: any, i: number) => {
                            const lvl = LEVEL[log.level] ?? LEVEL.INFO;
                            const LvlIcon = lvl.icon;
                            const stageColor = STAGE_COLOR[log.stage] ?? '#64748B';
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '8px 11px', borderRadius: 8,
                                    background: lvl.bg + '18',
                                    border: `1px solid ${lvl.border}30`,
                                }}>
                                    <LvlIcon size={12} color={lvl.color} style={{ marginTop: 2, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 800, color: stageColor,
                                                fontFamily: 'monospace',
                                                background: stageColor + '18',
                                                border: `1px solid ${stageColor}30`,
                                                padding: '1px 6px', borderRadius: 4,
                                            }}>
                                                {log.stage}
                                            </span>
                                            <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>
                                                +{(log.durationMs ?? 0).toLocaleString()}ms
                                            </span>
                                            {log.runId && log.runId !== 'run-demo' && (
                                                <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>
                                                    run:{log.runId.slice(0, 8)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: '#CBD5E1',
                                            fontFamily: 'monospace', lineHeight: 1.5, wordBreak: 'break-word',
                                        }}>
                                            {log.message}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {log.timestamp
                                            ? new Date(log.timestamp).toLocaleTimeString('en-IN')
                                            : '—'}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* PS-06 compliance note */}
            <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: 'rgba(13,115,119,0.04)', border: '1px solid rgba(13,115,119,0.14)',
                borderRadius: 10, padding: '11px 14px',
            }}>
                <CheckCircle2 size={13} color="#0D7377" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7 }}>
                    <strong style={{ color: '#0D7377' }}>PS-06 R6 — Pipeline Log Compliance:</strong> All ingestion, detection, and enrichment steps are stored as structured{' '}
                    <code style={{ fontSize: 10, background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>ProcessingLog</code> documents in MongoDB.
                    Available via <code style={{ fontSize: 10, background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>GET /api/pipeline/logs</code>.
                </div>
            </div>
        </div>
    );
}
