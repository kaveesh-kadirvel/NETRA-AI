'use client';

import React from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import { Terminal, Activity, CheckCircle2, Clock } from 'lucide-react';

export default function PipelineLogsPage() {
    const { results } = useStudio();
    const metrics = results?.metrics || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <Terminal size={13} color="#0D7377" />
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
                            Pipeline Telemetry Stream
                        </h2>
                    </div>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                        Real-time backend execution logs from Distributed GEE Intelligence Engine
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: results ? '#F0FDF4' : '#F8FAFC',
                    border: `1px solid ${results ? '#BBF7D0' : '#E2E8F0'}`,
                    borderRadius: 8, padding: '6px 12px',
                    fontSize: 11, fontWeight: 700,
                    color: results ? '#15803D' : '#64748B',
                }}>
                    {results ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {results ? 'Task Complete' : 'Awaiting Run'}
                </div>
            </div>

            {/* Terminal */}
            <div style={{
                background: '#0F172A', borderRadius: 14,
                border: '1px solid #1E293B', overflow: 'hidden',
                minHeight: 480, display: 'flex', flexDirection: 'column',
            }}>
                {/* Terminal chrome */}
                <div style={{
                    padding: '10px 16px', borderBottom: '1px solid #1E293B',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#111827',
                }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981' }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                        NETRA.AI CLI v1.0.4
                    </span>
                    <div style={{ width: 54 }} />
                </div>

                {/* Log stream */}
                <div style={{
                    flex: 1, padding: '20px 24px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    fontFamily: 'monospace', fontSize: 12,
                    overflowY: 'auto', maxHeight: 460,
                }}>
                    {metrics.run_logs?.map((log: string, i: number) => {
                        const isError   = log.includes('ERROR') || log.includes('Failed');
                        const isSuccess = log.includes('Complete') || log.includes('SUCCESS') || log.includes('✅');
                        const isWarn    = log.includes('WARN') || log.includes('⚠️');
                        const logColor  = isError ? '#F87171' : isSuccess ? '#4ADE80' : isWarn ? '#FBBF24' : '#94A3B8';
                        return (
                            <div key={i} style={{
                                display: 'flex', gap: 16, alignItems: 'flex-start',
                                borderLeft: `2px solid ${logColor}30`, paddingLeft: 12,
                            }}>
                                <span style={{ color: '#334155', flexShrink: 0, fontSize: 11 }}>
                                    [{new Date().toISOString().split('T')[1].replace('Z', '')}]
                                </span>
                                <span style={{ color: logColor, wordBreak: 'break-all', lineHeight: 1.6 }}>
                                    <span style={{ color: '#475569', marginRight: 6 }}>$</span>{log}
                                </span>
                            </div>
                        );
                    }) ?? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            height: 360, gap: 16, color: '#334155',
                        }}>
                            <Activity size={36} style={{ opacity: 0.2 }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>TERMINAL IDLE</div>
                                <div style={{ fontSize: 11, color: '#334155', maxWidth: 280, lineHeight: 1.6 }}>
                                    Execute the GEE pipeline from the sidebar to initialize the telemetry stream.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
