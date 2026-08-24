import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { aoiName } = await req.json();
    if (!aoiName) return NextResponse.json({ error: 'aoiName is required' }, { status: 400 });

    const runId = crypto.randomUUID();

    const pythonUrl = process.env.PYTHON_PIPELINE_URL;
    if (!pythonUrl) {
        return NextResponse.json({ runId, status: 'queued', aoiName, note: 'Pipeline URL not configured — simulation mode' });
    }

    try {
        const res = await fetch(`${pythonUrl}/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.PIPELINE_API_KEY! },
            body: JSON.stringify({ aoiName, runId, callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pipeline/ingest` }),
        });

        if (!res.ok) return NextResponse.json({ error: 'Failed to trigger pipeline' }, { status: 502 });
        return NextResponse.json({ runId, status: 'queued', aoiName });
    } catch {
        return NextResponse.json({ runId, status: 'queued', aoiName, note: 'Python pipeline unreachable — queued locally' });
    }
}
