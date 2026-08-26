/**
 * OTP Cleanup Cron API
 * 
 * Deletes expired OTP requests from database.
 * Should be called periodically via Vercel Cron or external scheduler.
 */

import { NextRequest, NextResponse, connection } from 'next/server';
import { cleanupExpiredOtps } from '@/lib/otp';
import { logSystemError } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
    await connection();
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            return NextResponse.json(
                { error: 'CRON_SECRET is not configured' },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const deletedCount = await cleanupExpiredOtps();

        return NextResponse.json({
            success: true,
            deletedCount,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[Cron] OTP cleanup failed:', error);
        await logSystemError(error, '/api/cron/cleanup-otps', 'ERROR');
        return NextResponse.json(
            { success: false, error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}
