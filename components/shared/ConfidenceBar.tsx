interface Props {
    score: number; // 0–1
    label?: string;
}

export default function ConfidenceBar({ score, label }: Props) {
    const pct = Math.round(score * 100);
    const color = pct >= 85 ? '#22C55E' : pct >= 70 ? '#EAB308' : '#EF4444';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
            <div className="confidence-bar-track" style={{ flex: 1 }}>
                <div
                    className="confidence-bar-fill"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
                />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', minWidth: 30 }}>
                {pct}%
            </span>
        </div>
    );
}
