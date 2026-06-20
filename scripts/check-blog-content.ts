import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkBlogContent() {
    const posts = await prisma.blogPost.findMany();
    console.log(`Checking ${posts.length} blog posts for Cloudinary URLs in rich text content...`);

    for (const post of posts) {
        const contentStr = JSON.stringify(post.content);
        // Find all matches of URLs containing cloudinary.com
        const regex = /https?:\/\/[^\s"'`<>]+cloudinary\.com[^\s"'`<>]+/g;
        const matches = contentStr.match(regex);
        if (matches && matches.length > 0) {
            console.log(`\nBlogPost ID ${post.id}: "${post.title}" has ${matches.length} Cloudinary URL(s):`);
            matches.forEach(m => console.log(` - ${m}`));
        } else {
            console.log(`BlogPost ID ${post.id}: "${post.title}" has 0 Cloudinary URLs.`);
        }
    }

    await prisma.$disconnect();
    await pool.end();
}

checkBlogContent().catch(console.error);
