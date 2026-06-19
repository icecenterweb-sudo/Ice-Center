/**
 * Abandoned Cart Notification Cron
 *
 * Finds users who have items in their cart but haven't ordered
 * in the last 2-24 hours. Sends a single reminder notification.
 * Should be called every hour via Vercel Cron.
 */

import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    await connection();

    try {
        // Verify cron secret in production
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (process.env.NODE_ENV === 'production') {
            if (!cronSecret) {
                return NextResponse.json(
                    { error: 'CRON_SECRET is not configured' },
                    { status: 500 }
                );
            }

            if (authHeader !== `Bearer ${cronSecret}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Find users who:
        // 1. Have cart items added between 2-24 hours ago
        // 2. Have not received an abandoned-cart notification in the last 24 hours
        const usersWithCarts = await prisma.user.findMany({
            where: {
                cartItems: {
                    some: {
                        updatedAt: {
                            gte: twentyFourHoursAgo,
                            lte: twoHoursAgo,
                        },
                    },
                },
                // No abandoned cart notification in the last 24 hours
                notifications: {
                    none: {
                        type: 'PROMO',
                        title: { contains: 'سبد خرید' },
                        createdAt: { gte: twentyFourHoursAgo },
                    },
                },
            },
            select: {
                id: true,
                firstName: true,
                cartItems: {
                    select: { quantity: true },
                },
            },
            take: 100, // Limit per run to avoid overloading
        });

        if (usersWithCarts.length === 0) {
            return NextResponse.json({
                success: true,
                notified: 0,
                message: 'No abandoned carts found',
            });
        }

        // Create notifications in bulk
        const notifications = usersWithCarts.map((user) => {
            const itemCount = user.cartItems.reduce((sum, c) => sum + c.quantity, 0);
            const name = user.firstName || 'کاربر';
            return {
                userId: user.id,
                type: 'PROMO' as const,
                title: `${name} عزیز، سبد خریدت منتظرته! 🛒`,
                message: `شما ${itemCount} کالا در سبد خرید دارید. قبل از اتمام موجودی، خریدتان را تکمیل کنید.`,
                link: '/checkout',
            };
        });

        await prisma.notification.createMany({ data: notifications });

        console.log(`[Cron] Abandoned cart notifications sent: ${usersWithCarts.length}`);

        return NextResponse.json({
            success: true,
            notified: usersWithCarts.length,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Abandoned cart cron failed:', error);
        return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
    }
}
