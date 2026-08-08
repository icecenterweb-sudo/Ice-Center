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
        where: {
            name: {
                contains: 'شاک فریز',
            }
        },
        select: {
            id: true,
            name: true,
            price: true,
            slug: true,
            thumbnail: true,
            createdAt: true,
        }
    });

    console.log('=== FOUND PRODUCTS WITH "شاک فریز" ===');
    console.log(JSON.stringify(products, null, 2));

    const allProducts = await prisma.product.findMany({
        select: { id: true, name: true, price: true, thumbnail: true },
        orderBy: { id: 'asc' }
    });
    console.log(`\nTotal products in DB: ${allProducts.length}`);
    console.log('First 10 products:');
    console.log(allProducts.slice(0, 10));

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
