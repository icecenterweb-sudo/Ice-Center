import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function safeDecodeSlug(str: string): string {
    let decoded = str;
    try {
        decoded = decodeURIComponent(str);
    } catch {
        // Fix malformed percent sequences if possible or replace %XX with character
        try {
            decoded = decodeURI(str.replace(/%([0-9A-F]{2})/gi, (match, p1) => {
                const num = parseInt(p1, 16);
                return num < 128 ? String.fromCharCode(num) : match;
            }));
        } catch {
            decoded = str;
        }
    }
    // Clean and normalize Persian letters & dashes
    return decoded
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .trim();
}

async function findProductSmart(slugOrId: string) {
    const raw = slugOrId.trim();
    const decoded = safeDecodeSlug(raw);

    // 1. Direct match by decoded or raw
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

    // 2. Check if numeric ID
    const numId = parseInt(raw, 10);
    if (!isNaN(numId) && numId > 0) {
        product = await prisma.product.findFirst({
            where: { id: numId, isActive: true }
        });
        if (product) return product;
    }

    // 3. Match by prefix / startsWith
    // E.g. 'دستگاه-بستنی-قیفی-البرز-هرمتیک-ساده-دو-کمپرسور-سه-فاز' vs DB '...-2'
    // Extract major search keywords
    const cleanQuery = decoded.replace(/%[0-9A-F]{2}/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const mainParts = cleanQuery.split('-').filter(p => p.length > 2);

    if (mainParts.length > 0) {
        const firstFew = mainParts.slice(0, 3).join('-');
        product = await prisma.product.findFirst({
            where: {
                slug: { contains: firstFew },
                isActive: true,
            }
        });
        if (product) return product;
    }

    return null;
}

async function main() {
    const userUrlSlug = '%D8%AF%D8%B3%D8%AA%DA%AF%D8%A7%D9%87-%D8%A8%D8%B3%D8%AA%D9%86%DB%8C-%D9%82%DB%8C%D9%81%DB%8C-%D8%A7%D9%84%D8%A8%D8%B1%D8%B2-%D9%87%D8%B1%D9%85%D8%AA%DB%8C%DA%A9-%D8%B3%A7%D8%AF%D9%87-%D8%AF%D9%88-%DA%A9%D9%85%D9%BE%D8%B1%D8%B3%D9%88%D8%B1-%D8%B3%D9%87-%D9%81%D8%A7%D8%B2';

    const result = await findProductSmart(userUrlSlug);
    console.log('Resilient lookup result for malformed URL slug:');
    console.log(result ? { id: result.id, name: result.name, slug: result.slug } : 'NOT FOUND');

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
