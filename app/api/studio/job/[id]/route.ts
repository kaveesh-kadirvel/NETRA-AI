import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobQueue';

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
    const job = getJob(id);

    if (!job) {
        return NextResponse.json({ status: 'error', error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
        status: job.status,
        result: job.result ?? null,
        error:  job.error  ?? null,
    });
}
