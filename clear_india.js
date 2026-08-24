require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI not found");

        await mongoose.connect(uri, { dbName: 'cosmeon' });
        const db = mongoose.connection.db;

        const collections = ['riskevents', 'districts', 'satellitescenes', 'processinglogs'];
        for (const c of collections) {
            await db.collection(c).deleteMany({});
            console.log(`Wiped collection: ${c}`);
        }

        console.log("Database 'cosmeon' is now 100% clean for All-India ingestion.");
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
