import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/admin-auth';
import { z } from 'zod';

const replySchema = z.object({
    text: z.string().min(1).max(2000),
});

/**
 * POST /api/admin/support/rooms/[id]/reply
 * Admin sends a reply to a support room.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireRole(request, 'SUPPORT');
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    try {
        const body = await request.json().catch(() => null);
        const validation = replySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const room = await prisma.supportRoom.findUnique({
            where: { id: roomId },
            select: { id: true, status: true, userId: true },
        });

        if (!room) return NextResponse.json({ error: 'گفتگو یافت نشد' }, { status: 404 });
        if (room.status === 'CLOSED') {
            return NextResponse.json({ error: 'این گفتگو بسته شده است' }, { status: 400 });
        }

        const message = await prisma.supportMessage.create({
            data: {
                roomId,
                sender: 'ADMIN',
                text: validation.data.text,
                adminId: auth.payload.adminId,
            },
            select: {
                id: true,
                sender: true,
                text: true,
                createdAt: true,
                admin: { select: { name: true } },
            },
        });

        await prisma.supportRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() },
        });

        // Send in-app notification if the user has an account
        if (room.userId) {
            const admin = await prisma.admin.findUnique({
                where: { id: auth.payload.adminId },
                select: { name: true },
            });
            await prisma.notification.create({
                data: {
                    userId: room.userId,
                    type: 'SYSTEM',
                    title: 'پاسخ پشتیبانی آیس سنتر',
                    message: `کارشناس ${admin?.name || 'پشتیبانی'} به پیام شما پاسخ داد.`,
                    link: null,
                },
            });
        }

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('[Admin Support] Failed to reply:', error);
        return NextResponse.json({ error: 'خطا در ارسال پاسخ' }, { status: 500 });
    }
}
