/**
 * Script to create test offers
 * Run with: npx tsx scripts/create-test-offers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOffers() {
    console.log('🚀 Creating test offers...\n');

    // Get some existing products
    const products = await prisma.product.findMany({
        take: 6,
        where: { isActive: true },
        select: { id: true, name: true, price: true, listPrice: true }
    });

    if (products.length === 0) {
        console.log('❌ No products found. Please add products first.');
        return;
    }

    console.log(`Found ${products.length} products to use for offers.\n`);

    // Create test offers
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const offersData = [
        {
            name: 'تخفیف ویژه زمستانه',
            slug: 'winter-sale',
            discountType: 'PERCENTAGE' as const,
            discountValue: 20,
            startDate: now,
            endDate: oneWeekLater,
            isActive: true,
            isFeatured: true,
            priority: 10,
            badgeText: '۲۰٪ تخفیف',
            productIds: products.slice(0, 2).map(p => p.id),
        },
        {
            name: 'حراج آخر سال',
            slug: 'year-end-sale',
            discountType: 'PERCENTAGE' as const,
            discountValue: 15,
            startDate: now,
            endDate: oneMonthLater,
            isActive: true,
            isFeatured: true,
            priority: 5,
            badgeText: 'حراج',
            productIds: products.slice(2, 4).map(p => p.id),
        },
        {
            name: 'تخفیف ثابت',
            slug: 'fixed-discount',
            discountType: 'FIXED_AMOUNT' as const,
            discountValue: 500000, // 500,000 Toman
            startDate: now,
            endDate: oneWeekLater,
            isActive: true,
            isFeatured: true,
            priority: 3,
            badgeText: '۵۰۰ هزار تومان تخفیف',
            productIds: products.slice(4, 6).map(p => p.id),
        },
    ];

    for (const offerData of offersData) {
        try {
            // Check if offer already exists
            const existing = await prisma.offer.findUnique({
                where: { slug: offerData.slug }
            });

            if (existing) {
                console.log(`⏭️  Skipped (exists): ${offerData.name}`);
                continue;
            }

            const offer = await prisma.offer.create({
                data: {
                    name: offerData.name,
                    slug: offerData.slug,
                    discountType: offerData.discountType,
                    discountValue: offerData.discountValue,
                    startDate: offerData.startDate,
                    endDate: offerData.endDate,
                    isActive: offerData.isActive,
                    isFeatured: offerData.isFeatured,
                    priority: offerData.priority,
                    badgeText: offerData.badgeText,
                    products: {
                        create: offerData.productIds.map(productId => ({ productId })),
                    },
                },
            });

            // Update hasActiveOffer flag for products
            await prisma.product.updateMany({
                where: { id: { in: offerData.productIds } },
                data: { hasActiveOffer: true },
            });

            console.log(`✅ Created: ${offer.name} (${offerData.productIds.length} products)`);
        } catch (error) {
            console.error(`❌ Failed to create "${offerData.name}":`, error);
        }
    }

    console.log('\n✨ Done!');
}

createTestOffers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
