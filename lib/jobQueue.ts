/**
 * lib/jobQueue.ts
 * Best-effort instance-local analysis cache for GEE results.
 * Production job state lives in the configured persistent Studio job service.
 */

// 24-hour Analysis Ready Data (ARD) cache — keyed by bbox+dates hash
const analysisCache = new Map<string, { result: any; cachedAt: number }>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Generate a stable cache key from pipeline config */
export function makeCacheKey(cfg: any): string {
    return [
        cfg.min_lon?.toFixed(3),
        cfg.min_lat?.toFixed(3),
        cfg.max_lon?.toFixed(3),
        cfg.max_lat?.toFixed(3),
        cfg.pre_start || cfg.pre_start_s,
        cfg.post_end  || cfg.post_end_s,
        cfg.threshold,
        cfg.ndvi_thresh,
    ].join('|');
}

/** Check if a valid cached result exists for this config */
export function getCachedResult(cfg: any): { result: any; fromCache: true } | null {
    const key = makeCacheKey(cfg);
    const entry = analysisCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        analysisCache.delete(key);
        return null;
    }
    return { result: { ...entry.result, fromCache: true, cachedAt: entry.cachedAt }, fromCache: true };
}

/** Store a successful result in the 24h ARD cache.
 * NEVER caches demo/seeded payloads — only real GEE results get cached. */
export function setCachedResult(cfg: any, result: any): void {
    // Do not cache seeded fallback data — it would pollute subsequent live runs
    if (result?.demo_mode === true) {
        console.warn('[Cache] Skipping cache for DEMO mode result — will retry live GEE next time.');
        return;
    }
    const key = makeCacheKey(cfg);
    analysisCache.set(key, { result, cachedAt: Date.now() });
}

/** Evict all stale or demo-mode entries from the cache. */
export function evictDemoResults(): number {
    let evicted = 0;
    for (const [key, entry] of analysisCache.entries()) {
        if (entry.result?.demo_mode === true || Date.now() - entry.cachedAt > CACHE_TTL_MS) {
            analysisCache.delete(key);
            evicted++;
        }
    }
    return evicted;
}

/** Wipe entire cache (used by clear-cache API route). */
export function clearAllCache(): void {
    analysisCache.clear();
}

