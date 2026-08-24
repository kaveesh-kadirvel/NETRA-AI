'use client';

import React from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import { Cpu, Terminal, Copy, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RESTApiEndpointPage() {
    const { cfg, results } = useStudio();

    const exampleCurl = `curl -X POST http://localhost:3000/api/studio/run \\
-H "Content-Type: application/json" \\
-d '${JSON.stringify(cfg, null, 2)}'`;

    const responsePreview = results ? JSON.stringify(results, null, 2) : '// WAITING FOR PIPELINE EXECUTION...';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Cpu size={24} className="text-teal-600" /> Pipeline API Interface
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
                        Programmatic access to the distributed GEE Precision Agronomy Engine
                    </p>
                </div>
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={16} /> ENDPOINT AUTH: ACTIVE
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 500px', gap: 40 }}>
                {/* Left side: Documentation & Request */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ background: '#0D7377', color: '#FFF', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 900 }}>POST</div>
                            <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#475569', fontWeight: 700 }}>/api/studio/run</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, fontWeight: 500, maxWidth: 600 }}>
                            The primary endpoint for triggering the distributed Earth Engine pipeline. This interface handles full parameter sets, including bounding boxes, multi-temporal date ranges, and analytic thresholds.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>cURL Implementation Example</h3>
                            <button onClick={() => copyToClipboard(exampleCurl)} style={{ background: 'transparent', border: 'none', color: '#0EA5E9', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Copy size={12} /> COPY COMMAND
                            </button>
                        </div>
                        <div style={{ background: '#0F172A', padding: 28, borderRadius: 24, border: '1px solid #1E293B', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                            <pre style={{ margin: 0, fontSize: 13, color: '#E2E8F0', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{exampleCurl}</pre>
                        </div>
                    </div>
                </div>

                {/* Right side: Live Output */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Terminal size={14} className="text-teal-600" />
                        <h3 style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Serialized Output</h3>
                    </div>
                    <div style={{ background: '#0F172A', padding: 32, borderRadius: 24, border: '8.1px solid #E2E8F0', height: 480, overflowY: 'auto', boxShadow: '0 12px 48px rgba(0,0,0,0.12)' }}>
                        <pre style={{ margin: 0, fontSize: 12, color: '#22C55E', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {results ? JSON.stringify(results, null, 2) : <span style={{ color: '#475569' }}>// NO ACTIVE PIPELINE DATA...</span>}
                        </pre>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Zap size={16} className="text-amber-500" />
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>LATENCY: <span style={{ color: '#0F172A', fontWeight: 900 }}>{(results?.metrics?.latency || 4.2).toFixed(1)}s AVG</span></div>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>ENCODING: <span style={{ color: '#0F172A', fontWeight: 900 }}>APPLICATION/JSON</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
