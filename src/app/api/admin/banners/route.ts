import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/admin-auth';
import { z } from 'zod';
import { revalidateHomepageTag } from '@/lib/cache/homepage';

const bannerPositionSchema = z.enum(['SINGLE_FULL', 'DOUBLE']);

const createBannerSchema = z.object({
    title: z.string().trim().min(1, 'عنوان بنر الزامی است'),
    position: bannerPositionSchema.default('SINGLE_FULL'),
    desktopImage: z.string().trim().min(1, 'تصویر دسکتاپ الزامی است'),
    mobileImage: z.string().trim().min(1, 'تصویر موبایل الزامی است'),
    alt: z.string().trim().min(1, 'متن جایگزین الزامی است'),
    link: z.string().trim().optional().nullable(),
    productId: z.number().int().positive().optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().default(true),
    order: z.number().int().default(0),
});

// GET - List all banners (for admin)
export async function GET(request: NextRequest) {
    await connection(); // Required for request.headers with cacheComponents
    try {
        const auth = await requireRole(request, 'BANNERS');
        if (!auth.ok) return auth.response;

        const banners = await prisma.banner.findMany({
            include: {
                product: { select: { id: true, name: true, slug: true } },
                category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: [
                { position: 'asc' },
                { order: 'asc' },
            ],
        });

        return NextResponse.json({ success: true, banners });
    } catch (error) {
        console.error('Failed to fetch banners:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت بنرها' },
            { status: 500 }
        );
    }
}

// POST - Create new banner
export async function POST(request: NextRequest) {
    try {
        const auth = await requireRole(request, 'BANNERS');
        if (!auth.ok) return auth.response;

        const body = await request.json();

        const result = createBannerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error.issues.map(i => i.message).join('، ') },
                { status: 400 }
            );
        }

        const data = result.data;

        const banner = await prisma.banner.create({
            data: {
                title: data.title,
                position: data.position,
                desktopImage: data.desktopImage,
                mobileImage: data.mobileImage,
                alt: data.alt,
                link: data.link || null,
                productId: data.productId || null,
                categoryId: data.categoryId || null,
                isActive: data.isActive,
                order: data.order,
            },
        });

        revalidateHomepageTag('banners');

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        console.error('Failed to create banner:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در ایجاد بنر' },
            { status: 500 }
        );
    }
}
