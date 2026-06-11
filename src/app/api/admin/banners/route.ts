import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET - List all banners (for admin)
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin(request);
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
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

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

        // Validation
        if (!title?.trim()) {
            return NextResponse.json(
                { success: false, error: 'عنوان بنر الزامی است' },
                { status: 400 }
            );
        }

        if (!desktopImage?.trim()) {
            return NextResponse.json(
                { success: false, error: 'تصویر دسکتاپ الزامی است' },
                { status: 400 }
            );
        }

        if (!mobileImage?.trim()) {
            return NextResponse.json(
                { success: false, error: 'تصویر موبایل الزامی است' },
                { status: 400 }
            );
        }

        if (!alt?.trim()) {
            return NextResponse.json(
                { success: false, error: 'متن جایگزین الزامی است' },
                { status: 400 }
            );
        }

        const banner = await prisma.banner.create({
            data: {
                title: title.trim(),
                position: position || 'SINGLE_FULL',
                desktopImage: desktopImage.trim(),
                mobileImage: mobileImage.trim(),
                alt: alt.trim(),
                link: link?.trim() || null,
                productId: productId || null,
                categoryId: categoryId || null,
                isActive: isActive ?? true,
                order: order ?? 0,
            },
        });

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        console.error('Failed to create banner:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در ایجاد بنر' },
            { status: 500 }
        );
    }
}
