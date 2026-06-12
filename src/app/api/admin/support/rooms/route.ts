import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/support/rooms
 * List all support rooms for admin, ordered by last activity.
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'OPEN' | 'CLOSED' | null;

        const rooms = await prisma.supportRoom.findMany({
            where: status ? { status } : undefined,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                phone: true,
                name: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { text: true, sender: true, createdAt: true },
                },
            },
        });

        return NextResponse.json({ rooms });
    } catch (error) {
        console.error('[Admin Support] Failed to list rooms:', error);
        return NextResponse.json({ error: 'خطا در دریافت لیست گفتگوها' }, { status: 500 });
    }
}
