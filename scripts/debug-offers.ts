/**
 * Debug Script: Check Offer Data
 * 
 * Run with: npx tsx scripts/debug-offers.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debugOffers() {
    const now = new Date();
    console.log('\n🔍 OFFER DEBUG REPORT');
    console.log('='.repeat(60));
    console.log(`Current time: ${now.toISOString()}`);
    console.log('='.repeat(60));

    // 1. Get ALL offers
    const allOffers = await prisma.offer.findMany({
        include: {
            products: {
                include: {
                    product: {
                        select: { id: true, name: true, stock: true, isActive: true }
                    }
                }
            }
        }
    });

    console.log(`\n📋 TOTAL OFFERS: ${allOffers.length}\n`);

    for (const offer of allOffers) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`📦 OFFER: ${offer.name} (ID: ${offer.id})`);
        console.log(`${'─'.repeat(50)}`);

        // Status flags
        console.log('\n📊 Status Flags:');
        console.log(`   isActive: ${offer.isActive ? '✅' : '❌'}`);
        console.log(`   isFeatured (show in carousel): ${offer.isFeatured ? '✅' : '❌'}`);

        // Dates
        console.log('\n📅 Date Range:');
        console.log(`   Start: ${offer.startDate.toISOString()}`);
        console.log(`   End:   ${offer.endDate.toISOString()}`);

        const isStarted = offer.startDate <= now;
        const isNotExpired = offer.endDate > now;
        console.log(`   Has started: ${isStarted ? '✅' : '❌ (future)'}`);
        console.log(`   Not expired: ${isNotExpired ? '✅' : '❌ (expired)'}`);

        // Will show in carousel?
        const willShowInCarousel = offer.isActive && offer.isFeatured && isStarted && isNotExpired;
        console.log(`\n🎠 WILL SHOW IN CAROUSEL: ${willShowInCarousel ? '✅ YES' : '❌ NO'}`);

        // Products
        console.log(`\n📦 Products (${offer.products.length}):`);
        if (offer.products.length === 0) {
            console.log('   ⚠️  No products attached!');
        } else {
            for (const op of offer.products) {
                const p = op.product;
                console.log(`   - [${p.id}] ${p.name}`);
                console.log(`     Stock: ${p.stock}, isActive: ${p.isActive}`);
                console.log(`     customDiscount: ${op.customDiscountValue ?? 'none (uses default)'}`);
            }
        }

        // Discount info
        console.log(`\n💰 Discount Config:`);
        console.log(`   Type: ${offer.discountType}`);
        console.log(`   Value: ${offer.discountValue}${offer.discountType === 'PERCENTAGE' ? '%' : ' تومان'}`);
    }

    // 2. What getCarouselOffers would return
    console.log('\n\n' + '='.repeat(60));
    console.log('🎠 SIMULATING getCarouselOffers()');
    console.log('='.repeat(60));

    const carouselOffers = await prisma.offer.findMany({
        where: {
            isActive: true,
            isFeatured: true,
            startDate: { lte: now },
            endDate: { gt: now },
        },
        include: {
            products: {
                include: {
                    product: {
                        select: { id: true, name: true, thumbnail: true, price: true, listPrice: true, stock: true }
                    }
                },
                take: 1  // ⚠️ THIS IS THE ISSUE - only takes 1 product per offer!
            }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ],
        take: 12
    });

    console.log(`\nOffers matching carousel criteria: ${carouselOffers.length}`);

    for (const offer of carouselOffers) {
        console.log(`\n  📦 ${offer.name}:`);
        console.log(`     Products returned: ${offer.products.length}`);
        if (offer.products[0]) {
            const p = offer.products[0].product;
            console.log(`     First product: ${p.name}`);
        }
    }

    // Note about the issue
    console.log('\n\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT NOTE');
    console.log('='.repeat(60));
    console.log(`
The carousel query uses "take: 1" per offer, which means:
- Each OFFER shows only 1 product in the carousel
- If you have 4 products in 1 offer, only the first shows
- To show all 4 products, the carousel logic would need to change

Current behavior: 1 offer = 1 carousel item (first product)
Desired behavior: 1 offer with N products = N carousel items?
`);

    await prisma.$disconnect();
    await pool.end();
}

debugOffers().catch(console.error);
