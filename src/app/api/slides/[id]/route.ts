/**
 * Single Slide API
 * 
 * GET    - Fetch single slide
 * PUT    - Update slide
 * DELETE - Delete slide
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { requireRole } from '@/lib/admin-auth';
import { revalidateHomepageTag } from '@/lib/cache/homepage';

// Validation schema for updating a slide
const updateSlideSchema = z.object({
    title: z.string().nullable().optional(),
    desktopImage: z.string().min(1).optional(),
    mobileImage: z.string().min(1).optional(),
    alt: z.string().min(1).optional(),
    link: z.string().optional().nullable(),
    productId: z.number().optional().nullable(),
    categoryId: z.number().optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/slides/[id]
 * Fetch single slide details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const slideId = parseInt(id);

        if (isNaN(slideId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        const slide = await prisma.slide.findUnique({
            where: { id: slideId },
            include: {
                product: { select: { id: true, name: true, slug: true } },
                category: { select: { id: true, name: true, slug: true } },
            }
        });

        if (!slide) {
            return NextResponse.json(
                { success: false, error: 'اسلاید یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, slide });

    } catch (error) {
        console.error('Failed to fetch slide:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت اسلاید' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/slides/[id]
 * Update a slide
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireRole(request, 'SLIDES');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const slideId = parseInt(id);

        if (isNaN(slideId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = updateSlideSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if slide exists
        const existing = await prisma.slide.findUnique({
            where: { id: slideId }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'اسلاید یافت نشد' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: Prisma.SlideUncheckedUpdateInput = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.desktopImage !== undefined) updateData.desktopImage = data.desktopImage;
        if (data.mobileImage !== undefined) updateData.mobileImage = data.mobileImage;
        if (data.alt !== undefined) updateData.alt = data.alt;
        if (data.link !== undefined) updateData.link = data.link;
        if (data.productId !== undefined) updateData.productId = data.productId;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.order !== undefined) updateData.order = data.order;

        const slide = await prisma.slide.update({
            where: { id: slideId },
            data: updateData,
            include: {
                product: { select: { id: true, name: true, slug: true } },
                category: { select: { id: true, name: true, slug: true } },
            }
        });

        revalidateHomepageTag('slides');

        return NextResponse.json({ success: true, slide });

    } catch (error) {
        console.error('Failed to update slide:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در بروزرسانی اسلاید' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/slides/[id]
 * Delete a slide
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireRole(request, 'SLIDES');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const slideId = parseInt(id);

        if (isNaN(slideId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        // Check if slide exists
        const existing = await prisma.slide.findUnique({
            where: { id: slideId }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'اسلاید یافت نشد' },
                { status: 404 }
            );
        }

        await prisma.slide.delete({
            where: { id: slideId }
        });

        revalidateHomepageTag('slides');

        return NextResponse.json({
            success: true,
            message: 'اسلاید با موفقیت حذف شد',
        });

    } catch (error) {
        console.error('Failed to delete slide:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در حذف اسلاید' },
            { status: 500 }
        );
    }
}
