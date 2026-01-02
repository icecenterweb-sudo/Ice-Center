/**
 * Offer Sync Cron API
 * 
 * Syncs hasActiveOffer flags for offers that started or ended recently.
 * Should be called every 5 minutes via Vercel Cron or external scheduler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncOfferFlags } from '@/lib/offers';

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for Vercel Cron Jobs
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // In development, allow without secret
        if (process.env.NODE_ENV === 'production' && cronSecret) {
            if (authHeader !== `Bearer ${cronSecret}`) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        // Sync flags for offers that changed in the last 5 minutes
        const results = await syncOfferFlags(5);

        console.log(`[Cron] Offer sync complete: ${results.updated} updated, ${results.errors} errors`);

        return NextResponse.json({
            success: true,
            ...results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[Cron] Offer sync failed:', error);
        return NextResponse.json(
            { success: false, error: 'Sync failed' },
            { status: 500 }
        );
    }
}
