import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FarmPlot } from '@/lib/models/FarmPlot';
import { PlotHealthLog } from '@/lib/models/PlotHealthLog';

export async function GET() {
    try {
        await connectDB();
        
        await FarmPlot.deleteMany({});
        await PlotHealthLog.deleteMany({});
        
        // Let's create an array of 20 diverse farms across India.
        const farms = [
            { name: "Punjab Wheat Co.",   crop: "Wheat",      lat: 30.90, lon: 75.85, area: 45000, score: 92, h: 'EXCELLENT', def: 120, nit: 10 },
            { name: "Haryana Agro",       crop: "Wheat",      lat: 29.05, lon: 76.08, area: 38000, score: 88, h: 'EXCELLENT', def: 200, nit: 15 },
            { name: "UP Sugarcane Plot",  crop: "Sugarcane",  lat: 26.84, lon: 80.94, area: 60000, score: 75, h: 'GOOD', def: 1400, nit: 40 },
            { name: "Bihar Maize Hub",    crop: "Corn",       lat: 25.59, lon: 85.13, area: 15000, score: 45, h: 'FAIR', def: 2200, nit: 60 },
            { name: "Assam Tea Estate 1", crop: "Tea",        lat: 26.14, lon: 91.73, area: 120000, score: 12, h: 'POOR', def: 4200, nit: 210 },
            { name: "Bengal Paddy Field", crop: "Rice",       lat: 22.57, lon: 88.36, area: 25000, score: 65, h: 'GOOD', def: 800, nit: 35 },
            { name: "Gujarat Cotton",     crop: "Cotton",     lat: 23.02, lon: 72.57, area: 85000, score: 55, h: 'FAIR', def: 3100, nit: 90 },
            { name: "MP Soyabeans",       crop: "Soybean",    lat: 23.25, lon: 77.41, area: 55000, score: 18, h: 'POOR', def: 5400, nit: 130 },
            { name: "Maharashtra Onion",  crop: "Onion",      lat: 19.07, lon: 72.87, area: 12000, score: 80, h: 'GOOD', def: 300, nit: 25 },
            { name: "Nashik Grapes",      crop: "Grapes",     lat: 19.99, lon: 73.78, area: 20000, score: 95, h: 'EXCELLENT', def: 100, nit: 8 },
            { name: "Karnataka Coffee",   crop: "Coffee",     lat: 12.97, lon: 77.59, area: 40000, score: 48, h: 'FAIR', def: 2100, nit: 85 },
            { name: "Kerala Spices",      crop: "Cardamom",   lat: 10.85, lon: 76.27, area: 18000, score: 25, h: 'POOR', def: 3500, nit: 110 },
            { name: "TN Paddy South",     crop: "Rice",       lat: 13.08, lon: 80.27, area: 30000, score: 70, h: 'GOOD', def: 900, nit: 40 },
            { name: "AP Chillies",        crop: "Chilli",     lat: 16.50, lon: 80.64, area: 22000, score: 58, h: 'FAIR', def: 1800, nit: 65 },
            { name: "Odisha Rice Plains", crop: "Rice",       lat: 20.29, lon: 85.82, area: 34000, score: 22, h: 'POOR', def: 4100, nit: 120 },
            { name: "Rajasthan Mustard",  crop: "Mustard",    lat: 26.91, lon: 75.78, area: 65000, score: 85, h: 'EXCELLENT', def: 250, nit: 18 },
            { name: "Chhattisgarh Pulses",crop: "Lentils",    lat: 21.25, lon: 81.62, area: 28000, score: 35, h: 'POOR', def: 2800, nit: 95 },
            { name: "Jharkhand Maize",    crop: "Corn",       lat: 23.34, lon: 85.30, area: 19000, score: 72, h: 'GOOD', def: 1100, nit: 30 },
            { name: "Telangana Cotton",   crop: "Cotton",     lat: 17.38, lon: 78.48, area: 42000, score: 89, h: 'EXCELLENT', def: 180, nit: 12 },
            { name: "Uttarakhand Apple",  crop: "Apple",      lat: 30.31, lon: 78.03, area: 10000, score: 15, h: 'POOR', def: 1500, nit: 80 }
        ];

        // Helper to generate a polygon approx 0.01 deg wide (~1km)
        const getPoly = (lon: number, lat: number) => {
            const offset = 0.005;
            return {
                type: 'Polygon',
                coordinates: [[
                    [lon - offset, lat - offset],
                    [lon + offset, lat - offset],
                    [lon + offset, lat + offset],
                    [lon - offset, lat + offset],
                    [lon - offset, lat - offset] // Close the loop
                ]]
            };
        };

        for (const f of farms) {
            const farm = await FarmPlot.create({
                ownerId: "u123",
                farmName: f.name,
                cropType: f.crop,
                geometry: getPoly(f.lon, f.lat),
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
                    avgNDVI: Math.max(0.01, (f.score / 100) - (i * 0.05)),
                    avgNDMI: Math.max(0.01, (f.score / 100) - 0.1),
                    healthScore: Math.max(0, f.score - (i * 3)),
                    waterDeficitLiters: f.def + Math.random() * 200,
                    nitrogenReqKg: f.nit + Math.random() * 10,
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

        return NextResponse.json({ success: true, message: "Pan-India Farm data seeded successfully!" });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
