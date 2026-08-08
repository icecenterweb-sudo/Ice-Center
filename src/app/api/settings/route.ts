import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export async function GET() {
    try {
        const settings = await getSiteSettings();
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error('Error in GET /api/settings:', error);
        return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
    }
}
