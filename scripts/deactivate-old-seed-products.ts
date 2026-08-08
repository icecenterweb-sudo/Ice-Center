import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Soft-delete (deactivate) old seed products ID 1..13
    const result = await prisma.product.updateMany({
        where: {
            id: { lte: 13 }
        },
        data: {
            isActive: false
        }
    });

    console.log(`Deactivated ${result.count} old seed products (IDs 1..13).`);

    const activeCount = await prisma.product.count({ where: { isActive: true } });
    console.log(`Total ACTIVE products remaining in DB: ${activeCount}`);

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
