import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Converts a local file path (e.g. /uploads/categories/abc.png) to WebP.
 * Returns the updated relative WebP path (e.g. /uploads/categories/abc.webp).
 */
async function convertFileToWebp(urlPath: string | null): Promise<{ newUrl: string | null; converted: boolean }> {
    if (!urlPath || typeof urlPath !== 'string') {
        return { newUrl: urlPath, converted: false };
    }

    // Only process local /uploads/ images
    if (!urlPath.startsWith('/uploads/')) {
        return { newUrl: urlPath, converted: false };
    }

    const ext = path.extname(urlPath).toLowerCase();
    if (ext === '.webp') {
        return { newUrl: urlPath, converted: false };
    }

    if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext)) {
        return { newUrl: urlPath, converted: false };
    }

    const relativeFilePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const absoluteInputPath = path.join(PUBLIC_DIR, relativeFilePath);

    if (!fs.existsSync(absoluteInputPath)) {
        console.warn(`[Skip] File not found on disk: ${absoluteInputPath}`);
        return { newUrl: urlPath, converted: false };
    }

    const absoluteOutputPath = absoluteInputPath.slice(0, -ext.length) + '.webp';
    const newUrlPath = urlPath.slice(0, -ext.length) + '.webp';

    try {
        const inputSize = fs.statSync(absoluteInputPath).size;

        await sharp(absoluteInputPath)
            .webp({ quality: 85 })
            .toFile(absoluteOutputPath);

        const outputSize = fs.statSync(absoluteOutputPath).size;
        const savedKb = Math.round((inputSize - outputSize) / 1024);

        console.log(`✅ Converted: ${path.basename(absoluteInputPath)} -> ${path.basename(absoluteOutputPath)} (Saved ${savedKb} KB)`);

        // Remove original file after successful conversion
        if (fs.existsSync(absoluteInputPath) && absoluteInputPath !== absoluteOutputPath) {
            fs.unlinkSync(absoluteInputPath);
        }

        return { newUrl: newUrlPath, converted: true };
    } catch (error) {
        console.error(`❌ Failed to convert ${absoluteInputPath}:`, error);
        return { newUrl: urlPath, converted: false };
    }
}

async function main() {
    console.log('🚀 Starting image conversion to WebP and database updates...\n');
    let totalConverted = 0;

    // 1. Categories
    console.log('--- Processing Categories ---');
    const categories = await prisma.category.findMany();
    for (const cat of categories) {
        if (cat.image) {
            const { newUrl, converted } = await convertFileToWebp(cat.image);
            if (converted) {
                totalConverted++;
                await prisma.category.update({
                    where: { id: cat.id },
                    data: { image: newUrl },
                });
            }
        }
    }

    // 2. Products
    console.log('\n--- Processing Products ---');
    const products = await prisma.product.findMany();
    for (const p of products) {
        let updated = false;
        let newThumbnail = p.thumbnail;
        const newImages: string[] = [];

        if (p.thumbnail) {
            const res = await convertFileToWebp(p.thumbnail);
            if (res.converted) {
                newThumbnail = res.newUrl;
                updated = true;
            }
        }

        if (p.images && p.images.length > 0) {
            for (const img of p.images) {
                const res = await convertFileToWebp(img);
                const finalUrl = res.newUrl || img.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                newImages.push(finalUrl);
                if (res.converted || finalUrl !== img) {
                    updated = true;
                }
            }
        }

        if (updated) {
            totalConverted++;
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    thumbnail: newThumbnail,
                    images: newImages,
                },
            });
        }
    }

    // 3. Slides
    console.log('\n--- Processing Slides ---');
    const slides = await prisma.slide.findMany();
    for (const s of slides) {
        const desktopRes = await convertFileToWebp(s.desktopImage);
        const mobileRes = await convertFileToWebp(s.mobileImage);

        if (desktopRes.converted || mobileRes.converted) {
            totalConverted++;
            await prisma.slide.update({
                where: { id: s.id },
                data: {
                    desktopImage: desktopRes.newUrl || s.desktopImage,
                    mobileImage: mobileRes.newUrl || s.mobileImage,
                },
            });
        }
    }

    // 4. Banners
    console.log('\n--- Processing Banners ---');
    const banners = await prisma.banner.findMany();
    for (const b of banners) {
        const desktopRes = await convertFileToWebp(b.desktopImage);
        const mobileRes = await convertFileToWebp(b.mobileImage);

        if (desktopRes.converted || mobileRes.converted) {
            totalConverted++;
            await prisma.banner.update({
                where: { id: b.id },
                data: {
                    desktopImage: desktopRes.newUrl || b.desktopImage,
                    mobileImage: mobileRes.newUrl || b.mobileImage,
                },
            });
        }
    }

    // 5. Blog Posts
    console.log('\n--- Processing Blog Posts ---');
    const posts = await prisma.blogPost.findMany();
    for (const post of posts) {
        const coverRes = await convertFileToWebp(post.coverImage);
        const thumbRes = await convertFileToWebp(post.thumbnail);

        if (coverRes.converted || thumbRes.converted) {
            totalConverted++;
            await prisma.blogPost.update({
                where: { id: post.id },
                data: {
                    coverImage: coverRes.newUrl,
                    thumbnail: thumbRes.newUrl,
                },
            });
        }
    }

    // 6. Blog Categories
    console.log('\n--- Processing Blog Categories ---');
    const blogCats = await prisma.blogCategory.findMany();
    for (const bc of blogCats) {
        if (bc.image) {
            const res = await convertFileToWebp(bc.image);
            if (res.converted) {
                totalConverted++;
                await prisma.blogCategory.update({
                    where: { id: bc.id },
                    data: { image: res.newUrl },
                });
            }
        }
    }

    console.log(`\n🎉 Conversion complete! Total converted & updated items: ${totalConverted}`);

    await prisma.$disconnect();
    await pool.end();
}

main().catch(err => {
    console.error('Fatal error during conversion:', err);
    process.exit(1);
});
