import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FarmPlot } from '@/lib/models/FarmPlot';
import { PlotHealthLog } from '@/lib/models/PlotHealthLog';
import { SatelliteScene } from '@/lib/models/SatelliteScene';
import { ProcessingLog } from '@/lib/models/ProcessingLog';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('x-pipeline-secret');
    if (authHeader !== process.env.PIPELINE_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const payload = await req.json();

        // Optional: you can save scene metadata similarly if sent
        const eventIds: string[] = [];

        if (payload.type === "AGRI_INFERENCE" && payload.results) {
            for (const result of payload.results) {
                // Upsert the FarmPlot
                const healthStatus = result.healthScore > 75 ? 'EXCELLENT' : 
                                      (result.healthScore > 50 ? 'GOOD' : 
                                      (result.healthScore > 25 ? 'FAIR' : 'POOR'));

                const farm = await FarmPlot.findOneAndUpdate(
                    { ownerId: result.ownerId, farmName: result.farmName },
                    { 
                        cropType: result.cropType,
                        geometry: { type: 'Point', coordinates: [result.lon, result.lat] },
                        areaSqm: result.areaSqm,
                        currentHealthStatus: healthStatus,
                        lastAssessedAt: new Date(),
                        $inc: { totalLogsCount: 1 }
                    },
                    { upsert: true, new: true, returnDocument: 'after' }
                );

                // Create the PlotHealthLog
                const healthLog = await PlotHealthLog.create({
                    farmId: farm._id,
                    date: new Date(payload.eventDate),
                    avgNDVI: result.avgNDVI,
                    avgNDMI: result.avgNDMI,
                    healthScore: result.healthScore,
                    waterDeficitLiters: result.waterDeficitLiters,
                    nitrogenReqKg: result.nitrogenReqKg,
                    subGridHeatmap: { type: 'PointHeatmap', coordinates: result.subGrid },
                    enrichment: {
                        evapotranspirationMm: result.weather?.et0 || 0,
                        rainfallMm7d: result.weather?.rain_7d || 0,
                        soilMoistureEst: result.weather?.soil_mst || 0,
                        landSurfaceTempAvg: 0
                    },
                    metadata: { s2Scene: result.s2Scene }
                });

                eventIds.push(healthLog._id.toString());
            }
        }

        if (payload.logs?.length > 0) {
            await ProcessingLog.insertMany(
                payload.logs.map((log: any) => ({ 
                    ...log, 
                    message: log.message || "Precision Agri telemetry updated",
                    stage: log.stage || "DATA_INGESTION",
                    runId: payload.runId 
                }))
            );
        }

        return NextResponse.json({ success: true, runId: payload.runId, eventsCreated: eventIds.length, eventIds });
    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
