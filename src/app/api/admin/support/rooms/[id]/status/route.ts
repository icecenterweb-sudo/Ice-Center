import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/admin-auth';

/**
 * PATCH /api/admin/support/rooms/[id]/status
 * Toggle support room status between OPEN and CLOSED.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireRole(request, 'SUPPORT');
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    try {
        const body = await request.json();
        const newStatus: 'OPEN' | 'CLOSED' = body.status;

        if (!['OPEN', 'CLOSED'].includes(newStatus)) {
            return NextResponse.json({ error: 'وضعیت نامعتبر' }, { status: 400 });
        }

        const room = await prisma.supportRoom.update({
            where: { id: roomId },
            data: { status: newStatus, updatedAt: new Date() },
            select: { id: true, status: true },
        });

        return NextResponse.json({ success: true, room });
    } catch (error) {
        console.error('[Admin Support] Failed to update room status:', error);
        return NextResponse.json({ error: 'خطا در تغییر وضعیت' }, { status: 500 });
    }
}
