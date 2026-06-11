import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';

type Props = {
    params: Promise<{ id: string }>;
};

/**
 * PATCH /api/notifications/[id] - Mark single notification as read
 */
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const notificationId = parseInt(id);

        if (isNaN(notificationId)) {
            return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        // Find and update notification (ensure user owns it)
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: payload.userId,
            },
        });

        if (!notification) {
            return NextResponse.json({ error: 'اعلان یافت نشد' }, { status: 404 });
        }

        // Mark as read if not already
        if (!notification.readAt) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { readAt: new Date() },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 });
    }
}

/**
 * DELETE /api/notifications/[id] - Delete a notification
 */
export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const notificationId = parseInt(id);

        if (isNaN(notificationId)) {
            return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        // Delete notification (ensure user owns it)
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: payload.userId,
            },
        });

        if (!notification) {
            return NextResponse.json({ error: 'اعلان یافت نشد' }, { status: 404 });
        }

        await prisma.notification.delete({
            where: { id: notificationId },
        });

        return NextResponse.json({ success: true, message: 'اعلان حذف شد' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'خطا در حذف اعلان' }, { status: 500 });
    }
}
