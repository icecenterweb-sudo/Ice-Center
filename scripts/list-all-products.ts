import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, price: true, isActive: true, thumbnail: true },
        orderBy: { id: 'asc' }
    });

    console.log('=== ALL DB PRODUCTS ===');
    for (const p of products) {
        console.log(`ID ${p.id}: "${p.name}" | Price: ${p.price} | Active: ${p.isActive} | Image: ${p.thumbnail}`);
    }

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
