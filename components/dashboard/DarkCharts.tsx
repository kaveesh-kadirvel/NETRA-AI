'use client';

import React from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    LineChart, Line
} from 'recharts';
import { Activity, Shield, Zap, Target, MapPin } from 'lucide-react';

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#F43F5E'];

// --- Image Processing (Bar Chart) ---
export function ImageProcessingChart({ data }: { data: any[] }) {
    return (
        <div className="dark-card">
            <ChartHeader icon={<Activity size={16} />} title="Daily Image Processing" desc="Processed vs. flagged images this week" />
            <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                        <Bar dataKey="processed" name="Processed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                        <Bar dataKey="flagged" name="Flagged" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <ChartLegend items={[{ label: 'Processed', color: '#10B981' }, { label: 'Flagged', color: '#EF4444' }]} />
        </div>
    );
}

// --- Incident Breakdown (Pie Chart) ---
export function IncidentBreakdownChart({ data }: { data: any[] }) {
    return (
        <div className="dark-card">
            <ChartHeader icon={<Zap size={16} />} title="Incident type breakdown" desc="All active incidents by category" />
            <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc' }}>{item.name} {item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Risk Radar (Radar Chart) ---
export function RiskRadarChart({ data }: { data: any[] }) {
    return (
        <div className="dark-card">
            <ChartHeader icon={<Shield size={16} />} title="Multi-Hazard Risk Radar" desc="Current global risk profile by hazard type" />
            <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                        <Radar name="Risk" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// --- ML Performance (Line Chart) ---
export function MLPerformanceChart({ data }: { data: any[] }) {
    return (
        <div className="dark-card">
            <ChartHeader icon={<Target size={16} />} title="ML Model Performance" desc="Weekly detection accuracy and confidence scores" />
            <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[80, 100]} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="confidence" name="Confidence %" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <ChartLegend items={[{ label: 'Accuracy %', color: '#F59E0B' }, { label: 'Confidence %', color: '#3B82F6' }]} />
        </div>
    );
}

// --- Top Risk Regions ---
export function TopRiskRegions({ regions }: { regions: any[] }) {
    return (
        <div className="dark-card">
            <ChartHeader icon={<MapPin size={16} />} title="Top Risk Regions" desc="Districts with highest severity scores" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                {regions.map((reg, i) => (
                    <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{reg.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: reg.color, background: `${reg.color}15`, padding: '2px 8px', borderRadius: 4 }}>{reg.status}</span>
                                <span style={{ fontSize: 11, fontWeight: 950, color: '#f1f5f9' }}>{reg.val}%</span>
                            </div>
                        </div>
                        <div style={{ height: 4, width: '100%', background: '#1e293b', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${reg.val}%`, background: reg.color, borderRadius: 2 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Helpers ---

function ChartHeader({ icon, title, desc }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ color: '#3B82F6' }}>{icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>{title}</h3>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{desc}</p>
        </div>
    );
}

function ChartLegend({ items }: { items: { label: string, color: string }[] }) {
    return (
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
}
