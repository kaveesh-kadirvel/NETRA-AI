'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { Leaf, Droplets, FlaskConical, Map, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ════════════════════════════════════════
   BIG ACTION CARD FOR FARMERS
════════════════════════════════════════ */
function BigActionCard({ emoji, title, desc, bg, color, href }: { emoji: string, title: string, desc: string, bg: string, color: string, href: string }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div style={{
                background: bg, border: `1px solid ${color}30`,
                borderRadius: 24, padding: '24px',
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                height: '100%', boxSizing: 'border-box'
            }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 12px 24px ${color}20`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                }}
            >
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, marginBottom: 16, boxShadow: `0 4px 12px ${color}20`
                }}>
                    {emoji}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color, fontWeight: 800, fontSize: 14 }}>
                    Dekhein <ArrowRight size={16} />
                </div>
            </div>
        </Link>
    );
}

export default function FarmerDashboard() {
    const { data: latestData } = useSWR('/api/insights/latest?limit=20', fetcher, { refreshInterval: 60000 });
    const events: any[] = latestData?.events ?? [];
    
    // Very simplified health logic
    const critCount = events.filter(e => e.healthScore < 40).length;
    const okCount = events.filter(e => e.healthScore >= 40).length;
    
    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Suprabhat 🌅' : greetingHour < 17 ? 'Namaste 🌞' : 'Shubh Sandhya 🌙';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            
            {/* ── GREETING & STATUS SUMMARY ────────────────────────── */}
            <div style={{
                background: critCount > 0 
                    ? 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)' 
                    : 'linear-gradient(135deg, #064E3B 0%, #10B981 100%)',
                borderRadius: 24, padding: '32px',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: `0 12px 32px ${critCount > 0 ? 'rgba(220, 38, 38, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
                            {greeting}, Kisan Ji
                        </div>
                        <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                            {critCount > 0 
                                ? "Khet ko aapki zaroorat hai! ⚠️" 
                                : "Aapka khet surakshit hai! 🌿"}
                        </h1>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500, maxWidth: 400, lineHeight: 1.5 }}>
                            {critCount > 0 
                                ? `${critCount} fasalon mein paani ya khad ki kami dikhi hai. Aaj hi dhyan dein.` 
                                : `Satellite ke anusaar aapki ${okCount} fasalein swasth hain aur acchi badh rahi hain.`}
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {critCount > 0 ? <AlertTriangle size={48} color="white" /> : <ShieldCheck size={48} color="white" />}
                    </div>
                </div>
            </div>

            {/* ── BIG ACTION CARDS ───────────────────────────────── */}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 12, marginBottom: -8 }}>Kya karna chahte hain?</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <BigActionCard 
                    emoji="🗺️" 
                    title="Naya Khet Jodein" 
                    desc="Apne naye khet ka naksha banayein taaki hum satellite se uspe nazar rakh sakein." 
                    bg="#F0FDFA" color="#0D7377" 
                    href="/map" 
                />
                
                <BigActionCard 
                    emoji="🤖" 
                    title="AI se Salah Lein" 
                    desc="Kya fasal sukh rahi hai? Ya kide lag gaye? Humare AskKisan AI se abhi madad maangein." 
                    bg="#F0FDF4" color="#16A34A" 
                    href="/studio/ai" 
                />

                <BigActionCard 
                    emoji="💧" 
                    title="Sinchai & Khad" 
                    desc="Janiye ki aaj kis khet mein kitna paani aur urea daalna chahiye." 
                    bg="#EFF6FF" color="#2563EB" 
                    href="/studio/risk" 
                />
            </div>

            {/* ── SIMPLE FARM LIST ────────────────────────────── */}
            {events.length > 0 && (
                <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: 24, marginTop: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Aapke Khet ki Report</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {events.map((e, i) => (
                            <div key={i} style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: 16, borderRadius: 16, 
                                background: e.healthScore < 40 ? '#FEF2F2' : '#F8FAFC',
                                border: `1px solid ${e.healthScore < 40 ? '#FECACA' : '#E2E8F0'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ fontSize: 24 }}>{e.healthScore < 40 ? '🔴' : '🟢'}</div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{e.farmId?.farmName || "Khet"}</div>
                                        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginTop: 2 }}>{e.farmId?.cropType || "Fasal"}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 20 }}>
                                    {e.waterDeficitLiters > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Droplets size={16} color="#2563EB" />
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>Paani De</span>
                                        </div>
                                    )}
                                    {e.nitrogenReqKg > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <FlaskConical size={16} color="#9333EA" />
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#9333EA', marginTop: 4 }}>Khad De</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
