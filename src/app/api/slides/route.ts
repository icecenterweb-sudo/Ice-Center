/**
 * Slides API
 * 
 * GET  - Fetch active slides for homepage (public)
 * POST - Create new slide (admin)
 */

import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a slide
const createSlideSchema = z.object({
    title: z.string().nullable().optional(),
    desktopImage: z.string().url('آدرس تصویر دسکتاپ نامعتبر است'),
    mobileImage: z.string().url('آدرس تصویر موبایل نامعتبر است'),
    alt: z.string().min(1, 'متن جایگزین الزامی است'),
    link: z.string().nullable().optional(),
    productId: z.number().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    isActive: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
});

/**
 * GET /api/slides
 * Fetch active slides for homepage carousel
 */
export async function GET(request: NextRequest) {
    await connection(); // Required for request.url with cacheComponents
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true'; // For admin: get all slides

        const slides = await prisma.slide.findMany({
            where: all ? {} : { isActive: true },
            include: {
                product: {
                    select: { id: true, name: true, slug: true }
                },
                category: {
                    select: { id: true, name: true, slug: true }
                }
            },
            orderBy: { order: 'asc' }
        });

        // Transform to frontend format
        const transformedSlides = slides.map(slide => ({
            id: slide.id,
            title: slide.title,
            desktopImage: slide.desktopImage,
            mobileImage: slide.mobileImage,
            alt: slide.alt,
            // Determine link: custom > product > category
            link: slide.link ||
                (slide.product ? `/products/${slide.product.slug}` : null) ||
                (slide.category ? `/categories/${slide.category.slug}` : '#'),
            isActive: slide.isActive,
            order: slide.order,
            productId: slide.productId,
            categoryId: slide.categoryId,
            product: slide.product,
            category: slide.category,
        }));

        return NextResponse.json({
            success: true,
            slides: transformedSlides,
        }, {
            headers: {
                // Cache for 5 minutes
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            }
        });

    } catch (error) {
        console.error('Failed to fetch slides:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت اسلایدها' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/slides
 * Create a new slide (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        // TODO: Add admin authentication check

        const body = await request.json();
        const validation = createSlideSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Get max order for new slide
        const maxOrder = await prisma.slide.aggregate({
            _max: { order: true }
        });
        const nextOrder = (maxOrder._max.order || 0) + 1;

        const slide = await prisma.slide.create({
            data: {
                title: data.title,
                desktopImage: data.desktopImage,
                mobileImage: data.mobileImage,
                alt: data.alt,
                link: data.link,
                productId: data.productId,
                categoryId: data.categoryId,
                isActive: data.isActive,
                order: data.order || nextOrder,
            },
            include: {
                product: { select: { id: true, name: true, slug: true } },
                category: { select: { id: true, name: true, slug: true } },
            }
        });

        return NextResponse.json({
            success: true,
            slide,
        }, { status: 201 });

    } catch (error) {
        console.error('Failed to create slide:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در ایجاد اسلاید' },
            { status: 500 }
        );
    }
}
