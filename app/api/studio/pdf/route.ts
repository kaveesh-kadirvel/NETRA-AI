import { NextRequest, NextResponse } from 'next/server';
import { getCosmeonApi } from '@/lib/cosmeonApi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const service = getCosmeonApi();
        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Private COSMEON API is not configured' },
                { status: 503 }
            );
        }

        const response = await fetch(service.url('pdf'), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${service.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'PDF generation failed in the private COSMEON API' },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }

        return new NextResponse(await response.arrayBuffer(), {
            headers: {
                'Content-Type': response.headers.get('content-type') ?? 'application/pdf',
                'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment; filename="Cosmeon_Report.pdf"',
            },
        });
    } catch (error) {
        console.error('[API /studio/pdf] Remote request failed:', error);
        return NextResponse.json({ success: false, error: 'Private COSMEON API is unavailable' }, { status: 502 });
    }
}
