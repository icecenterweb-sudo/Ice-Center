/**
 * Migration Script: Convert Existing Discounted Products to Offers
 * 
 * This script finds all products where listPrice > price (existing discounts)
 * and creates "Legacy Discount" offers for them.
 * 
 * Run with: npx tsx scripts/migrate-discounts-to-offers.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateDiscountsToOffers() {
    console.log('🚀 Starting discount migration...\n');

    // Find products with existing discounts
    const discountedProducts = await prisma.product.findMany({
        where: {
            listPrice: { not: null },
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            price: true,
            listPrice: true,
            slug: true,
        }
    });

    // Filter to only products where listPrice > price
    const productsWithDiscount = discountedProducts.filter(p =>
        p.listPrice && p.listPrice > p.price
    );

    console.log(`Found ${productsWithDiscount.length} products with existing discounts.\n`);

    if (productsWithDiscount.length === 0) {
        console.log('No discounted products to migrate.');
        return;
    }

    // Check if legacy offer already exists
    let legacyOffer = await prisma.offer.findFirst({
        where: { slug: 'legacy-discounts' }
    });

    if (legacyOffer) {
        console.log('⏭️  Legacy offer already exists. Checking for new products to add...\n');

        // Get existing product IDs in this offer
        const existingOfferProducts = await prisma.offerProduct.findMany({
            where: { offerId: legacyOffer.id },
            select: { productId: true }
        });
        const existingProductIds = new Set(existingOfferProducts.map(op => op.productId));

        // Find products not yet in the offer
        const newProducts = productsWithDiscount.filter(p => !existingProductIds.has(p.id));

        if (newProducts.length > 0) {
            console.log(`Adding ${newProducts.length} new products to legacy offer...\n`);

            for (const product of newProducts) {
                const listPriceNum = Number(product.listPrice);
                const priceNum = Number(product.price);
                const discountPercent = ((listPriceNum - priceNum) / listPriceNum) * 100;

                await prisma.offerProduct.create({
                    data: {
                        offerId: legacyOffer.id,
                        productId: product.id,
                        customDiscountValue: Math.round(discountPercent * 100) / 100,
                    }
                });

                await prisma.product.update({
                    where: { id: product.id },
                    data: { hasActiveOffer: true }
                });

                console.log(`  ✅ Added: ${product.name} (${Math.round(discountPercent)}% off)`);
            }
        } else {
            console.log('All discounted products are already in the legacy offer.');
        }
    } else {
        console.log('Creating new legacy offer...\n');

        // Create a single "Legacy Discounts" offer
        // Each product gets its own customDiscountValue based on current discount
        legacyOffer = await prisma.offer.create({
            data: {
                name: 'تخفیفات دائمی',
                slug: 'legacy-discounts',
                description: 'تخفیفات موجود از قبل - مهاجرت خودکار',
                discountType: 'PERCENTAGE',
                discountValue: 0, // Will use customDiscountValue per product
                startDate: new Date('2020-01-01'),
                endDate: new Date('2099-12-31'), // "Permanent" discount
                isActive: true,
                isFeatured: false, // Don't show in carousel
                priority: 0, // Lowest priority
            }
        });

        console.log(`✅ Created legacy offer: "${legacyOffer.name}"\n`);

        // Add each product with its specific discount percentage
        let migrated = 0;
        let errors = 0;

        for (const product of productsWithDiscount) {
            try {
                const listPriceNum = Number(product.listPrice);
                const priceNum = Number(product.price);
                const discountPercent = ((listPriceNum - priceNum) / listPriceNum) * 100;

                await prisma.offerProduct.create({
                    data: {
                        offerId: legacyOffer.id,
                        productId: product.id,
                        customDiscountValue: Math.round(discountPercent * 100) / 100, // Round to 2 decimals
                    }
                });

                // Update hasActiveOffer flag
                await prisma.product.update({
                    where: { id: product.id },
                    data: { hasActiveOffer: true }
                });

                migrated++;
                console.log(`  ✅ ${product.name}: ${Math.round(discountPercent)}% off`);

            } catch (error) {
                errors++;
                console.error(`  ❌ Failed: ${product.name}`, error);
            }
        }

        console.log(`\n📊 Migration complete: ${migrated} migrated, ${errors} errors`);
    }

    // Summary
    const totalOfferProducts = await prisma.offerProduct.count({
        where: { offerId: legacyOffer.id }
    });

    console.log(`\n✨ Total products in legacy offer: ${totalOfferProducts}`);
    console.log('\n💡 Note: These products now use the Offer system.');
    console.log('   Their effective price will be calculated from listPrice + discount.');
}

migrateDiscountsToOffers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
