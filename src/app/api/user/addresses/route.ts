import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt';

// GET - Fetch user addresses
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get(USER_TOKEN_COOKIE)?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'وارد حساب کاربری خود شوید' },
                { status: 401 }
            );
        }

        const payload = await verifyUserToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'نشست نامعتبر است' },
                { status: 401 }
            );
        }

        const addresses = await prisma.address.findMany({
            where: { userId: payload.userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ],
        });

        return NextResponse.json({ addresses });
    } catch (error) {
        console.error('Get addresses error:', error);
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        );
    }
}

// POST - Create new address
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get(USER_TOKEN_COOKIE)?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'وارد حساب کاربری خود شوید' },
                { status: 401 }
            );
        }

        const payload = await verifyUserToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'نشست نامعتبر است' },
                { status: 401 }
            );
        }

        const { city, province, address, postalCode, isDefault } = await request.json();

        // Validate required fields
        if (!city || !address) {
            return NextResponse.json(
                { error: 'شهر و آدرس الزامی است' },
                { status: 400 }
            );
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: payload.userId },
                data: { isDefault: false },
            });
        }

        // Check if this is the first address
        const existingCount = await prisma.address.count({
            where: { userId: payload.userId },
        });

        const newAddress = await prisma.address.create({
            data: {
                userId: payload.userId,
                city: city.trim(),
                province: province?.trim() || null,
                address: address.trim(),
                postalCode: postalCode?.trim() || null,
                isDefault: isDefault || existingCount === 0, // First address is default
            },
        });

        return NextResponse.json({
            success: true,
            address: newAddress,
            message: 'آدرس با موفقیت اضافه شد',
        });
    } catch (error) {
        console.error('Create address error:', error);
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        );
    }
}
