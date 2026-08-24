'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Map, Building2, Satellite,
    Sprout, ShieldAlert, BarChart2, AlignLeft,
    Cpu, MessageSquare, FileCheck, Activity,
    Radio,
} from 'lucide-react';

const NAV_GROUPS = [
    {
        label: 'MAIN',
        items: [
            { href: '/dashboard',  icon: LayoutDashboard, label: 'Home' },
            { href: '/map',        icon: Map,             label: 'India Farm Map' },
            { href: '/districts',  icon: Building2,       label: 'Districts' },
        ],
    },
    {
        label: 'SATELLITE',
        items: [
            { href: '/studio/spatial',     icon: Satellite,   label: 'Scan My Farm' },
            { href: '/studio/veg',         icon: Sprout,      label: 'Crop Health Map' },
            { href: '/studio/risk',        icon: ShieldAlert, label: 'Crop Risk' },
            { href: '/studio/confidence',  icon: BarChart2,   label: 'How Accurate?' },
        ],
    },
    {
        label: 'REPORTS',
        items: [
            { href: '/logs',        icon: AlignLeft,     label: 'Activity Log' },
            { href: '/studio/ai',   icon: MessageSquare, label: 'Ask Kisan Bot' },
            { href: '/studio/pdf',  icon: FileCheck,     label: 'Download Report' },
            { href: '/studio/api',  icon: Cpu,           label: 'API Access' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside style={{
            width: 218, minWidth: 218,
            background: 'white',
            borderRight: '1px solid #E2E8F0',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', flexShrink: 0,
        }}>

            {/* ── LOGO ───────────────────────────────── */}
            <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #0A1628, #0D7377)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Satellite size={17} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 14, color: '#0A1628', letterSpacing: '-0.02em' }}>
                            NETRA<span style={{ color: '#0D7377' }}>.AI</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 1 }}>
                            Kisan Saathi
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SATELLITE STATUS ───────────────────── */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 8, padding: '7px 10px',
                    display: 'flex', alignItems: 'center', gap: 7,
                }}>
                    <Radio size={11} color="#16A34A" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D', flex: 1 }}>
                        Satellite Connected
                    </span>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#22C55E',
                        boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
                    }} />
                </div>
            </div>

            {/* ── NAVIGATION ─────────────────────────── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                {NAV_GROUPS.map((group) => (
                    <div key={group.label} style={{ marginBottom: 18 }}>
                        <div style={{
                            fontSize: 9, fontWeight: 800, color: '#CBD5E1',
                            letterSpacing: '0.12em', padding: '0 10px 8px',
                        }}>
                            {group.label}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {group.items.map(({ href, icon: Icon, label }) => {
                                const isActive = pathname === href
                                    || (href !== '/dashboard' && pathname.startsWith(href));

                                return (
                                    <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '9px 12px', borderRadius: 10,
                                            background: isActive ? '#EFF6FF' : 'transparent',
                                            borderLeft: isActive ? '3px solid #0D7377' : '3px solid transparent',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                            onMouseEnter={e => {
                                                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC';
                                            }}
                                            onMouseLeave={e => {
                                                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                            }}
                                        >
                                            <Icon
                                                size={15}
                                                color={isActive ? '#0D7377' : '#94A3B8'}
                                                strokeWidth={isActive ? 2.5 : 1.8}
                                            />
                                            <span style={{
                                                fontSize: 13,
                                                fontWeight: isActive ? 700 : 500,
                                                color: isActive ? '#0D7377' : '#475569',
                                            }}>
                                                {label}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── FOOTER ─────────────────────────────── */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Activity size={10} color="#94A3B8" />
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Data Sources
                    </span>
                </div>
                <div style={{ fontSize: 10, color: '#CBD5E1', lineHeight: 1.9, paddingLeft: 2 }}>
                    Sentinel-1 + Sentinel-2<br />
                    Google Earth Engine<br />
                    Open-Meteo Weather
                </div>
            </div>
        </aside>
    );
}
