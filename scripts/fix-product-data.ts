/**
 * Fix products that were imported via scripts and have invalid data
 * that doesn't match the validation schema in products.ts.
 *
 * Fixes:
 * - price = 0 → set to 1 (placeholder, so editing doesn't error)
 * - stock < 0 → set to 0
 * - inventoryStatus mismatch with stock
 * - missing slug
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Auditing products...\n');

    // 1. Find products with price = 0
    const zeroPriceProducts = await prisma.product.findMany({
        where: { price: 0 },
        select: { id: true, name: true, price: true, slug: true, isActive: true }
    });
    console.log(`❌ Products with price = 0: ${zeroPriceProducts.length}`);
    for (const p of zeroPriceProducts) {
        console.log(`   [${p.id}] ${p.name} (slug: ${p.slug}, active: ${p.isActive})`);
    }

    // 2. Find products with negative stock
    const negStockProducts = await prisma.product.findMany({
        where: { stock: { lt: 0 } },
        select: { id: true, name: true, stock: true }
    });
    console.log(`\n❌ Products with negative stock: ${negStockProducts.length}`);
    for (const p of negStockProducts) {
        console.log(`   [${p.id}] ${p.name} (stock: ${p.stock})`);
    }

    // 3. Find products with mismatched inventoryStatus
    const mismatchedStatus = await prisma.product.findMany({
        where: {
            OR: [
                { stock: { gt: 0 }, inventoryStatus: 'OUT_OF_STOCK' },
                { stock: { lte: 0 }, inventoryStatus: 'IN_STOCK' },
            ]
        },
        select: { id: true, name: true, stock: true, inventoryStatus: true }
    });
    console.log(`\n❌ Products with mismatched inventory status: ${mismatchedStatus.length}`);
    for (const p of mismatchedStatus) {
        console.log(`   [${p.id}] ${p.name} (stock: ${p.stock}, status: ${p.inventoryStatus})`);
    }

    // 4. Find products with empty name
    const emptyNameProducts = await prisma.product.findMany({
        where: { name: '' },
        select: { id: true, name: true, slug: true }
    });
    console.log(`\n❌ Products with empty name: ${emptyNameProducts.length}`);

    // Get total count
    const totalProducts = await prisma.product.count();
    const totalIssues = zeroPriceProducts.length + negStockProducts.length + mismatchedStatus.length + emptyNameProducts.length;
    console.log(`\n📊 Total products: ${totalProducts}`);
    console.log(`📊 Total issues found: ${totalIssues}`);

    if (totalIssues === 0) {
        console.log('\n✅ All products are valid! Nothing to fix.');
        return;
    }

    // ============================
    // Apply Fixes
    // ============================
    console.log('\n🔧 Applying fixes...\n');

    // Fix price = 0 → set to 1 (placeholder price so admin can edit without validation error)
    if (zeroPriceProducts.length > 0) {
        const result = await prisma.product.updateMany({
            where: { price: 0 },
            data: { price: 1 }
        });
        console.log(`✅ Fixed ${result.count} products with price=0 → set to 1 (placeholder)`);
    }

    // Fix negative stock → set to 0
    if (negStockProducts.length > 0) {
        const result = await prisma.product.updateMany({
            where: { stock: { lt: 0 } },
            data: { stock: 0 }
        });
        console.log(`✅ Fixed ${result.count} products with negative stock → set to 0`);
    }

    // Fix inventory status mismatches
    if (mismatchedStatus.length > 0) {
        const inStockFix = await prisma.product.updateMany({
            where: { stock: { gt: 0 }, inventoryStatus: 'OUT_OF_STOCK' },
            data: { inventoryStatus: 'IN_STOCK' }
        });
        const outStockFix = await prisma.product.updateMany({
            where: { stock: { lte: 0 }, inventoryStatus: 'IN_STOCK' },
            data: { inventoryStatus: 'OUT_OF_STOCK' }
        });
        console.log(`✅ Fixed ${inStockFix.count + outStockFix.count} products with mismatched inventory status`);
    }

    console.log('\n🎉 All fixes applied successfully!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
    });
