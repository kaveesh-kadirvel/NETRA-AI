export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; score: [number, number] }> = {
    CRITICAL: { label: 'CRITICAL', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', score: [76, 100] },
    HIGH: { label: 'HIGH', color: '#F97316', bg: 'bg-orange-50', border: 'border-orange-200', score: [51, 75] },
    MEDIUM: { label: 'MEDIUM', color: '#EAB308', bg: 'bg-yellow-50', border: 'border-yellow-200', score: [26, 50] },
    LOW: { label: 'LOW', color: '#22C55E', bg: 'bg-green-50', border: 'border-green-200', score: [0, 25] },
    UNKNOWN: { label: 'UNKNOWN', color: '#94A3B8', bg: 'bg-slate-50', border: 'border-slate-200', score: [0, 0] },
};

export function classifyRisk(score: number): RiskLevel {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MEDIUM';
    return 'LOW';
}

export function getRiskConfig(level: string) {
    return RISK_CONFIG[(level as RiskLevel)] ?? RISK_CONFIG.UNKNOWN;
}
