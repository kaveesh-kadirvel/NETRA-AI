import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { District } from '@/lib/models/District';

export async function GET() {
    await connectDB();
    const districts = await District.find({}).sort({ currentRiskLevel: -1 }).lean();
    return NextResponse.json({ districts, total: districts.length });
}
