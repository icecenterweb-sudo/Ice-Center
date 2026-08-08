import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Update offer end date to 24 hours from now
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await prisma.offer.updateMany({
        where: { id: 1 },
        data: {
            endDate: futureDate
        }
    });

    console.log(`Updated ${updated.count} offer(s) endDate to: ${futureDate.toISOString()}`);

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
