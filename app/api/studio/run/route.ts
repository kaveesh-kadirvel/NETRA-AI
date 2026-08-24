import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { randomUUID } from 'crypto';
import {
    getCachedResult,
    setCachedResult,
    createJob,
    completeJob,
    failJob,
    makeCacheKey,
    evictDemoResults,
} from '@/lib/jobQueue';

const TIMEOUT_MS = 120_000; // 2 min hard cap

/** Exponential backoff retry helper for transient Python errors */
async function spawnPythonWithRetry(scriptPath: string, body: any, maxRetries = 2): Promise<any> {
    let lastError = '';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await new Promise<{ ok: boolean; data?: any; error?: string }>((resolve) => {
            const pythonProcess = spawn('python3', [scriptPath]);
            let dataString = '';
            let errorString = '';
            let timedOut = false;

            const timer = setTimeout(() => {
                timedOut = true;
                pythonProcess.kill('SIGKILL');
                resolve({ ok: false, error: `Pipeline timed out after ${TIMEOUT_MS / 1000}s` });
            }, TIMEOUT_MS);

            pythonProcess.stdout.on('data', (d) => { dataString += d.toString(); });
            pythonProcess.stderr.on('data', (d) => { errorString += d.toString(); });

            pythonProcess.on('close', (code) => {
                clearTimeout(timer);
                if (timedOut) return;
                if (code !== 0) {
                    resolve({ ok: false, error: errorString || `Exit code ${code}` });
                    return;
                }
                try {
                    const jsonStart = dataString.indexOf('{');
                    const parsed = JSON.parse(dataString.substring(jsonStart));
                    resolve({ ok: true, data: parsed });
                } catch {
                    resolve({ ok: false, error: `JSON parse failed. Raw: ${dataString.slice(0, 200)}` });
                }
            });

            pythonProcess.stdin.write(JSON.stringify(body));
            pythonProcess.stdin.end();
        });

        if (result.ok) return result.data;
        lastError = result.error || 'Unknown error';

        if (attempt < maxRetries) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.warn(`[Pipeline] Attempt ${attempt + 1} failed — retrying in ${backoffMs}ms. Error: ${lastError}`);
            await new Promise(r => setTimeout(r, backoffMs));
        }
    }
    throw new Error(lastError);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ── Auto-scale resolution for large AOIs ───────────────────────
        const minLon = body.min_lon || 0;
        const minLat = body.min_lat || 0;
        const maxLon = body.max_lon || 0;
        const maxLat = body.max_lat || 0;
        const wKm = (maxLon - minLon) * 111 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
        const hKm = (maxLat - minLat) * 111;
        const areaKm2 = wKm * hKm;

        if (areaKm2 > 50000 && (body.scale || 150) < 300) {
            body.scale = areaKm2 > 100000 ? 1000 : 500;
        }

        // ── Auto-evict stale/demo cache entries ────────────────────────
        const evicted = evictDemoResults();
        if (evicted > 0) console.log(`[Cache] Evicted ${evicted} stale/demo entries.`);

        // ── Check 24h ARD cache (skip if ?bust=1) ─────────────────────
        const bust = req.nextUrl.searchParams.get('bust') === '1';
        const cached = bust ? null : getCachedResult(body);
        if (cached) {
            console.log(`[Cache HIT] Key: ${makeCacheKey(body)}`);
            return NextResponse.json({ ...cached.result, fromCache: true });
        }

        // ── Async job dispatch: return job_id immediately ──────────────
        const jobId = randomUUID();
        createJob(jobId);

        const scriptPath = path.join(process.cwd(), 'cosmeon', 'cli.py');

        // Fire and forget — does not block HTTP response
        (async () => {
            try {
                const result = await spawnPythonWithRetry(scriptPath, body);
                setCachedResult(body, result);
                completeJob(jobId, result);
            } catch (err: any) {
                console.error(`[Pipeline Job ${jobId}] Failed:`, err.message);
                failJob(jobId, err.message);
            }
        })();

        return NextResponse.json({ job_id: jobId, status: 'pending' }, { status: 202 });

    } catch (error) {
        console.error('[API /studio/run] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
