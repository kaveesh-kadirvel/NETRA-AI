'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '@/components/studio/StudioContext';
import {
    Send, Bot, Loader2, CheckCircle2,
    Stethoscope, Droplets, TrendingUp, ClipboardList, ShieldAlert,
    ChevronRight, Sparkles, RefreshCw,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   AGENT DEFINITIONS
════════════════════════════════════════════════════════════════ */

type AgentId = 'fasal_doctor' | 'jal_margdarshak' | 'kheti_munshi' | 'khet_prabandhak' | 'jokhim_salahkar';

interface Agent {
    id: AgentId;
    name: string;
    hindiName: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    gradient: string;
    quickPrompts: { label: string; prompt: string }[];
}

const AGENTS: Agent[] = [
    {
        id: 'fasal_doctor',
        name: 'Crop Doctor',
        hindiName: 'Fasal Doctor',
        tagline: 'Diagnoses plant health & nutrient deficiency',
        icon: <Stethoscope size={16} />,
        color: '#16A34A',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        gradient: 'linear-gradient(135deg, #16A34A, #22C55E)',
        quickPrompts: [
            { label: 'Crop Health Status', prompt: 'What is the current health status of my crops? Diagnose any deficiencies visible in the satellite data.' },
            { label: 'Nitrogen Deficiency', prompt: 'Check for signs of nitrogen stress in my fields and prescribe the exact Urea treatment needed.' },
            { label: 'NDVI Analysis', prompt: 'Analyze the NDVI data and tell me which zones are showing stress — explain it like a doctor.' },
            { label: 'Treatment Plan', prompt: 'Create a complete crop treatment plan for this week based on the satellite analysis.' },
        ],
    },
    {
        id: 'jal_margdarshak',
        name: 'Water Guide',
        hindiName: 'Jal Margdarshak',
        tagline: 'Manages irrigation — prevents drought & root rot',
        icon: <Droplets size={16} />,
        color: '#0369A1',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        gradient: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
        quickPrompts: [
            { label: 'Should I Water Today?', prompt: 'Based on soil saturation and rain forecast, should I irrigate my fields today? Where exactly?' },
            { label: 'Waterlogged Zones', prompt: 'Which areas are currently waterlogged and at risk of root rot? Tell me exactly where NOT to irrigate.' },
            { label: 'Water Deficit Map', prompt: 'Create a zone-by-zone water deficit map and prescribe exact irrigation quantities for each area.' },
            { label: 'Rain vs. Pump', prompt: 'Is it worth running the water pump today or should I wait for forecasted rain?' },
        ],
    },
    {
        id: 'kheti_munshi',
        name: 'Profit Planner',
        hindiName: 'Kheti Munshi',
        tagline: 'Calculates ROI for every farm action',
        icon: <TrendingUp size={16} />,
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
        quickPrompts: [
            { label: 'Is Action Worth It?', prompt: 'Calculate the ROI of treating the identified deficiencies today vs. doing nothing. Show me in rupees.' },
            { label: 'Cost of Fertilizer', prompt: 'How much will the recommended fertilizer treatment cost? What yield value will I save? Is it worth spending the money?' },
            { label: 'Rain Saves Money?', prompt: 'Is there enough rain coming that I should skip irrigation this week and save the pumping cost?' },
            { label: 'Yield Loss Estimate', prompt: 'If I take NO action in the next 7 days, what is the financial loss I will suffer? Calculate in tons and rupees.' },
        ],
    },
    {
        id: 'khet_prabandhak',
        name: 'Daily Taskmaster',
        hindiName: 'Khet Prabandhak',
        tagline: 'Turns data into step-by-step field orders',
        icon: <ClipboardList size={16} />,
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        quickPrompts: [
            { label: "Today's Action Plan", prompt: "Give me today's complete field work plan as a numbered checklist. Tell me exactly what to do, where, and with what equipment." },
            { label: 'PELICAN Route', prompt: 'Generate PELICAN tractor navigation instructions for today — include which zones to avoid due to waterlogging.' },
            { label: 'Equipment Needed', prompt: 'What equipment, fertilizer bags, and water should I prepare this morning before going to the field?' },
            { label: 'Safe Paths', prompt: 'Which field paths are safe to drive the tractor on today? Which should I avoid and why?' },
        ],
    },
    {
        id: 'jokhim_salahkar',
        name: 'Risk Scout',
        hindiName: 'Jokhim Salahkar',
        tagline: 'Predicts risks before they happen',
        icon: <ShieldAlert size={16} />,
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA',
        gradient: 'linear-gradient(135deg, #DC2626, #EF4444)',
        quickPrompts: [
            { label: '30-Day Risk Forecast', prompt: 'Looking at the last 30 days of data, what risks are developing? Give me a long-term risk forecast.' },
            { label: 'Drought Risk?', prompt: 'Is my farm at risk of drought in the next 2–4 weeks? Show me the trend data and give an early warning.' },
            { label: 'Historical Comparison', prompt: 'Compare current conditions to last year same time. Are things better or worse? What should I be worried about?' },
            { label: 'Prevention Plan', prompt: 'Based on the trend, what early actions should I take NOW to prevent a bigger problem next month?' },
        ],
    },
];

interface Message {
    role: 'user' | 'assistant';
    content: string;
    agentId?: AgentId;
}

/* ════════════════════════════════════════════════════════════════
   MARKDOWN RENDERER (shared)
════════════════════════════════════════════════════════════════ */

function renderMarkdown(content: string): string {
    let h = content
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0F172A">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="color:#475569">$1</em>')
        .replace(/^###\s+(.*$)/gm, '<div style="font-size:12px;font-weight:800;margin:12px 0 4px;color:#0F172A;letter-spacing:-0.01em">$1</div>')
        .replace(/^##\s+(.*$)/gm, '<div style="font-size:13px;font-weight:800;margin:14px 0 6px;color:#0F172A;letter-spacing:-0.02em">$1</div>')
        .replace(/^#\s+(.*$)/gm, '<div style="font-size:14px;font-weight:900;margin:16px 0 8px;color:#0F172A;letter-spacing:-0.02em">$1</div>')
        .replace(/^[-*]\s+(.*$)/gm, '<div style="display:flex;align-items:flex-start;gap:6px;margin:4px 0"><span style="color:#0D7377;font-weight:900;font-size:14px;line-height:1.2">•</span><span style="flex:1;line-height:1.6;color:#334155">$1</span></div>')
        .replace(/^(\d+)\.\s+(.*$)/gm, '<div style="display:flex;align-items:flex-start;gap:6px;margin:5px 0"><span style="color:#0D7377;font-weight:800;font-size:11px;line-height:1.6;min-width:18px;background:#F0FDFA;border-radius:4px;padding:1px 4px;text-align:center">$1</span><span style="flex:1;line-height:1.6;color:#334155">$2</span></div>');

    h = h.replace(/<\/div>\s*\n+/g, '</div>');
    h = h.replace(/\n\n+/g, '<div style="height:10px"></div>');
    h = h.replace(/\n/g, '<br/>');
    return h;
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */

export default function KisanBotPage() {
    const { results } = useStudio();
    const [activeAgent, setActiveAgent] = useState<AgentId>('fasal_doctor');
    const [messages, setMessages] = useState<Message[]>([]);
    const [query, setQuery] = useState('');
    const [streaming, setStreaming] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const agent = AGENTS.find(a => a.id === activeAgent)!;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear chat when switching agents
    const switchAgent = (id: AgentId) => {
        setActiveAgent(id);
        setMessages([]);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const sendMessage = async (text?: string) => {
        const input = text || query.trim();
        if (!input || streaming) return;

        const userMsg: Message = { role: 'user', content: input, agentId: activeAgent };
        const history = [...messages, userMsg];
        setMessages(history);
        setQuery('');
        setStreaming(true);

        const assistantMsg: Message = { role: 'assistant', content: '', agentId: activeAgent };
        setMessages([...history, assistantMsg]);

        try {
            const res = await fetch('/api/studio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.map(m => ({ role: m.role, content: m.content })),
                    results: results || null,
                    agentRole: activeAgent,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                setMessages(prev => {
                    const u = [...prev];
                    u[u.length - 1] = { role: 'assistant', content: `⚠️ Error: ${err.error || 'Failed'}`, agentId: activeAgent };
                    return u;
                });
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let full = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        try {
                            full += JSON.parse(data).content;
                            setMessages(prev => {
                                const u = [...prev];
                                u[u.length - 1] = { role: 'assistant', content: full, agentId: activeAgent };
                                return u;
                            });
                        } catch { }
                    }
                }
            }
        } catch (err: any) {
            setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { role: 'assistant', content: `⚠️ Network error: ${err.message}`, agentId: activeAgent };
                return u;
            });
        } finally {
            setStreaming(false);
        }
    };

    return (
        <div style={{
            display: 'flex', height: '100%',
            background: '#F8FAFC', overflow: 'hidden',
        }}>

            {/* ── LEFT: AGENT SELECTOR PANEL ─────────────────────────── */}
            <div style={{
                width: 240, flexShrink: 0,
                borderRight: '1px solid #E2E8F0',
                background: 'white',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Panel Header */}
                <div style={{
                    padding: '16px 14px 12px',
                    borderBottom: '1px solid #F1F5F9',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Bot size={13} color="#0D7377" />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Choose Your Expert</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
                        5 AI specialists · Each with a unique analytical lens
                    </p>
                </div>

                {/* Agent Cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
                    {AGENTS.map(ag => {
                        const isActive = ag.id === activeAgent;
                        return (
                            <button key={ag.id} onClick={() => switchAgent(ag.id)} style={{
                                width: '100%', marginBottom: 6,
                                padding: '11px 12px',
                                borderRadius: 12,
                                border: `1px solid ${isActive ? ag.color + '50' : '#F1F5F9'}`,
                                background: isActive ? ag.bg : 'transparent',
                                cursor: 'pointer', textAlign: 'left',
                                display: 'flex', alignItems: 'flex-start', gap: 10,
                                transition: 'all 0.15s', fontFamily: 'inherit',
                                boxShadow: isActive ? `0 2px 8px ${ag.color}20` : 'none',
                            }}
                                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; } }}
                                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#F1F5F9'; } }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                    background: isActive ? `linear-gradient(135deg, ${ag.color}, ${ag.color}bb)` : '#F1F5F9',
                                    color: isActive ? 'white' : '#94A3B8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}>
                                    {ag.icon}
                                </div>

                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? ag.color : '#0F172A', marginBottom: 1 }}>
                                        {ag.name}
                                    </div>
                                    <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>
                                        {ag.hindiName}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#CBD5E1', fontWeight: 500, lineHeight: 1.3 }}>
                                        {ag.tagline}
                                    </div>
                                </div>

                                {isActive && <ChevronRight size={12} color={ag.color} style={{ marginTop: 2, flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </div>

                {/* Data Context Status */}
                <div style={{
                    padding: '10px 14px',
                    borderTop: '1px solid #F1F5F9',
                    background: '#FAFAFA',
                }}>
                    {results ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={11} color="#16A34A" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>GEE Data Context Loaded</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#D97706' }}>No pipeline data yet</span>
                        </div>
                    )}
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>
                        Powered by GROQ · LLAMA 3.3 70B
                    </div>
                </div>
            </div>

            {/* ── RIGHT: CHAT AREA ────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Agent Header Bar */}
                <div style={{
                    padding: '14px 20px',
                    background: 'white',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: agent.gradient,
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 4px 12px ${agent.color}30`,
                        }}>
                            {agent.icon}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{agent.name}</span>
                                <span style={{
                                    fontSize: 9, fontWeight: 700, color: agent.color,
                                    background: agent.bg, border: `1px solid ${agent.border}`,
                                    borderRadius: 5, padding: '1px 7px',
                                }}>{agent.hindiName}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{agent.tagline}</div>
                        </div>
                    </div>
                    <button onClick={() => { setMessages([]); setQuery(''); }} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'transparent', border: '1px solid #E2E8F0',
                        borderRadius: 8, padding: '6px 10px',
                        cursor: 'pointer', fontSize: 10, fontWeight: 600,
                        color: '#94A3B8', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD5E1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; }}
                    >
                        <RefreshCw size={10} /> Clear Chat
                    </button>
                </div>

                {/* Streaming Progress Bar */}
                {streaming && (
                    <div style={{
                        height: 2,
                        background: `linear-gradient(90deg, ${agent.color}, ${agent.color}80, ${agent.color})`,
                        backgroundSize: '200% 100%',
                        animation: 'chatStream 1.5s linear infinite',
                        flexShrink: 0,
                    }} />
                )}

                {/* Messages Area */}
                <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '20px 24px',
                    display: 'flex', flexDirection: 'column', gap: 16,
                }}>

                    {messages.length === 0 ? (
                        /* Empty State */
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '0 20px',
                        }}>
                            {/* Agent avatar */}
                            <div style={{
                                width: 64, height: 64, borderRadius: 18,
                                background: agent.gradient,
                                color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16,
                                boxShadow: `0 8px 24px ${agent.color}30`,
                            }}>
                                {React.cloneElement(agent.icon as React.ReactElement, { size: 28 })}
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                                    Namaste! I am the <span style={{ color: agent.color }}>{agent.name}</span>
                                </h3>
                                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, margin: 0, maxWidth: 400 }}>
                                    <em>{agent.hindiName}</em> — {agent.tagline}.{' '}
                                    {results
                                        ? 'Your satellite data is loaded. Ask me anything!'
                                        : 'Load pipeline data from "Scan My Farm" for context-aware answers.'}
                                </p>
                            </div>

                            {/* Quick Prompt Grid */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr',
                                gap: 10, width: '100%', maxWidth: 520,
                            }}>
                                {agent.quickPrompts.map((qp, i) => (
                                    <button key={i} onClick={() => sendMessage(qp.prompt)} style={{
                                        background: 'white',
                                        border: `1px solid ${agent.border}`,
                                        borderRadius: 12, padding: '12px 14px',
                                        cursor: 'pointer', textAlign: 'left',
                                        transition: 'all 0.15s', fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                    }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLButtonElement).style.background = agent.bg;
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = agent.color + '60';
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${agent.color}15`;
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLButtonElement).style.background = 'white';
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = agent.border;
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        <Sparkles size={11} color={agent.color} style={{ marginTop: 1, flexShrink: 0 }} />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', lineHeight: 1.4 }}>
                                            {qp.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Message Thread */
                        messages.map((msg, i) => {
                            const msgAgent = AGENTS.find(a => a.id === msg.agentId) ?? agent;
                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'flex-start',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '88%',
                                    animation: 'msgFadeIn 0.2s ease',
                                }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                            background: msgAgent.gradient,
                                            color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {msgAgent.icon}
                                        </div>
                                    )}

                                    <div>
                                        {/* Agent label on assistant messages */}
                                        {msg.role === 'assistant' && (
                                            <div style={{
                                                fontSize: 9.5, fontWeight: 700,
                                                color: msgAgent.color,
                                                marginBottom: 4, paddingLeft: 2,
                                            }}>
                                                {msgAgent.name} · {msgAgent.hindiName}
                                            </div>
                                        )}

                                        <div style={{
                                            padding: '12px 16px',
                                            background: msg.role === 'assistant' ? 'white' : agent.gradient,
                                            borderRadius: msg.role === 'assistant' ? '2px 14px 14px 14px' : '14px 2px 14px 14px',
                                            border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                                            fontSize: 12, lineHeight: 1.6,
                                            color: msg.role === 'assistant' ? '#1E293B' : 'white',
                                            boxShadow: msg.role === 'assistant'
                                                ? '0 1px 4px rgba(0,0,0,0.04)'
                                                : `0 3px 10px ${agent.color}30`,
                                        }}>
                                            {msg.role === 'assistant' ? (
                                                msg.content ? (
                                                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 11, padding: '2px 0' }}>
                                                        <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                                                        <span>Analyzing satellite data...</span>
                                                    </div>
                                                )
                                            ) : (
                                                <span style={{ fontWeight: 500 }}>{msg.content}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '14px 20px',
                    background: 'white',
                    borderTop: '1px solid #E2E8F0',
                    flexShrink: 0,
                }}>
                    {/* Quick prompts row when chat is active */}
                    {messages.length > 0 && (
                        <div style={{
                            display: 'flex', gap: 6, marginBottom: 10,
                            flexWrap: 'wrap',
                        }}>
                            {agent.quickPrompts.slice(0, 3).map((qp, i) => (
                                <button key={i} onClick={() => sendMessage(qp.prompt)} disabled={streaming} style={{
                                    background: agent.bg,
                                    border: `1px solid ${agent.border}`,
                                    borderRadius: 20, padding: '4px 10px',
                                    cursor: streaming ? 'not-allowed' : 'pointer',
                                    fontSize: 10, fontWeight: 600,
                                    color: agent.color,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                    opacity: streaming ? 0.5 : 1,
                                }}>
                                    {qp.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={`Ask the ${agent.name}...`}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !streaming && sendMessage()}
                            disabled={streaming}
                            style={{
                                flex: 1,
                                background: '#F8FAFC',
                                border: `1px solid #E2E8F0`,
                                borderRadius: 12,
                                padding: '11px 48px 11px 14px',
                                fontSize: 12, outline: 'none',
                                color: '#0F172A',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = agent.color;
                                e.target.style.boxShadow = `0 0 0 3px ${agent.color}15`;
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = '#E2E8F0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={streaming || !query.trim()}
                            style={{
                                position: 'absolute', right: 5, top: 5, bottom: 5, width: 36,
                                background: streaming || !query.trim() ? '#E2E8F0' : agent.gradient,
                                color: streaming || !query.trim() ? '#94A3B8' : 'white',
                                border: 'none', borderRadius: 8,
                                cursor: streaming || !query.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: streaming || !query.trim() ? 'none' : `0 2px 8px ${agent.color}30`,
                            }}
                        >
                            {streaming ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={13} />}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes chatStream { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
                @keyframes spin       { to { transform: rotate(360deg); } }
                @keyframes msgFadeIn  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
            `}</style>
        </div>
    );
}
