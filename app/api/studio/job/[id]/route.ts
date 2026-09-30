import { NextRequest, NextResponse } from 'next/server';
import { getStudioJobService } from '@/lib/studioJobService';

/**
 * GET /api/studio/job/[id]
 * Polls a background pipeline job for its status and result.
 * Returns: { status: 'pending' | 'done' | 'error', result?, error? }
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const service = getStudioJobService();
    if (!service) {
        return NextResponse.json(
            { status: 'error', error: 'Persistent Studio job service is not configured' },
            { status: 503 }
        );
    }

    try {
        const response = await fetch(service.url(`jobs/${encodeURIComponent(id)}`), {
            headers: { Authorization: `Bearer ${service.token}` },
            cache: 'no-store',
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            return NextResponse.json(
                { status: 'error', error: response.status === 404 ? 'Job not found' : 'Job status unavailable' },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }
        return NextResponse.json(result, { status: response.status });
    } catch (error) {
        console.error('[API /studio/job] Remote status request failed:', error);
        return NextResponse.json({ status: 'error', error: 'Persistent Studio job service is unavailable' }, { status: 502 });
    }
}
