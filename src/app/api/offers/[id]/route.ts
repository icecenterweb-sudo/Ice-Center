/**
 * Single Offer API
 * 
 * GET    - Fetch single offer details
 * PUT    - Update offer
 * DELETE - Delete offer
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateProductOfferFlag } from '@/lib/offers';
import { z } from 'zod';

// Product with optional custom discount
const productEntrySchema = z.object({
    productId: z.number(),
    customDiscountValue: z.number().nullable().optional(),
});

// Validation schema for updating an offer
const updateOfferSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    description: z.string().optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    discountValue: z.number().positive().optional(),
    maxDiscountCap: z.number().optional().nullable(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    priority: z.number().optional(),
    badgeText: z.string().optional().nullable(),
    badgeColor: z.string().optional().nullable(),
    campaignId: z.number().optional().nullable(),
    // New format: products with custom discounts
    products: z.array(productEntrySchema).optional(),
    // Legacy format: just product IDs (backwards compatible)
    productIds: z.array(z.number()).optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/offers/[id]
 * Fetch single offer details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
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
 * Update an offer
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        // TODO: Add admin authentication check

        const { id } = await params;
        const offerId = parseInt(id);

        if (isNaN(offerId)) {
            return NextResponse.json(
                { success: false, error: 'شناسه نامعتبر' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = updateOfferSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
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

        // Build update data
        const updateData: any = {};
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

        // Handle product changes if provided (supports both new and legacy format)
        const productEntries = data.products
            ? data.products
            : (data.productIds ? data.productIds.map(id => ({ productId: id, customDiscountValue: null })) : null);

        if (productEntries) {
            const productIds = productEntries.map(p => p.productId);

            // Delete existing and create new
            await prisma.offerProduct.deleteMany({
                where: { offerId },
            });

            updateData.products = {
                create: productEntries.map(p => ({
                    productId: p.productId,
                    customDiscountValue: p.customDiscountValue || null,
                })),
            };
        }

        // Update offer
        const offer = await prisma.offer.update({
            where: { id: offerId },
            data: updateData,
            include: {
                products: {
                    include: { product: { select: { id: true, name: true } } }
                },
            },
        });

        // Update hasActiveOffer flags for affected products
        const newProductIds = data.products
            ? data.products.map(p => p.productId)
            : (data.productIds || []);

        const allAffectedProductIds = new Set([
            ...currentOffer.products.map(p => p.productId),
            ...newProductIds,
        ]);

        for (const productId of allAffectedProductIds) {
            await updateProductOfferFlag(productId);
        }

        return NextResponse.json({ success: true, offer });

    } catch (error) {
        console.error('Failed to update offer:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در بروزرسانی پیشنهاد' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/offers/[id]
 * Delete an offer
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        // TODO: Add admin authentication check

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

        // Delete offer (cascade will delete OfferProducts)
        await prisma.offer.delete({
            where: { id: offerId },
        });

        // Update hasActiveOffer flags for affected products
        for (const productId of affectedProductIds) {
            await updateProductOfferFlag(productId);
        }

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
