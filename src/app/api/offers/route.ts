/**
 * Offers API
 * 
 * GET  - Fetch active offers for carousel (public)
 * POST - Create new offer (admin only)
 */

import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { getCarouselOffers } from '@/lib/offers';
import { syncOfferFlagsForProductIds } from '@/lib/offers/queries';
import { z } from 'zod';
import { requireRole } from '@/lib/admin-auth';
import { recordAudit } from '@/lib/audit';
import { invalidateOfferCache } from '@/lib/cache/invalidation';
import { slugify, generateUniqueSlug } from '@/lib/slugify';

// Product with optional custom discount
const productEntrySchema = z.object({
    productId: z.number(),
    customDiscountValue: z.number().min(0, 'مقدار تخفیف سفارشی نمی‌تواند منفی باشد').nullable().optional(),
});

// Validation schema for creating an offer
const createOfferSchema = z.object({
    name: z.string().min(1, 'نام پیشنهاد الزامی است'),
    slug: z.string().optional(),
    description: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().positive('مقدار تخفیف باید مثبت باشد'),
    maxDiscountCap: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime(),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    priority: z.number().optional().default(0),
    badgeText: z.string().optional(),
    badgeColor: z.string().optional(),
    campaignId: z.number().optional(),
    // New format: products with custom discounts
    products: z.array(productEntrySchema).optional(),
    // Legacy format: just product IDs (backwards compatible)
    productIds: z.array(z.number()).optional(),
}).refine(data => (data.products && data.products.length > 0) || (data.productIds && data.productIds.length > 0), {
    message: 'حداقل یک محصول انتخاب کنید',
}).refine(data => {
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
        return false;
    }
    return true;
}, {
    message: 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد',
    path: ['discountValue'],
}).refine(data => {
    if (data.discountType === 'PERCENTAGE' && data.products) {
        return data.products.every(p => p.customDiscountValue === null || p.customDiscountValue === undefined || p.customDiscountValue <= 100);
    }
    return true;
}, {
    message: 'درصد تخفیف سفارشی برای هر محصول نمی‌تواند بیشتر از ۱۰۰ باشد',
    path: ['products'],
});

/**
 * GET /api/offers
 * Fetch featured offers for homepage carousel
 */
export async function GET(request: NextRequest) {
    await connection(); // Required for request.url with cacheComponents
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '12');
        const featured = searchParams.get('featured') !== 'false';

        if (featured) {
            // Carousel offers
            const offers = await getCarouselOffers(limit);

            return NextResponse.json({
                success: true,
                offers,
            }, {
                headers: {
                    // Cache for 5 minutes, stale-while-revalidate for 10
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                }
            });
        }

        // All active offers (for admin or listing page)
        const now = new Date();
        const offers = await prisma.offer.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gt: now },
            },
            include: {
                products: {
                    include: {
                        product: {
                            select: { id: true, name: true, thumbnail: true }
                        }
                    }
                },
                campaign: {
                    select: { id: true, name: true, slug: true }
                },
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            take: limit,
        });

        return NextResponse.json({ success: true, offers });

    } catch (error) {
        console.error('Failed to fetch offers:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت پیشنهادها' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/offers
 * Create a new offer (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireRole(request, 'OFFERS');
        if (!auth.ok) return auth.response;

        const body = await request.json().catch(() => null);
        const validation = createOfferSchema.safeParse(body);

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

        // Generate canonical unique slug if not provided or ensure uniqueness
        const slug = data.slug
            ? slugify(data.slug)
            : await generateUniqueSlug(data.name, 'offer');

        // Determine products - support both new and legacy format
        const productEntries = data.products
            ? data.products
            : (data.productIds || []).map(id => ({ productId: id, customDiscountValue: null }));

        const productIds = productEntries.map(p => p.productId);

        // Create offer with products
        const offer = await prisma.offer.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                maxDiscountCap: data.maxDiscountCap,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: new Date(data.endDate),
                isActive: data.isActive,
                isFeatured: data.isFeatured,
                priority: data.priority,
                badgeText: data.badgeText,
                badgeColor: data.badgeColor,
                campaignId: data.campaignId,
                products: {
                    create: productEntries.map(p => ({
                        productId: p.productId,
                        customDiscountValue: p.customDiscountValue || null,
                    })),
                },
            },
            include: {
                products: {
                    include: { product: { select: { id: true, name: true } } }
                },
            },
        });

        // Update hasActiveOffer flag for affected products
        await syncOfferFlagsForProductIds(productIds);

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateOfferCache({
            id: offer.id,
            productIds,
        });

        recordAudit(auth.payload.adminId, 'OFFER_CREATE', 'Offer', offer.id, `ایجاد پیشنهاد "${offer.name}" (${productIds.length} محصول)`);

        return NextResponse.json({
            success: true,
            offer,
        }, { status: 201 });

    } catch (error) {
        console.error('Failed to create offer:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در ایجاد پیشنهاد' },
            { status: 500 }
        );
    }
}
