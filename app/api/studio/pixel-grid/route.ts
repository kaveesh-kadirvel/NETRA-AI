import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { getCachedResult, setCachedResult } from '@/lib/jobQueue';

/**
 * POST /api/studio/pixel-grid
 * Fetches a real SAR + NDVI pixel grid from GEE for the given AOI.
 * Returns: { success: true, cells: [{lat,lon,sar_vv,ndvi,demo},...], fromCache? }
 *
 * ✅ 24h ARD Cache: repeated calls for same bbox+dates return instantly.
 *    This prevents GEE quota hits and keeps demo running smoothly.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ── 1. Check 24h cache first ──────────────────────────────────────
        const cached = getCachedResult(body);
        if (cached) {
            console.log('[PixelGrid] Cache HIT — returning ARD in 0ms');
            return NextResponse.json({ ...cached.result, fromCache: true });
        }
        console.log('[PixelGrid] Cache MISS — spawning GEE pipeline');

        // ── 2. Spawn Python GEE pipeline ──────────────────────────────────
        const scriptPath = path.join(process.cwd(), 'cosmeon', 'pixel_grid.py');

        const result = await new Promise<any>((resolve) => {
            const proc = spawn('python3', [scriptPath]);
            let stdout = '';
            let stderr = '';

            const timer = setTimeout(() => {
                proc.kill('SIGKILL');
                resolve({ success: false, error: 'Pixel grid timed out after 60s' });
            }, 60_000);

            proc.stdout.on('data', (d) => { stdout += d.toString(); });
            proc.stderr.on('data', (d) => { stderr += d.toString(); });

            proc.on('close', (code) => {
                clearTimeout(timer);
                try {
                    const jsonStart = stdout.indexOf('{');
                    resolve(JSON.parse(stdout.substring(jsonStart)));
                } catch {
                    resolve({ success: false, error: stderr || `Exit ${code}` });
                }
            });

            proc.stdin.write(JSON.stringify(body));
            proc.stdin.end();
        });

        // ── 3. Store non-demo results in cache ────────────────────────────
        if (result?.success) {
            setCachedResult(body, result);
            console.log('[PixelGrid] Result cached for 24h');
        }

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
