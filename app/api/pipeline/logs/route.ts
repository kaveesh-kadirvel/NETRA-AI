import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ProcessingLog } from '@/lib/models/ProcessingLog';

/**
 * GET /api/pipeline/logs
 *
 * Returns pipeline processing logs stored by the GEE runner.
 * Satisfies PS-06 REQ 6: "Provide detailed logs demonstrating data ingestion,
 * processing steps, and detection outputs."
 *
 * Query params:
 *   ?runId=<uuid>     — filter to a single run
 *   ?level=ERROR      — filter by log level (INFO, WARN, ERROR)
 *   ?limit=100        — max records (default 100)
 *   ?stage=INGEST     — filter by pipeline stage
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);

        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
        const runId = searchParams.get('runId');
        const level = searchParams.get('level');
        const stage = searchParams.get('stage');

        const filter: Record<string, unknown> = {};
        if (runId) filter.runId = runId;
        if (level) filter.level = level.toUpperCase();
        if (stage) filter.stage = stage.toUpperCase();

        const logs = await ProcessingLog
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        // Group by runId so caller can see runs at a glance
        const runsMap: Record<string, { runId: string; startedAt: Date | null; stages: string[]; errors: number; logs: any[] }> = {};
        for (const log of logs) {
            const rid = log.runId ?? 'unknown';
            if (!runsMap[rid]) {
                runsMap[rid] = { runId: rid, startedAt: null, stages: [], errors: 0, logs: [] };
            }
            runsMap[rid].logs.push(log);
            if (!runsMap[rid].stages.includes(log.stage)) runsMap[rid].stages.push(log.stage);
            if (log.level === 'ERROR') runsMap[rid].errors++;
            const ts = log.timestamp ? new Date(log.timestamp) : null;
            if (ts && (!runsMap[rid].startedAt || ts < runsMap[rid].startedAt!)) {
                runsMap[rid].startedAt = ts;
            }
        }

        const runs = Object.values(runsMap).sort(
            (a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0)
        );

        return NextResponse.json({
            success: true,
            totalLogs: logs.length,
            uniqueRuns: runs.length,
            runs,
            logs,
        });

    } catch (err) {
        console.error('Pipeline logs error:', err);
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}
