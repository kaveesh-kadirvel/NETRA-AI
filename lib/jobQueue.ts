/**
 * lib/jobQueue.ts
 * In-memory async job queue + 24h analysis cache for GEE pipeline results.
 * Eliminates synchronous blocking, prevents duplicate GEE calls, stops demo-killer 504s.
 */

type JobStatus = 'pending' | 'done' | 'error';

interface Job {
    status: JobStatus;
    result?: any;
    error?: string;
    createdAt: number;
}

// In-memory store (survives hot-reloads via module singleton)
const jobStore = new Map<string, Job>();

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

/** Create a new pending job, returns job_id */
export function createJob(jobId: string): void {
    jobStore.set(jobId, { status: 'pending', createdAt: Date.now() });
}

/** Mark a job as completed with result */
export function completeJob(jobId: string, result: any): void {
    const job = jobStore.get(jobId);
    if (job) jobStore.set(jobId, { ...job, status: 'done', result });
}

/** Mark a job as failed */
export function failJob(jobId: string, error: string): void {
    const job = jobStore.get(jobId);
    if (job) jobStore.set(jobId, { ...job, status: 'error', error });
}

/** Retrieve a job by ID */
export function getJob(jobId: string): Job | undefined {
    return jobStore.get(jobId);
}
