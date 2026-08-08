import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const categories = await prisma.category.findMany({
        include: {
            subcategories: {
                select: { id: true, name: true, slug: true, _count: { select: { products: true } } }
            }
        }
    });

    console.log('=== DB CATEGORIES ===');
    for (const c of categories) {
        console.log(`\nCategory ID ${c.id}: "${c.name}" (slug: "${c.slug}")`);
        for (const s of c.subcategories) {
            console.log(`  └─ Subcategory ID ${s.id}: "${s.name}" (slug: "${s.slug}") -> ${s._count.products} products`);
        }
    }

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
