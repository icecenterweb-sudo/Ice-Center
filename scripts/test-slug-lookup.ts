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

async function main() {
    const rawParam = '%D8%AF%D8%B3%D8%AA%DA%AF%D8%A7%D9%87-%D8%A8%D8%B3%D8%AA%D9%86%DB%8C-%D9%82%DB%8C%D9%81%DB%8C-%D8%A7%D9%84%D8%A8%D8%B1%D8%B2-%D9%87%D8%B1%D9%85%D8%AA%DB%8C%DA%A9-%D8%B3%A7%D8%AF%D9%87-%D8%AF%D9%88-%DA%A9%D9%85%D9%BE%D8%B1%D8%B3%D9%88%D8%B1-%D8%B3%D9%87-%D9%81%D8%A7%D8%B2';
    const decoded = safeDecode(rawParam);

    console.log('RAW PARAM:', rawParam);
    console.log('SAFE DECODED:', decoded);

    const lookupRaw = await prisma.product.findFirst({ where: { slug: rawParam } });
    console.log('Lookup with raw:', lookupRaw ? lookupRaw.name : 'NULL');

    const lookupDecoded = await prisma.product.findFirst({ where: { slug: decoded } });
    console.log('Lookup with decoded:', lookupDecoded ? lookupDecoded.name : 'NULL');

    // Also check what slug Product ID 61 actually has in DB!
    const p61 = await prisma.product.findUnique({ where: { id: 61 } });
    console.log('Product ID 61 in DB:', p61 ? { id: p61.id, name: p61.name, slug: p61.slug } : 'NULL');

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
