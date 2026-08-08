import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.product.deleteMany({
        where: { id: 56 }
    });
    const count = await prisma.product.count();
    console.log(`Current Total Products in DB: ${count}`);

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
