import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const offers = await prisma.offer.findMany({
        include: {
            products: {
                select: { productId: true }
            }
        }
    });

    console.log('=== DB OFFERS ===');
    for (const o of offers) {
        console.log(`Offer ID ${o.id}: "${o.name}"`);
        console.log(`  isActive: ${o.isActive}, isFeatured: ${o.isFeatured}`);
        console.log(`  startDate: ${o.startDate}`);
        console.log(`  endDate: ${o.endDate}`);
        console.log(`  products count: ${o.products.length}`);
    }

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
