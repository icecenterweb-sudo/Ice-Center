import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const sendSchema = z.object({
    roomId: z.number().int().positive(),
    phone: z.string(),
    text: z.string().min(1, 'پیام نمی‌تواند خالی باشد').max(2000),
});

/**
 * POST /api/support/chat/send
 * Send a user message to the support room.
 * Verifies ownership: authenticated users are checked via token + phone match;
 * guest rooms (no userId) fall back to phone-based verification.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = sendSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { roomId, phone, text } = validation.data;

        // Fetch room with userId to determine verification method
        const room = await prisma.supportRoom.findFirst({
            where: { id: roomId, phone, status: 'OPEN' },
            select: { id: true, userId: true, phone: true },
        });

        if (!room) {
            return NextResponse.json({ error: 'گفتگو یافت نشد یا بسته شده است' }, { status: 404 });
        }

        // If the room belongs to a registered user, verify the token
        if (room.userId) {
            const cookieStore = await cookies();
            const token = cookieStore.get('user_token')?.value;

            if (!token) {
                return NextResponse.json({ error: 'احراز هویت الزامی است' }, { status: 401 });
            }

            const payload = await verifyUserToken(token).catch(() => null);
            if (!payload || payload.userId !== room.userId) {
                return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
            }
        }

        const message = await prisma.supportMessage.create({
            data: {
                roomId,
                sender: 'USER',
                text,
            },
            select: {
                id: true,
                sender: true,
                text: true,
                createdAt: true,
            },
        });

        // Update room updatedAt
        await prisma.supportRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('[Support] Failed to send message:', error);
        return NextResponse.json({ error: 'خطا در ارسال پیام' }, { status: 500 });
    }
}
