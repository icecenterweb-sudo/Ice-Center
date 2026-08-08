import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Fix Product #45
    const p45 = await prisma.product.findFirst({
        where: { name: { contains: 'ای سی ان تک ورودی' } }
    });

    if (p45) {
        await prisma.product.update({
            where: { id: p45.id },
            data: {
                name: 'دستگاه آب هویج گیری ICN تک ورودی',
                brand: 'ICN',
                model: 'تک ورودی',
                subcategoryId: 2, // Juice extractor
            }
        });
        console.log(`✅ Updated Product #45: ID ${p45.id}`);
    }

    // Fix Product #46
    const p46 = await prisma.product.findFirst({
        where: { name: { contains: '۴۶-' } }
    });

    if (p46) {
        await prisma.product.update({
            where: { id: p46.id },
            data: {
                name: 'دستگاه آب هویج گیری ICN دو دهانه ۲.۵ اسب',
                brand: 'ICN',
                model: 'دو دهانه ۲.۵ اسب',
                subcategoryId: 2, // Juice extractor
            }
        });
        console.log(`✅ Updated Product #46: ID ${p46.id}`);
    }

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
