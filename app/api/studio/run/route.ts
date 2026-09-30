import { NextRequest, NextResponse } from 'next/server';
import { getStudioJobService } from '@/lib/studioJobService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const service = getStudioJobService();
        if (!service) {
            return NextResponse.json(
                { error: 'Persistent Studio job service is not configured' },
                { status: 503 }
            );
        }

        const response = await fetch(service.url('jobs'), {
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
                { error: 'Persistent Studio job service rejected the request' },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }
        return NextResponse.json(result, { status: response.status });
    } catch (error) {
        console.error('[API /studio/run] Remote job dispatch failed:', error);
        return NextResponse.json({ error: 'Persistent Studio job service is unavailable' }, { status: 502 });
    }
}
