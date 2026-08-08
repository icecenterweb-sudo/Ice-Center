import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const admins = await prisma.admin.findMany();
    console.log('=== DB ADMINS ===');
    console.log(JSON.stringify(admins, null, 2));

    const users = await prisma.user.findMany({ select: { id: true, phone: true, firstName: true, lastName: true } });
    console.log('=== DB USERS ===');
    console.log(JSON.stringify(users, null, 2));

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
