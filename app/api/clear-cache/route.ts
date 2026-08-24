import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    revalidatePath('/api/insights/summary');
    revalidatePath('/api/insights/latest');
    revalidatePath('/map');
    revalidatePath('/');
    return NextResponse.json({ success: true, message: 'Cache cleared' });
}
