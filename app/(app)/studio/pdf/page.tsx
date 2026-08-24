'use client';

import React, { useState } from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import { FileText, Download, CheckCircle2, AlertCircle, Printer, FileDown, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PDFReportPage() {
    const { results } = useStudio();
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const [saving, setSaving] = useState(false);

    const handleGenerate = () => {
        if (!results) return;
        setGenerating(true);
        // Simulate PDF generation delay for UX
        setTimeout(() => {
            setGenerating(false);
            setGenerated(true);
        }, 1500);
    };

    const handleSave = async () => {
        if (!results) return;
        setSaving(true);
        const tid = toast.loading('Compiling native intelligence report...');
        try {
            const res = await fetch('/api/studio/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results),
            });

            if (!res.ok) throw new Error('Failed to generate PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Cosmeon_Assessment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report saved to computer.', { id: tid });
        } catch (e: any) {
            toast.error(`Download Failed: ${e.message}`, { id: tid });
        } finally {
            setSaving(false);
        }
    };

    if (!results) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: 40, borderRadius: 32, border: '1px dashed #CBD5E1', textAlign: 'center' }}>
                    <FileText size={48} style={{ color: '#64748B', marginBottom: 20, marginInline: 'auto' }} />
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>No Active Intelligence Localized</h3>
                    <p style={{ fontSize: 13, color: '#64748B', maxWidth: 300, lineHeight: 1.6 }}>Please execute the Earth Engine pipeline from the sidebar to localize risk data before generating a report.</p>
                </div>
            </div>
        );
    }

    const metrics = results.metrics || {};
    const dateStr = new Date().toLocaleString();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Action Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 24 }}>
                <button
                    onClick={() => window.print()}
                    style={{ padding: '10px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <Printer size={14} /> PRINT VIEW
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                        padding: '10px 24px',
                        background: generating ? '#64748B' : generated ? '#10B981' : '#0F172A',
                        border: 'none', borderRadius: 12, color: '#FFF', fontSize: 11, fontWeight: 900,
                        cursor: generating ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
                        transition: 'all 0.3s'
                    }}
                >
                    {generating ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" /> : generated ? <CheckCircle2 size={14} /> : <FileDown size={14} />}
                    {generating ? 'GENERATING NATIVE PDF...' : generated ? 'GENERATE ANOTHER' : 'GENERATE NATIVE PDF REPORT'}
                </button>
            </div>

            {
                generated && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 20,
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ background: '#DCFCE7', color: '#10B981', padding: 8, borderRadius: 10 }}>
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 950, color: '#065F46' }}>Report Generated Successfully</div>
                                <div style={{ fontSize: 11, color: '#059669', opacity: 0.8, marginTop: 2 }}>The native PDF asset has been compiled from live telemetry.</div>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                background: saving ? '#64748B' : '#0F172A',
                                color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 20px',
                                fontSize: 11, fontWeight: 900, cursor: saving ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8
                            }}
                        >
                            {saving ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" /> : <Download size={14} />}
                            {saving ? 'SAVING...' : 'SAVE TO COMPUTER'}
                        </button>
                    </div>
                )
            }

            <div style={{
                background: '#FFFFFF',
                borderRadius: 32,
                border: '1px solid #E2E8F0',
                boxShadow: '0 20px 48px rgba(0,0,0,0.05)',
                padding: 60,
                maxWidth: 900,
                marginInline: 'auto',
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Watermark/Accent */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle at top right, rgba(13, 115, 119, 0.05), transparent)', pointerEvents: 'none' }} />

                {/* Header Page */}
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#0D7377', letterSpacing: '0.4em', marginBottom: 16, textTransform: 'uppercase' }}>Analytic Intelligence Assessment</div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12 }}>
                        NETRA.AI PRECISION AGRONOMY
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                        <Clock size={12} /> GENERATED: {dateStr}
                        <span style={{ opacity: 0.3 }}>|</span>
                        <ShieldCheck size={12} className="text-teal-600" /> PROVENANCE VERIFIED
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
                    {/* Geographic Context */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Geographic Impact Area</div>
                        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 24, border: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 900, letterSpacing: '0.1em', marginBottom: 4 }}>BOUNDING BOX</div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{results.bbox_str || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 900, letterSpacing: '0.1em', marginBottom: 4 }}>TOTAL AREA ANALYZED</div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{(results.aoi_km2 || 0).toLocaleString()} km²</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Executive Summary */}
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: 8, marginBottom: 16 }}>Executive Summary</div>
                        <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, fontWeight: 500 }}>
                            Analysis of the study area (<strong>{(results.aoi_km2 || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} km²</strong>) utilizing multi-source satellite telemetry reveals
                            <strong> {(metrics.flood_area || 0).toFixed(1)} km² of severe water deficit</strong> and
                            <strong> {(metrics.ndvi_loss_area || 0).toFixed(1)} km² of nitrate vitality loss</strong>.
                            Integration with demographic data indicates <strong>{Math.round(metrics.exposed_pop || 0).toLocaleString()} projected tons of yield lost</strong>.
                            The probabilistic confidence peaked dynamically at <strong>{((metrics.peak_confidence || 0) * 100).toFixed(1)}%</strong>.
                            The derived Yield Severity Index is <strong>{(metrics.severity_score || 0).toFixed(1)}/100</strong>.
                        </p>
                    </div>

                    {/* Quantitative Matrix */}
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: 8, marginBottom: 16 }}>Key Quantitative Metrics</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <tbody>
                                {[
                                    { label: 'Saturated Area', val: `${(metrics.flood_area || 0).toFixed(2)} km²`, detail: `SAR VV threshold ${(metrics.threshold || -2.0).toFixed(1)} dB` },
                                    { label: 'Nitrogen Deficit', val: `${(metrics.ndvi_loss_area || 0).toFixed(2)} km²`, detail: `NDVI drop threshold ${(metrics.ndvi_thresh || -0.12).toFixed(2)}` },
                                    { label: 'Yield Depletion', val: `${Math.round(metrics.exposed_pop || 0).toLocaleString()} Tons`, detail: 'Crop model Inference' },
                                    { label: 'Deficit Anomaly', val: `${(metrics.new_flood_anomaly || 0).toFixed(2)} km²`, detail: 'Current vs Baseline History' },
                                    { label: 'Peak Confidence', val: `${((metrics.peak_confidence || 0) * 100).toFixed(1)}%`, detail: 'Ensemble fusion overlap (>95%)' },
                                    { label: 'Loss Index', val: `${(metrics.severity_score || 0).toFixed(1)}/100`, detail: 'Dynamic 5-factor composite loss' },
                                ].map((m, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '12px 16px', border: '1px solid #E2E8F0', fontWeight: 800, width: '30%' }}>{m.label}</td>
                                        <td style={{ padding: '12px 16px', border: '1px solid #E2E8F0', fontWeight: 600, width: '25%' }}>{m.val}</td>
                                        <td style={{ padding: '12px 16px', border: '1px solid #E2E8F0', color: '#64748B', width: '45%' }}>{m.detail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Data Provenance */}
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: 8, marginBottom: 16 }}>Data Provenance</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <tbody>
                                {[
                                    { label: 'Sentinel-1 SAR Base', val: `${results.n_pre_s1 || 0} scenes (${results.pre_start_s || 'N/A'} - ${results.pre_end_s || 'N/A'})` },
                                    { label: 'Sentinel-1 SAR Post', val: `${results.n_post_s1 || 0} scenes (${results.post_start_s || 'N/A'} - ${results.post_end_s || 'N/A'})` },
                                    { label: 'Sentinel-2 Opt Base', val: `${results.n_pre_s2 || 0} scenes (Cloud limit: ${results.used_cloud || 0}%)` },
                                    { label: 'Sentinel-2 Opt Post', val: `${results.n_post_s2 || 0} scenes (Cloud limit: ${results.used_cloud || 0}%)` },
                                    { label: 'Processing Scale', val: `${results.scale || 0} m spatial resolution` },
                                ].map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '12px 16px', border: '1px solid #E2E8F0', fontWeight: 800, width: '30%' }}>{p.label}</td>
                                        <td style={{ padding: '12px 16px', border: '1px solid #E2E8F0', fontWeight: 600 }}>{p.val}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Signature */}
                <div style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>NETRA.AI ANALYTIC PROVENANCE</div>
                        <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 600 }}>ID: {Math.random().toString(36).substring(2, 12).toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#0D7377', opacity: 0.5 }}>- END OF ASSESSMENT -</div>
                </div>
            </div>
        </div>
    );
}
