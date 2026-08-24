import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FarmPlot } from '@/lib/models/FarmPlot';
import { PlotHealthLog } from '@/lib/models/PlotHealthLog';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { geoJson, name, cropType } = await req.json();

        if (!geoJson) {
            return NextResponse.json({ success: false, error: 'GeoJSON is required' }, { status: 400 });
        }

        // Create new farm plot
        const newFarm = await FarmPlot.create({
            farmName: name || 'New Onboarded Farm',
            ownerId: req.headers.get('x-owner-id') || 'f_onboarded_001',
            cropType: cropType || 'Mixed',
            areaSqm: 10000, 
            geometry: geoJson,
            currentHealthStatus: 'UNKNOWN'
        });

        // Initialize a health log for it so the map renders it properly
        await PlotHealthLog.create({
            farmId: newFarm._id,
            date: new Date(),
            avgNDVI: 0.50,
            avgNDMI: 0.35,
            healthScore: 50,
            waterDeficitLiters: 100,
            nitrogenReqKg: 10,
            metadata: { source: 'onboarding', notes: 'Newly onboarded via Map' }
        });

        return NextResponse.json({ success: true, farm: newFarm });

    } catch (err: any) {
        console.error("Error creating farm:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
