import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const startSchema = z.object({
    name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
    phone: z.string().regex(/^(0?9\d{9})$/, 'شماره موبایل معتبر نیست'),
});

/**
 * POST /api/support/chat/start
 * Starts or resumes a support chat room.
 * - If user has a valid auth token: auto-fills phone and name.
 * - If token is invalid/missing: falls through to guest flow (name + phone required).
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        let userName: string | undefined;
        let userPhone: string | undefined;
        let userId: number | undefined;

        // Try authenticated flow first — if token is stale/invalid, fall through silently
        if (token) {
            const payload = await verifyUserToken(token).catch(() => null);
            if (payload) {
                const user = await prisma.user.findUnique({
                    where: { id: payload.userId },
                    select: { id: true, phone: true, firstName: true, lastName: true },
                });
                if (user) {
                    userName = user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || 'کاربر';
                    userPhone = user.phone;
                    userId = user.id;
                }
            }
            // If payload null or user not found → fall through to guest
        }

        // Guest flow — parse name + phone from body
        if (!userPhone) {
            const body = await request.json().catch(() => ({}));
            const validation = startSchema.safeParse(body);
            if (!validation.success) {
                return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
            }
            userName = validation.data.name;
            userPhone = validation.data.phone.startsWith('0')
                ? validation.data.phone
                : '0' + validation.data.phone;

            // Try to link to an existing user by phone
            const existingUser = await prisma.user.findUnique({
                where: { phone: userPhone },
                select: { id: true },
            });
            if (existingUser) userId = existingUser.id;
        }

        // Find or create an OPEN room for this phone number
        let room = await prisma.supportRoom.findFirst({
            where: { phone: userPhone, status: 'OPEN' },
            select: { id: true, phone: true, name: true, status: true, createdAt: true },
        });

        if (!room) {
            room = await prisma.supportRoom.create({
                data: {
                    phone: userPhone!,
                    name: userName!,
                    userId: userId ?? null,
                    status: 'OPEN',
                },
                select: { id: true, phone: true, name: true, status: true, createdAt: true },
            });
        }

        return NextResponse.json({ success: true, room });
    } catch (error) {
        console.error('[Support] Failed to start chat:', error);
        return NextResponse.json({ error: 'خطا در شروع گفتگو' }, { status: 500 });
    }
}
