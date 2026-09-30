import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/cosmeon';

if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set; using local fallback database at mongodb://127.0.0.1:27017/cosmeon');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            dbName: 'cosmeon',
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
