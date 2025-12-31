// Script to fix product slugs, SKU codes, brands and features
// Run with: npx tsx scripts/fix-products.ts

import 'dotenv/config';
import { prisma } from '../src/lib/db';

// Product fixes: id -> { slug, sku, brand, features }
const productFixes: Record<number, { slug?: string; sku?: string; brand?: string; features?: string[] }> = {
    12: {
        slug: 'ugolini-slush-machine',
        sku: 'UGO-SLUSH-001',
        brand: 'اوگولینی',
        features: [
            'همزن حلزونی',
            'مخزن پلی‌کربنات دوجداره',
            'توان ۱۱۰۰ وات',
            'جنس بدنه استیل',
            'ساخت ایتالیا',
        ],
    },
    13: {
        slug: 'parsgol-topping-refrigerator-arz90',
        sku: 'PG-TOP-ARZ90',
        brand: 'پارس گل',
        features: [
            'ظرفیت از 10 الی 20 کاسه',
            'عایق بندی فوم تزریقی',
            'شیشه سکوریت نشکن',
            'بدنه جانبی فایبرگلاس',
            'درب جلو بازشو',
            'درب عقب کشویی',
            'ترمومتر ضدبرفک',
            'کمپرسور قدرتمند',
            'مناسب مناطق گرمسیری',
        ],
    },
};

async function fixProducts() {
    console.log('🔧 Fixing products...\n');

    for (const [idStr, fixes] of Object.entries(productFixes)) {
        const id = parseInt(idStr);

        try {
            const product = await prisma.product.findUnique({
                where: { id },
                select: { id: true, name: true, slug: true, sku: true, brand: true, features: true },
            });

            if (!product) {
                console.log(`⚠️  Product ID ${id} not found, skipping...`);
                continue;
            }

            console.log(`📦 Found: "${product.name}"`);
            console.log(`   Current: slug="${product.slug}", sku="${product.sku}", brand="${product.brand}"`);
            console.log(`   Features: ${product.features?.length || 0} items`);

            const updated = await prisma.product.update({
                where: { id },
                data: {
                    slug: fixes.slug,
                    sku: fixes.sku,
                    brand: fixes.brand,
                    features: fixes.features,
                },
            });

            console.log(`   ✅ Updated: slug="${updated.slug}", sku="${updated.sku}", brand="${updated.brand}"`);
            console.log(`   ✅ Features: ${updated.features?.length || 0} items\n`);
        } catch (error) {
            console.error(`❌ Error fixing product ${id}:`, error);
        }
    }

    console.log('🎉 Done!');
}

fixProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
