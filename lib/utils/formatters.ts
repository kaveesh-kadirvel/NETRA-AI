export function formatDate(date: string | Date, locale: string = 'en'): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale, {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

export function formatDateTime(date: string | Date, locale: string = 'en'): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(locale, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function formatArea(km2: number): string {
    if (km2 >= 1000) return `${(km2 / 1000).toFixed(1)}k km²`;
    return `${km2.toFixed(1)} km²`;
}

export function formatPopulation(pop: number): string {
    if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(2)}M`;
    if (pop >= 1_000) return `${(pop / 1_000).toFixed(1)}K`;
    return String(pop);
}

export function formatScore(score: number): string {
    return (score || 0).toFixed(1);
}
