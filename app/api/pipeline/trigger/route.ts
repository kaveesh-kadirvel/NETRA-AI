import { NextRequest, NextResponse } from 'next/server';
import { getAppBaseUrl } from '@/lib/appBaseUrl';

export async function POST(req: NextRequest) {
    const { aoiName, aoiBbox } = await req.json();
    if (!aoiName) return NextResponse.json({ error: 'aoiName is required' }, { status: 400 });

    const runId = crypto.randomUUID();
    const pythonUrl = process.env.PYTHON_PIPELINE_URL;
    const apiKey = process.env.PIPELINE_API_KEY;
    const callbackSecret = process.env.PIPELINE_SECRET;
    const appUrl = getAppBaseUrl();

    if (!pythonUrl || !apiKey || !callbackSecret || !appUrl) {
        return NextResponse.json(
            { error: 'Pipeline service configuration is incomplete' },
            { status: 503 }
        );
    }

    try {
        const triggerUrl = new URL('trigger', pythonUrl.endsWith('/') ? pythonUrl : `${pythonUrl}/`);
        const callbackUrl = new URL('/api/pipeline/ingest', appUrl).toString();
        const res = await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ aoiName, aoiBbox, runId, callbackUrl }),
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Pipeline service rejected or failed the run' }, { status: 502 });
        }
        const result = await res.json();
        return NextResponse.json({ runId, status: 'completed', aoiName, result });
    } catch (error) {
        console.error('Pipeline service request failed:', error);
        return NextResponse.json({ error: 'Pipeline service is unavailable' }, { status: 502 });
    }
}
