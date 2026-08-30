import { NextRequest, NextResponse, connection } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/settings';
import { requireRole } from '@/lib/admin-auth';
import { recordAudit } from '@/lib/audit';
import { SiteSettings } from '@/types/settings';

export async function GET(request: NextRequest) {
    await connection(); // Required for request.headers with cacheComponents
    const auth = await requireRole(request, 'SETTINGS');
    if (!auth.ok) return auth.response;

    try {
        const settings = await getSiteSettings();
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error('Error in GET /api/admin/settings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireRole(request, 'SETTINGS');
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
        }
        const settingsData: Partial<SiteSettings> = body.settings || body;
        const updated = await updateSiteSettings(settingsData);
        await recordAudit(auth.payload.adminId, 'SETTINGS_UPDATE', 'SiteSetting', 0, `ویرایش تنظیمات سایت`);
        return NextResponse.json({ success: true, settings: updated });
    } catch (error) {
        console.error('Error in POST /api/admin/settings:', error);
        return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
    }
}
