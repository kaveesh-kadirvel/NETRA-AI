import { getRiskConfig } from '@/lib/utils/riskClassifier';

interface Props { level: string; }

export default function RiskBadge({ level }: Props) {
    const cfg = getRiskConfig(level);

    const dotColor: Record<string, string> = {
        CRITICAL: '#EF4444',
        HIGH: '#F97316',
        MEDIUM: '#EAB308',
        LOW: '#22C55E',
        UNKNOWN: '#94A3B8',
    };

    return (
        <>
            <style jsx>{`
                @keyframes tactical-pulse {
                    0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { transform: scale(1.2); opacity: 0.7; box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.2); }
                    100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
            <span
                className="risk-badge"
                style={{
                    color: cfg.color,
                    borderColor: `${cfg.color}30`,
                    background: `${cfg.color}12`,
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: `1px solid ${cfg.color}35`,
                    boxShadow: `0 2px 10px ${cfg.color}10`,
                    backdropFilter: 'blur(4px)',
                    textTransform: 'uppercase'
                }}
            >
                <span
                    style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: dotColor[level] ?? '#94A3B8',
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${dotColor[level] ?? '#94A3B8'}`,
                        animation: level === 'CRITICAL' ? 'tactical-pulse 1.5s infinite ease-in-out' : 'none'
                    }}
                />
                {level}
            </span>
        </>
    );
}
