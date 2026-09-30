import mongoose, { Schema, Document } from 'mongoose';

export type DistrictRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export interface IDistrict extends Document {
    districtName: string;
    stateName: string;
    countryCode: string;
    geometry: GeoJSON.Geometry | null;
    areaKm2: number;
    population2020: number;
    gadmLevel2Id: string;
    currentRiskLevel: DistrictRiskLevel;
    lastAssessedAt: Date;
    totalEventsCount: number;
}

const DistrictSchema = new Schema<IDistrict>(
    {
        districtName: { type: String, required: true },
        stateName: { type: String, required: true },
        countryCode: { type: String, default: 'IND' },
        // Stored as Mixed — set to null until Python GEE pipeline provides real GeoJSON
        geometry: { type: Schema.Types.Mixed, default: null },
        areaKm2: Number,
        population2020: Number,
        gadmLevel2Id: String,
        currentRiskLevel: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN'],
            default: 'UNKNOWN',
        },
        lastAssessedAt: Date,
        totalEventsCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Non-geo indexes only (2dsphere removed — no valid geometries in weather-only mode)
DistrictSchema.index({ districtName: 1, stateName: 1 }, { unique: true });
DistrictSchema.index({ currentRiskLevel: 1 });

export const District =
    (mongoose.models.District as mongoose.Model<IDistrict> | undefined) ??
    mongoose.model<IDistrict>('District', DistrictSchema);
