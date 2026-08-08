import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugifyName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[\(\)\,\،\:\؛\.\-\_\/\\]+/g, ' ')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

async function main() {
    const allProducts = await prisma.product.findMany({
        select: { id: true, name: true, slug: true, isActive: true },
        orderBy: { id: 'asc' }
    });

    console.log(`Processing ${allProducts.length} total products in database...`);

    // Step 1: Assign temp slugs to break unique constraint collisions
    for (const p of allProducts) {
        await prisma.product.update({
            where: { id: p.id },
            data: { slug: `temp-slug-${p.id}` }
        });
    }

    const usedSlugs = new Set<string>();

    // Step 2: Assign clean, accurate slugs
    for (const p of allProducts) {
        let baseSlug = slugifyName(p.name);
        if (!baseSlug) baseSlug = `product-${p.id}`;

        let targetSlug = baseSlug;
        let counter = 1;
        while (usedSlugs.has(targetSlug)) {
            counter++;
            targetSlug = `${baseSlug}-${counter}`;
        }
        usedSlugs.add(targetSlug);

        console.log(`Updated ID ${p.id} (${p.isActive ? 'Active' : 'Inactive'}): "${p.name}" -> "${targetSlug}"`);
        await prisma.product.update({
            where: { id: p.id },
            data: { slug: targetSlug }
        });
    }

    console.log('All product slugs successfully updated with clean unique URLs!');

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
