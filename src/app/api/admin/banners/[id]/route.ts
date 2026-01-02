import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET - Get single banner
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const bannerId = parseInt(id);

        if (isNaN(bannerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه بنر نامعتبر است' },
                { status: 400 }
            );
        }

        const banner = await prisma.banner.findUnique({
            where: { id: bannerId },
            include: {
                product: { select: { id: true, name: true, slug: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        if (!banner) {
            return NextResponse.json(
                { success: false, error: 'بنر یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        console.error('Failed to fetch banner:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت بنر' },
            { status: 500 }
        );
    }
}

// PUT - Update banner
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const bannerId = parseInt(id);

        if (isNaN(bannerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه بنر نامعتبر است' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            title,
            position,
            desktopImage,
            mobileImage,
            alt,
            link,
            productId,
            categoryId,
            isActive,
            order,
        } = body;

        // Check exists
        const existing = await prisma.banner.findUnique({
            where: { id: bannerId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'بنر یافت نشد' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (title !== undefined) updateData.title = title.trim();
        if (position !== undefined) updateData.position = position;
        if (desktopImage !== undefined) updateData.desktopImage = desktopImage.trim();
        if (mobileImage !== undefined) updateData.mobileImage = mobileImage.trim();
        if (alt !== undefined) updateData.alt = alt.trim();
        if (link !== undefined) updateData.link = link?.trim() || null;
        if (productId !== undefined) updateData.productId = productId || null;
        if (categoryId !== undefined) updateData.categoryId = categoryId || null;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (order !== undefined) updateData.order = order;

        const banner = await prisma.banner.update({
            where: { id: bannerId },
            data: updateData,
        });

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        console.error('Failed to update banner:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در بروزرسانی بنر' },
            { status: 500 }
        );
    }
}

// DELETE - Delete banner
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const bannerId = parseInt(id);

        if (isNaN(bannerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه بنر نامعتبر است' },
                { status: 400 }
            );
        }

        await prisma.banner.delete({
            where: { id: bannerId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete banner:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در حذف بنر' },
            { status: 500 }
        );
    }
}
