import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FarmPlot } from '@/lib/models/FarmPlot';
import { PlotHealthLog } from '@/lib/models/PlotHealthLog';
import { SatelliteScene } from '@/lib/models/SatelliteScene';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    await connectDB();

    // Prevent Turbopack tree-shaking from dropping populated models
    void FarmPlot;
    void SatelliteScene;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Group by farmId to get the single latest log per farm
    const latestLogs = await PlotHealthLog.aggregate([
        { $sort: { date: -1 } },
        { 
            $group: { 
                _id: '$farmId', 
                doc: { $first: '$$ROOT' } 
            } 
        },
        { $replaceRoot: { newRoot: '$doc' } },
        { $limit: limit }
    ]);

    // Populate the farm details correctly
    const events = await PlotHealthLog.populate(latestLogs, { 
        path: 'farmId', 
        select: 'farmName ownerId cropType areaSqm geometry' 
    });

    // Compute the breakdown based only on the latest logs (not all historical logs)
    const breakdown = {
        totalWaterDeficit: events.reduce((sum: number, e: any) => sum + (e.waterDeficitLiters || 0), 0),
        totalNitrogenReq: events.reduce((sum: number, e: any) => sum + (e.nitrogenReqKg || 0), 0),
        avgHealthScore: events.reduce((sum: number, e: any) => sum + (e.healthScore || 0), 0) / (events.length || 1),
    };

    return NextResponse.json({ 
        generatedAt: new Date().toISOString(), 
        totalEvents: events.length, 
        events, 
        breakdown 
    });
}
