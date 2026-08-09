import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/support/rooms/[id]/messages
 * Get all messages for a room (admin view).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connection(); // Required for request.headers with cacheComponents
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    try {
        const room = await prisma.supportRoom.findUnique({
            where: { id: roomId },
            select: {
                id: true,
                phone: true,
                name: true,
                status: true,
                createdAt: true,
                userId: true,
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        if (!room) return NextResponse.json({ error: 'گفتگو یافت نشد' }, { status: 404 });

        const messages = await prisma.supportMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                sender: true,
                text: true,
                createdAt: true,
                admin: { select: { name: true, phone: true } },
            },
        });

        return NextResponse.json({ room, messages });
    } catch (error) {
        console.error('[Admin Support] Failed to fetch room messages:', error);
        return NextResponse.json({ error: 'خطا در دریافت پیام‌ها' }, { status: 500 });
    }
}
