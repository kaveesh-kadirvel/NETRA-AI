import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/telegram/location
 * 
 * Mode 3 Location Sync API.
 * The frontend polling this endpoint to catch newly dropped pins from the Telegram bot.
 * The webhook stores the data in `global.latestTelegramLocation`.
 */
export async function GET() {
    try {
        const globalAny = global as any;
        const location = globalAny.latestTelegramLocation;

        if (!location) {
            return NextResponse.json({ success: false, message: 'No location available yet' }, { status: 200 });
        }

        // Return the location data
        return NextResponse.json({
            success: true,
            data: location
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
