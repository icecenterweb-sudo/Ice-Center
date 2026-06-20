import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkImages() {
    console.log('--- Categories ---');
    const categories = await prisma.category.findMany();
    categories.forEach(c => c.image && console.log(`Category ID ${c.id}: ${c.image}`));

    console.log('\n--- Products ---');
    const products = await prisma.product.findMany();
    products.forEach(p => {
        if (p.thumbnail) console.log(`Product ID ${p.id} (Thumbnail): ${p.thumbnail}`);
        if (p.images && p.images.length > 0) {
            p.images.forEach(img => console.log(`Product ID ${p.id} (Gallery): ${img}`));
        }
    });

    console.log('\n--- Slides ---');
    const slides = await prisma.slide.findMany();
    slides.forEach(s => {
        if (s.desktopImage) console.log(`Slide ID ${s.id} (Desktop): ${s.desktopImage}`);
        if (s.mobileImage) console.log(`Slide ID ${s.id} (Mobile): ${s.mobileImage}`);
    });

    console.log('\n--- Banners ---');
    const banners = await prisma.banner.findMany();
    banners.forEach(b => {
        if (b.desktopImage) console.log(`Banner ID ${b.id} (Desktop): ${b.desktopImage}`);
        if (b.mobileImage) console.log(`Banner ID ${b.id} (Mobile): ${b.mobileImage}`);
    });

    console.log('\n--- Blog Posts ---');
    const posts = await prisma.blogPost.findMany();
    posts.forEach(p => {
        if (p.coverImage) console.log(`BlogPost ID ${p.id} (Cover): ${p.coverImage}`);
        if (p.thumbnail) console.log(`BlogPost ID ${p.id} (Thumbnail): ${p.thumbnail}`);
    });

    console.log('\n--- Blog Categories ---');
    const blogCats = await prisma.blogCategory.findMany();
    blogCats.forEach(bc => bc.image && console.log(`BlogCategory ID ${bc.id}: ${bc.image}`));

    await prisma.$disconnect();
    await pool.end();
}

checkImages().catch(console.error);
