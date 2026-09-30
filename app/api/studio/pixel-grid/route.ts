import { NextRequest, NextResponse } from 'next/server';
import { getCachedResult, setCachedResult } from '@/lib/jobQueue';
import { getCosmeonApi } from '@/lib/cosmeonApi';

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

        const service = getCosmeonApi();
        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Private COSMEON API is not configured' },
                { status: 503 }
            );
        }

        const response = await fetch(service.url('pixel-grid'), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${service.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Private COSMEON API request failed' },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }

        // ── 3. Store non-demo results in cache ────────────────────────────
        if (result?.success) {
            setCachedResult(body, result);
            console.log('[PixelGrid] Result cached for 24h');
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('[API /studio/pixel-grid] Remote request failed:', err);
        return NextResponse.json({ success: false, error: 'Private COSMEON API is unavailable' }, { status: 502 });
    }
}
