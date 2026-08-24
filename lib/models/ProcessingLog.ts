import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessingLog extends Document {
    runId: string;
    stage: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    durationMs: number;
    aoiName: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
}

const ProcessingLogSchema = new Schema<IProcessingLog>({
    runId: { type: String, required: true, index: true },
    stage: { type: String, required: true },
    level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], default: 'INFO' },
    message: { type: String, required: true },
    durationMs: Number,
    aoiName: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: -1 },
});

export const ProcessingLog =
    mongoose.models.ProcessingLog ||
    mongoose.model<IProcessingLog>('ProcessingLog', ProcessingLogSchema);
