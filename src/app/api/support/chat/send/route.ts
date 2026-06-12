import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const sendSchema = z.object({
    roomId: z.number().int().positive(),
    phone: z.string(),
    text: z.string().min(1, 'پیام نمی‌تواند خالی باشد').max(2000),
});

/**
 * POST /api/support/chat/send
 * Send a user message to the support room.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = sendSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { roomId, phone, text } = validation.data;

        // Verify room ownership
        const room = await prisma.supportRoom.findFirst({
            where: { id: roomId, phone, status: 'OPEN' },
            select: { id: true },
        });

        if (!room) {
            return NextResponse.json({ error: 'گفتگو یافت نشد یا بسته شده است' }, { status: 404 });
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
