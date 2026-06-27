import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const querySchema = z.object({
    roomId: z.coerce.number().int().positive(),
    phone: z.string(),
});

/**
 * GET /api/support/chat/messages?roomId=X&phone=Y
 * Fetch messages for a support room.
 * Verifies ownership: authenticated users are checked via token + phone match;
 * guest rooms (no userId) fall back to phone-based verification.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
        roomId: searchParams.get('roomId'),
        phone: searchParams.get('phone'),
    });

    if (!validation.success) {
        return NextResponse.json({ error: 'پارامترهای نامعتبر' }, { status: 400 });
    }

    const { roomId, phone } = validation.data;

    try {
        // Verify the room belongs to this phone
        const room = await prisma.supportRoom.findFirst({
            where: { id: roomId, phone },
            select: { id: true, status: true, name: true, userId: true, phone: true },
        });

        if (!room) {
            return NextResponse.json({ error: 'گفتگو یافت نشد' }, { status: 404 });
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

        const messages = await prisma.supportMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                sender: true,
                text: true,
                createdAt: true,
                admin: { select: { name: true } },
            },
        });

        return NextResponse.json({ messages, roomStatus: room.status });
    } catch (error) {
        console.error('[Support] Failed to fetch messages:', error);
        return NextResponse.json({ error: 'خطا در دریافت پیام‌ها' }, { status: 500 });
    }
}
