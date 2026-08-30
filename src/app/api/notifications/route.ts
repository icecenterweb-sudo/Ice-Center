import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireUser } from '@/lib/user-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/notifications - List user's notifications
 * Query params:
 *   - limit: number (default 20)
 *   - unreadOnly: boolean (default false)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        // Build where clause
        const where: Prisma.NotificationWhereInput = { userId: payload.userId };
        if (unreadOnly) {
            where.readAt = null;
        }

        // Get notifications
        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.notification.count({
                where: { userId: payload.userId, readAt: null },
            }),
        ]);

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'خطا در دریافت اعلان‌ها' }, { status: 500 });
    }
}

/**
 * POST /api/notifications/mark-all-read
 * Mark all user's notifications as read
 */
export async function POST() {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        // Rate limit per user
        const rateLimit = await checkRateLimit(`notifications-read:${payload.userId}`, RATE_LIMITS.normal);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'درخواست‌های بیش از حد. کمی بعد تلاش کنید' }, { status: 429 });
        }

        // Mark all unread notifications as read
        const result = await prisma.notification.updateMany({
            where: {
                userId: payload.userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            markedCount: result.count,
            message: 'همه اعلان‌ها خوانده شد',
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 });
    }
}
