import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskEvent extends Document {
    districtId: mongoose.Types.ObjectId;
    sceneId: mongoose.Types.ObjectId;
    eventDate: Date;
    detectedAt: Date;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    floodAreaKm2: number;
    floodPctDistrict: number;
    affectedPopEst: number;
    confidenceScore: number;
    detectionMethod: 'NDWI' | 'SAR' | 'UNET' | 'ENSEMBLE' | 'WEATHER_ESTIMATE';
    changeFromPrevKm2: number;
    floodGeometry: {
        type: 'MultiPolygon';
        coordinates: number[][][][];
    };
    enrichment: {
        rainfallMm7d: number;
        rainfallSource: string;
        elevationVulnIndex: number;
        popDensityKm2: number;
        landCoverUrbanPct: number;
        landCoverAgriPct: number;
        jrcPermanentWaterPct: number;
    };
    status: 'active' | 'resolved' | 'monitoring';
    metadata: Record<string, unknown>;
}

const RiskEventSchema = new Schema<IRiskEvent>(
    {
        districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true, index: true },
        sceneId: { type: Schema.Types.ObjectId, ref: 'SatelliteScene', required: true },
        eventDate: { type: Date, required: true, index: -1 },
        detectedAt: { type: Date, default: Date.now },
        riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true, index: true },
        riskScore: { type: Number, min: 0, max: 100, required: true },
        floodAreaKm2: { type: Number, default: 0 },
        floodPctDistrict: { type: Number, default: 0 },
        affectedPopEst: { type: Number, default: 0 },
        confidenceScore: { type: Number, min: 0, max: 1 },
        detectionMethod: { type: String, enum: ['NDWI', 'SAR', 'UNET', 'ENSEMBLE', 'WEATHER_ESTIMATE'] },
        changeFromPrevKm2: { type: Number, default: 0 },
        floodGeometry: { type: Schema.Types.Mixed, default: null },
        enrichment: {
            rainfallMm7d: Number,
            rainfallSource: String,
            elevationVulnIndex: Number,
            popDensityKm2: Number,
            landCoverUrbanPct: Number,
            landCoverAgriPct: Number,
            jrcPermanentWaterPct: Number,
        },
        status: { type: String, enum: ['active', 'resolved', 'monitoring'], default: 'active' },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

RiskEventSchema.index({ districtId: 1, eventDate: -1 });
RiskEventSchema.index({ riskLevel: 1, eventDate: -1 });

export const RiskEvent = mongoose.models.RiskEvent || mongoose.model<IRiskEvent>('RiskEvent', RiskEventSchema);
