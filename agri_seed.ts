import 'dotenv/config';
import { connectDB } from './lib/mongodb';
import { FarmPlot } from './lib/models/FarmPlot';
import { PlotHealthLog } from './lib/models/PlotHealthLog';
import { Types } from 'mongoose';

async function seed() {
    await connectDB();
    console.log("Connected to MongoDB");

    await FarmPlot.deleteMany({});
    await PlotHealthLog.deleteMany({});
    
    console.log("Cleared old farms");

    const farms = [
        { name: "Green Acres",     crop: "Wheat", lat: 26.14, lon: 91.74, area: 5000, score: 85, h: 'EXCELLENT', def: 120, nit: 14 },
        { name: "Sunrise Valley",  crop: "Rice",  lat: 26.02, lon: 89.98, area: 12000, score: 45, h: 'FAIR', def: 1400, nit: 85 },
        { name: "Blue Ridge Plot", crop: "Corn",  lat: 26.32, lon: 91.00, area: 8000, score: 18, h: 'POOR', def: 2300, nit: 154 }
    ];

    for (const f of farms) {
        const farm = await FarmPlot.create({
            ownerId: "u123",
            farmName: f.name,
            cropType: f.crop,
            geometry: { type: 'Point', coordinates: [f.lon, f.lat] },
            areaSqm: f.area,
            currentHealthStatus: f.h,
            lastAssessedAt: new Date(),
            totalLogsCount: 1
        });

        // Add 5 days of history for trend lines
        for(let i = 4; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            await PlotHealthLog.create({
                farmId: farm._id,
                date: date,
                avgNDVI: Math.max(0.1, (f.score / 100) - (i * 0.05)),
                avgNDMI: Math.max(0.1, (f.score / 100) - 0.1),
                healthScore: Math.max(0, f.score - (i * 5)),
                waterDeficitLiters: f.def + Math.random() * 500,
                nitrogenReqKg: f.nit + Math.random() * 20,
                subGridHeatmap: null,
                enrichment: {
                    evapotranspirationMm: Math.random() * 10,
                    rainfallMm7d: Math.random() * 5,
                    soilMoistureEst: 0.3,
                    landSurfaceTempAvg: 28
                }
            });
        }
    }

    console.log("✅ Seeded new Precision Farming data!");
    process.exit(0);
}

seed();
