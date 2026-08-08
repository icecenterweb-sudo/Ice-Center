import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function safeDecode(str: string): string {
    try {
        return decodeURIComponent(str);
    } catch {
        try {
            return decodeURI(str);
        } catch {
            return str;
        }
    }
}

async function findProductSmart(slugOrId: string) {
    const raw = slugOrId.trim();
    const decoded = safeDecode(raw);

    // 1. Direct match by decoded or raw slug
    let product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: decoded },
                { slug: raw },
            ],
            isActive: true,
        }
    });
    if (product) return product;

    // 2. Lookup by numeric ID if parameter is a number
    const numId = Number(raw) || Number(decoded);
    if (!isNaN(numId) && numId > 0) {
        product = await prisma.product.findFirst({
            where: { id: numId, isActive: true }
        });
        if (product) return product;
    }

    // 3. Fallback: startsWith or contains match for slugs with trailing numbers (-2, -3)
    product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: { startsWith: decoded } },
                { slug: { startsWith: raw } },
            ],
            isActive: true,
        }
    });

    return product;
}

async function main() {
    const userUrlSlug = '%D8%AF%D8%B3%D8%AA%DA%AF%D8%A7%D9%87-%D8%A8%D8%B3%D8%AA%D9%86%DB%8C-%D9%82%DB%8C%D9%81%DB%8C-%D8%A7%D9%84%D8%A8%D8%B1%D8%B2-%D9%87%D8%B1%D9%85%D8%AA%DB%8C%DA%A9-%D8%B3%A7%D8%AF%D9%87-%D8%AF%D9%88-%DA%A9%D9%85%D9%BE%D8%B1%D8%B3%D9%88%D8%B1-%D8%B3%D9%87-%D9%81%D8%A7%D8%B2';

    const result = await findProductSmart(userUrlSlug);
    console.log('Smart lookup result for URL slug:');
    console.log(result ? { id: result.id, name: result.name, slug: result.slug } : 'NOT FOUND');

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
