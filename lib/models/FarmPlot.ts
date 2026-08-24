import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmPlot extends Document {
    farmName: string;
    ownerId: string;
    cropType: string;
    geometry: any; // GeoJSON Polygon drawn by the user
    areaSqm: number;
    currentHealthStatus: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' | 'UNKNOWN';
    lastAssessedAt: Date;
    totalLogsCount: number;
}

const FarmPlotSchema = new Schema<IFarmPlot>(
    {
        farmName: { type: String, required: true },
        ownerId: { type: String, required: true },
        cropType: { type: String, required: true },
        geometry: { type: Schema.Types.Mixed, required: true },
        areaSqm: { type: Number, required: true },
        currentHealthStatus: {
            type: String,
            enum: ['POOR', 'FAIR', 'GOOD', 'EXCELLENT', 'UNKNOWN'],
            default: 'UNKNOWN',
        },
        lastAssessedAt: Date,
        totalLogsCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes
FarmPlotSchema.index({ ownerId: 1 });
FarmPlotSchema.index({ currentHealthStatus: 1 });

export const FarmPlot = mongoose.models.FarmPlot || mongoose.model<IFarmPlot>('FarmPlot', FarmPlotSchema);
