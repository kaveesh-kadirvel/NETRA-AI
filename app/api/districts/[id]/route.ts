import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { District } from '@/lib/models/District';
import { RiskEvent } from '@/lib/models/RiskEvent';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const district = await District.findById(id).lean();
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await RiskEvent
        .find({ districtId: id, eventDate: { $gte: since } })
        .populate('sceneId', 'source sceneDate')
        .sort({ eventDate: -1 })
        .lean();

    return NextResponse.json({ district, history, daysRequested: days });
}
