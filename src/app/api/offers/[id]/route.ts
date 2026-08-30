/**
 * Single Offer API
 * 
 * GET    - Fetch single offer details
 * PUT    - Update offer
 * DELETE - Delete offer
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { syncOfferFlagsForProductIds } from '@/lib/offers/queries';
import { z } from 'zod';
import { requireRole } from '@/lib/admin-auth';
import { recordAudit } from '@/lib/audit';
import { invalidateOfferCache } from '@/lib/cache/invalidation';

// Product with optional custom discount
const productEntrySchema = z.object({
    productId: z.number(),
    customDiscountValue: z.number().min(0, 'مقدار تخفیف سفارشی نمی‌تواند منفی باشد').nullable().optional(),
});

// Validation schema for updating an offer
const updateOfferSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    discountValue: z.number().min(0).optional(),
    maxDiscountCap: z.number().min(0).optional().nullable(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    priority: z.number().int().optional(),
    badgeText: z.string().optional().nullable(),
    badgeColor: z.string().optional().nullable(),
    campaignId: z.number().optional().nullable(),
    // Supports either an array of IDs or an array of product entries with custom discounts
    productIds: z.array(z.number()).optional(),
    products: z.array(productEntrySchema).optional(),
}).refine(data => {
    // If dates are provided, validate end > start
    if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
}, {
    message: 'تاریخ پایان باید بعد از تاریخ شروع باشد',
    path: ['endDate'],
}).refine(data => {
    // If discountType is percentage, validate value <= 100
    if (data.discountType === 'PERCENTAGE' && data.discountValue !== undefined) {
        return data.discountValue <= 100;
    }
    return true;
}, {
    message: 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد',
    path: ['discountValue'],
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/offers/[id]
 * Fetch single offer details (requires OFFERS role)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireRole(request, 'OFFERS');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const offerId = parseInt(id);

        if (isNaN(offerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                                listPrice: true,
                                thumbnail: true,
                            }
                        }
                    }
                },
                campaign: {
                    select: { id: true, name: true, slug: true }
                },
            },
        });

        if (!offer) {
            return NextResponse.json(
                { success: false, error: 'پیشنهاد یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, offer });

    } catch (error) {
        console.error('Failed to fetch offer:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت پیشنهاد' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/offers/[id]
 * Update an offer atomically inside a transaction
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireRole(request, 'OFFERS');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const offerId = parseInt(id);

        if (isNaN(offerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => null);
        const validation = updateOfferSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error.issues[0].message,
                    fieldErrors: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Get current offer to find affected products
        const currentOffer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: { products: { select: { productId: true } } },
        });

        if (!currentOffer) {
            return NextResponse.json(
                { success: false, error: 'پیشنهاد یافت نشد' },
                { status: 404 }
            );
        }

        const effectiveDiscountType = data.discountType ?? currentOffer.discountType;
        if (effectiveDiscountType === 'PERCENTAGE') {
            if (data.discountValue !== undefined && data.discountValue > 100) {
                return NextResponse.json(
                    { success: false, error: 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد' },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData: Prisma.OfferUncheckedUpdateInput = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.discountType !== undefined) updateData.discountType = data.discountType;
        if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
        if (data.maxDiscountCap !== undefined) updateData.maxDiscountCap = data.maxDiscountCap;
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.badgeText !== undefined) updateData.badgeText = data.badgeText;
        if (data.badgeColor !== undefined) updateData.badgeColor = data.badgeColor;
        if (data.campaignId !== undefined) updateData.campaignId = data.campaignId;

        const productEntries = data.products
            ? data.products
            : (data.productIds ? data.productIds.map(id => ({ productId: id, customDiscountValue: null })) : null);

        const newProductIds = data.products
            ? data.products.map(p => p.productId)
            : (data.productIds || []);

        const allAffectedProductIds = Array.from(new Set([
            ...currentOffer.products.map(p => p.productId),
            ...newProductIds,
        ]));

        // Atomic update inside transaction (#15)
        const offer = await prisma.$transaction(async (tx) => {
            if (productEntries) {
                await tx.offerProduct.deleteMany({
                    where: { offerId },
                });

                updateData.products = {
                    create: productEntries.map(p => ({
                        productId: p.productId,
                        customDiscountValue: p.customDiscountValue || null,
                    })),
                };
            }

            const updatedOffer = await tx.offer.update({
                where: { id: offerId },
                data: updateData,
                include: {
                    products: {
                        include: { product: { select: { id: true, name: true } } }
                    },
                },
            });

            // Batch sync flags inside transaction (#15)
            await syncOfferFlagsForProductIds(allAffectedProductIds, tx);

            return updatedOffer;
        });

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateOfferCache({
            id: offerId,
            productIds: allAffectedProductIds,
        });

        recordAudit(auth.payload.adminId, 'OFFER_UPDATE', 'Offer', offerId, `ویرایش پیشنهاد #${offerId}`);

        return NextResponse.json({ success: true, offer });

    } catch (error) {
        console.error('Failed to update offer:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در به‌روزرسانی پیشنهاد' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/offers/[id]
 * Delete an offer atomically inside a transaction
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireRole(request, 'OFFERS');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const offerId = parseInt(id);

        if (isNaN(offerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        // Get offer to find affected products
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: { products: { select: { productId: true } } },
        });

        if (!offer) {
            return NextResponse.json(
                { success: false, error: 'پیشنهاد یافت نشد' },
                { status: 404 }
            );
        }

        const affectedProductIds = offer.products.map(p => p.productId);

        // Atomic delete and flag sync in transaction (#15)
        await prisma.$transaction(async (tx) => {
            await tx.offer.delete({
                where: { id: offerId },
            });

            await syncOfferFlagsForProductIds(affectedProductIds, tx);
        });

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateOfferCache({
            id: offerId,
            productIds: affectedProductIds,
        });

        recordAudit(auth.payload.adminId, 'OFFER_DELETE', 'Offer', offerId, `حذف پیشنهاد #${offerId}`);

        return NextResponse.json({
            success: true,
            message: 'پیشنهاد با موفقیت حذف شد',
        });

    } catch (error) {
        console.error('Failed to delete offer:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در حذف پیشنهاد' },
            { status: 500 }
        );
    }
}
