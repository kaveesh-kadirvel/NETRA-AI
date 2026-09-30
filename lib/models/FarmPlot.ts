import mongoose, { Schema, Document } from 'mongoose';

export type FarmHealthStatus = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' | 'UNKNOWN';

export interface IFarmPlot extends Document {
    farmName: string;
    ownerId: string;
    cropType: string;
    geometry: GeoJSON.Geometry | null;
    areaSqm: number;
    currentHealthStatus: FarmHealthStatus;
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

export const FarmPlot =
    (mongoose.models.FarmPlot as mongoose.Model<IFarmPlot> | undefined) ??
    mongoose.model<IFarmPlot>('FarmPlot', FarmPlotSchema);
