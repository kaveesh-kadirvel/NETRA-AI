interface Props { source: string; }

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    S1: { label: 'Sentinel-1 SAR', color: '#0D7377', bg: '#E0F4F4' },
    S2: { label: 'Sentinel-2 Optical', color: '#0369A1', bg: '#E0F2FE' },
    L8: { label: 'Landsat-8', color: '#7C3AED', bg: '#EDE9FE' },
    L9: { label: 'Landsat-9', color: '#6D28D9', bg: '#EDE9FE' },
    ENSEMBLE: { label: 'Ensemble Fusion', color: '#0A1628', bg: '#E2E8F0' },
    CHIRPS: { label: 'CHIRPS Rainfall', color: '#0891B2', bg: '#CFFAFE' },
};

export default function DataSourceTag({ source }: Props) {
    const cfg = SOURCE_LABELS[source] ?? { label: source, color: '#64748B', bg: '#F1F5F9' };
    return (
        <span
            style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: cfg.color,
                background: cfg.bg,
                border: `1px solid ${cfg.color}30`,
            }}
        >
            {cfg.label}
        </span>
    );
}
