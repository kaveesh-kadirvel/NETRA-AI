import mongoose, { Schema, Document } from 'mongoose';

export interface ISatelliteScene extends Document {
    source: 'S1' | 'S2' | 'L8' | 'L9';
    sceneDate: Date;
    ingestedAt: Date;
    aoiName: string;
    boundingBox: number[];
    cloudCoverPct: number | null;
    geeAssetId: string;
    status: 'ingested' | 'processed' | 'failed';
    processingDurationMs: number;
}

const SatelliteSceneSchema = new Schema<ISatelliteScene>(
    {
        source: { type: String, enum: ['S1', 'S2', 'L8', 'L9'], required: true },
        sceneDate: { type: Date, required: true, index: -1 },
        ingestedAt: { type: Date, default: Date.now },
        aoiName: { type: String, required: true },
        boundingBox: [Number],
        cloudCoverPct: Number,
        geeAssetId: { type: String, required: true },
        status: { type: String, enum: ['ingested', 'processed', 'failed'], default: 'ingested' },
        processingDurationMs: Number,
    },
    { timestamps: true }
);

export const SatelliteScene =
    mongoose.models.SatelliteScene ||
    mongoose.model<ISatelliteScene>('SatelliteScene', SatelliteSceneSchema);
