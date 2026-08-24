import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FarmPlot } from '@/lib/models/FarmPlot';
import { PlotHealthLog } from '@/lib/models/PlotHealthLog';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Force evaluation of schema
        if (!FarmPlot) throw new Error("FarmPlot model failed to load");

        const [healthBreakdown, trendData, topFarms] = await Promise.all([
            PlotHealthLog.aggregate([
                { $sort: { date: -1 } },
                { $group: { _id: '$farmId', latest: { $first: '$$ROOT' } } },
                { $group: { 
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$latest.healthScore', 75] }, then: 'EXCELLENT' },
                                { case: { $gte: ['$latest.healthScore', 50] }, then: 'GOOD' },
                                { case: { $gte: ['$latest.healthScore', 25] }, then: 'FAIR' },
                            ],
                            default: 'POOR'
                        }
                    }, 
                    count: { $sum: 1 } 
                } },
            ]),
            PlotHealthLog.aggregate([
                { $match: { date: { $gte: new Date(Date.now() - 30 * 86400000) } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        avgHealthScore: { $avg: '$healthScore' },
                        totalWaterDeficit: { $sum: '$waterDeficitLiters' },
                        totalNitrogenReq: { $sum: '$nitrogenReqKg' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            PlotHealthLog.aggregate([
                { $sort: { date: -1 } },
                { $group: { _id: '$farmId', latest: { $first: '$$ROOT' } } },
                { $lookup: { from: 'farmplots', localField: '_id', foreignField: '_id', as: 'farm' } },
                { $unwind: '$farm' },
                { $sort: { 'latest.healthScore': 1 } },
                { $limit: 5 }
            ])
        ]);

        return NextResponse.json({
            healthBreakdown,
            trendData,
            topFarms: topFarms.map(f => ({
                farmName: f.farm.farmName,
                healthScore: f.latest.healthScore,
                ndvi: f.latest.avgNDVI
            })),
            totals: { total: 0, totalPop: 0 },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
