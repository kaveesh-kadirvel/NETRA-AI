'use client';

import { useState } from 'react';
import { RefreshCw, CloudRain, Clock, Loader2, Satellite, Wifi, Languages, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
    const { language, setLanguage } = useLanguage();
    const [fetchingLive, setFetchingLive] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [lastRun, setLastRun] = useState<string | null>(null);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState<'success' | 'error'>('success');
    const [showLangMenu, setShowLangMenu] = useState(false);

    const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
        setMsg(text);
        setMsgType(type);
        setTimeout(() => setMsg(''), 7000);
    };

    const handleFetchLive = async () => {
        setFetchingLive(true);
        setMsg('');
        try {
            const res = await fetch('/api/realtime/ingest-weather', {
                method: 'POST',
                cache: 'no-store',
            });
            const data = await res.json();

            if (data.success) {
                setLastRun(new Date().toLocaleTimeString('en-IN'));
                const topRisk = data.districts?.find((d: any) => d.riskLevel === 'CRITICAL') ??
                    data.districts?.find((d: any) => d.riskLevel === 'HIGH');

                const successMsg = `✓ Live data loaded · ${data.eventsCreated || 0} districts`;
                const riskPart = topRisk ? `${topRisk.district}: ${topRisk.riskLevel} (${topRisk.riskScore})` : "All OK";

                showMsg(`${successMsg} · ${riskPart}`, 'success');
                setTimeout(() => window.location.reload(), 1200);
            } else {
                showMsg(`✗ ${data.error}`, 'error');
            }
        } catch {
            showMsg("✗ Live fetch failed — check console", 'error');
        } finally {
            setFetchingLive(false);
        }
    };

    const handleTrigger = async () => {
        setTriggering(true);
        setMsg('');
        try {
            const res = await fetch('/api/pipeline/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aoiName: 'assam_india' }),
            });
            const data = await res.json();
            setLastRun(new Date().toLocaleTimeString('en-IN'));
            showMsg(`✓ GEE pipeline queued · runId: ${data.runId?.slice(0, 8) || '...'}...`, 'success');
        } catch {
            showMsg("✗ Pipeline trigger failed", 'error');
        } finally {
            setTriggering(false);
        }
    };

    const langNames: Record<string, string> = {
        en: 'English',
        hi: 'हिन्दी',
        bn: 'বাংলা',
        as: 'অসমীया',
        es: 'Español',
        fr: 'Français',
        ar: 'العربية'
    };

    const supportedLocales = ['en', 'hi', 'bn', 'as', 'es', 'fr', 'ar'];

    return (
        <header
            style={{
                background: 'white',
                borderBottom: '1px solid #E2E8F0',
                padding: '0 24px',
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                position: 'relative',
                zIndex: 50
            }}
        >
            {/* Left */}
            <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0A1628', letterSpacing: '-0.01em' }}>
                    Precision Agriculture Dashboard
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        India Nationwide · Multi-Sensor Sentinel Selection · Open-Meteo Live
                    </span>
                    <span
                        style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            background: '#F0FDF4', color: '#16A34A',
                            border: '1px solid #BBF7D0', borderRadius: 4,
                            padding: '1px 6px',
                        }}
                    >
                        LIVE
                    </span>
                </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {msg && (
                    <div
                        style={{
                            fontSize: 12,
                            color: msgType === 'success' ? '#10B981' : '#EF4444',
                            background: msgType === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            padding: '6px 14px', borderRadius: 8,
                            border: `1px solid ${msgType === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            fontWeight: 700, maxWidth: 300,
                        }}
                    >
                        {msg}
                    </div>
                )}

                {/* Language Selector */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        onBlur={() => setTimeout(() => setShowLangMenu(false), 200)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                        style={{ cursor: 'pointer', outline: 'none' }}
                    >
                        <Languages size={14} className="text-slate-500" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            {langNames[language]}
                        </span>
                        <ChevronDown size={12} className={`text-slate-400 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showLangMenu && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                width: 160,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                padding: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                zIndex: 60
                            }}
                        >
                            {supportedLocales.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => {
                                        setLanguage(loc);
                                        setShowLangMenu(false);
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: language === loc ? 700 : 500,
                                        color: language === loc ? '#2563EB' : '#475569',
                                        background: language === loc ? '#EFF6FF' : 'transparent',
                                        textAlign: 'left',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (language !== loc) e.currentTarget.style.background = '#F8FAFC';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (language !== loc) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {langNames[loc]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ width: 1, height: 24, background: '#E2E8F0', margin: '0 4px' }} />

                {lastRun && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B' }}>
                        <Clock size={11} />
                        Last run: {lastRun}
                    </div>
                )}

                <button
                    onClick={handleFetchLive}
                    disabled={fetchingLive}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 18px',
                        background: fetchingLive ? '#1e293b' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: 'white', border: 'none', borderRadius: 10,
                        fontSize: 12, fontWeight: 700,
                        cursor: fetchingLive ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        transition: 'all 0.2s',
                    }}
                >
                    {fetchingLive
                        ? <Loader2 size={13} className="animate-spin" />
                        : <CloudRain size={13} />
                    }
                    {fetchingLive ? "SYNCHRONIZING..." : "FETCH INTEL"}
                </button>

                <button
                    onClick={handleTrigger}
                    disabled={triggering}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 18px',
                        color: 'white', border: 'none', borderRadius: 10,
                        fontSize: 12, fontWeight: 700,
                        cursor: triggering ? 'not-allowed' : 'pointer',
                        background: triggering ? '#1e293b' : 'linear-gradient(135deg, #0D7377, #0891B2)',
                        boxShadow: '0 4px 12px rgba(13, 115, 119, 0.2)',
                    }}
                >
                    {triggering
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Satellite size={14} />
                    }
                    {triggering ? "QUEUING..." : "GEE PIPELINE"}
                </button>
            </div>
        </header>
    );
}
