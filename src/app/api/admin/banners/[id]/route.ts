import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/admin-auth';
import { z } from 'zod';
import { revalidateHomepageTag } from '@/lib/cache/homepage';

const bannerPositionSchema = z.enum(['SINGLE_FULL', 'DOUBLE']);

const safeLinkSchema = z.string().trim().refine(
    val => !val || val === '#' || (val.startsWith('/') && !val.startsWith('//') && !val.startsWith('/\\')) || /^https?:\/\//i.test(val),
    { message: 'لینک باید با / یا http:// یا https:// شروع شود' }
).optional().nullable();

const updateBannerSchema = z.object({
    title: z.string().trim().min(1, 'عنوان بنر الزامی است').optional(),
    position: bannerPositionSchema.optional(),
    desktopImage: z.string().trim().min(1, 'تصویر دسکتاپ الزامی است').optional(),
    mobileImage: z.string().trim().min(1, 'تصویر موبایل الزامی است').optional(),
    alt: z.string().trim().min(1, 'متن جایگزین الزامی است').optional(),
    link: safeLinkSchema,
    productId: z.number().int().positive().optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
});

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET - Get single banner
export async function GET(request: NextRequest, context: RouteContext) {
    await connection(); // Required for request.headers with cacheComponents
    try {
        const auth = await requireRole(request, 'BANNERS');
        if (!auth.ok) return auth.response;

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
        const auth = await requireRole(request, 'BANNERS');
        if (!auth.ok) return auth.response;

        const { id } = await context.params;
        const bannerId = parseInt(id);

        if (isNaN(bannerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه بنر نامعتبر است' },
                { status: 400 }
            );
        }

        const body = await request.json();

        const result = updateBannerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error.issues.map(i => i.message).join('، ') },
                { status: 400 }
            );
        }

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

        // Build update data from validated fields
        const data = result.data;
        const updateData: Record<string, unknown> = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.position !== undefined) updateData.position = data.position;
        if (data.desktopImage !== undefined) updateData.desktopImage = data.desktopImage;
        if (data.mobileImage !== undefined) updateData.mobileImage = data.mobileImage;
        if (data.alt !== undefined) updateData.alt = data.alt;
        if (data.link !== undefined) updateData.link = data.link || null;
        if (data.productId !== undefined) updateData.productId = data.productId || null;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.order !== undefined) updateData.order = data.order;

        const banner = await prisma.banner.update({
            where: { id: bannerId },
            data: updateData,
        });

        revalidateHomepageTag('banners');

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
        const auth = await requireRole(request, 'BANNERS');
        if (!auth.ok) return auth.response;

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

        revalidateHomepageTag('banners');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete banner:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در حذف بنر' },
            { status: 500 }
        );
    }
}
