import mongoose, { Schema, Document } from 'mongoose';

export interface IPlotHealthLog extends Document {
    farmId: mongoose.Types.ObjectId;
    sceneId?: mongoose.Types.ObjectId;
    date: Date;
    avgNDVI: number;
    avgNDMI: number;
    healthScore: number; // 0-100 indicating overall vitality
    waterDeficitLiters: number;
    nitrogenReqKg: number;
    subGridHeatmap: {
        type: 'PointHeatmap';
        // Simulating the square-meter CV points. 
        // e.g., [{"lat": 24.1, "lng": 89.2, "ndvi": 0.82, "ndmi": 0.4}]
        coordinates: any[]; 
    };
    enrichment: {
        evapotranspirationMm: number;
        rainfallMm7d: number;
        soilMoistureEst: number;
        landSurfaceTempAvg: number;
    };
    metadata: Record<string, unknown>;
}

const PlotHealthLogSchema = new Schema<IPlotHealthLog>(
    {
        farmId: { type: Schema.Types.ObjectId, ref: 'FarmPlot', required: true, index: true },
        sceneId: { type: Schema.Types.ObjectId, ref: 'SatelliteScene' },
        date: { type: Date, required: true, index: -1 },
        avgNDVI: { type: Number, min: -1, max: 1, required: true },
        avgNDMI: { type: Number, min: -1, max: 1, required: true },
        healthScore: { type: Number, min: 0, max: 100, required: true },
        waterDeficitLiters: { type: Number, default: 0 },
        nitrogenReqKg: { type: Number, default: 0 },
        subGridHeatmap: { type: Schema.Types.Mixed, default: null },
        enrichment: {
            evapotranspirationMm: Number,
            rainfallMm7d: Number,
            soilMoistureEst: Number,
            landSurfaceTempAvg: Number,
        },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

PlotHealthLogSchema.index({ farmId: 1, date: -1 });

export const PlotHealthLog = mongoose.models.PlotHealthLog || mongoose.model<IPlotHealthLog>('PlotHealthLog', PlotHealthLogSchema);
