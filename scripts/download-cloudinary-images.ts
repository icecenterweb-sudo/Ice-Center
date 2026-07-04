/**
 * Migration Script: Download Cloudinary Images and Save Locally (Sorted)
 * 
 * This script:
 * 1. Scans DB tables for images hosted on Cloudinary
 * 2. Downloads each image to a sorted local directory within public/uploads/
 * 3. Updates the database record with the new local URL (/uploads/<folder>/...)
 * 
 * Usage:
 *   npx tsx scripts/download-cloudinary-images.ts
 */

import { config } from 'dotenv';
// Load environment variables
config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Configure Prisma with pg adapter (matching src/lib/db.ts)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Check if string is a Cloudinary URL
function isCloudinaryUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('cloudinary.com');
}

// Download image from Cloudinary URL and save locally under a subfolder
async function downloadAndSaveImage(url: string, subfolder: string): Promise<string> {
    try {
        console.log(`  → Downloading: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get extension from URL or fallback
        let ext = path.extname(new URL(url).pathname);
        if (!ext) {
            const contentType = response.headers.get('content-type');
            if (contentType) {
                const parts = contentType.split('/');
                if (parts.length === 2) {
                    ext = `.${parts[1]}`;
                }
            }
        }
        if (!ext) ext = '.png';

        // Extract filename from URL and sanitize it
        const baseNameFromUrl = path.basename(new URL(url).pathname, ext);
        const sanitizedBaseName = baseNameFromUrl
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .substring(0, 50);

        const filename = `${Date.now()}-${sanitizedBaseName}${ext}`;
        const subfolderDir = path.join(UPLOAD_DIR, subfolder);
        
        // Ensure the specific subfolder exists
        await mkdir(subfolderDir, { recursive: true });
        const filePath = path.join(subfolderDir, filename);

        // Save file to disk
        await writeFile(filePath, buffer);
        console.log(`    ✅ Saved to: /uploads/${subfolder}/${filename}`);

        return `/uploads/${subfolder}/${filename}`;
    } catch (error) {
        console.error(`    ❌ Failed to download ${url}:`, error);
        throw error;
    }
}

// Migrate category images
async function migrateCategories() {
    console.log('\n📁 Migrating Category Images...');
    const categories = await prisma.category.findMany({
        where: {
            image: {
                contains: 'cloudinary.com'
            }
        }
    });

    let migrated = 0;
    let failed = 0;

    for (const category of categories) {
        if (!category.image) continue;
        try {
            console.log(`[Category] ${category.name}`);
            const localUrl = await downloadAndSaveImage(category.image, 'categories');
            await prisma.category.update({
                where: { id: category.id },
                data: { image: localUrl }
            });
            migrated++;
        } catch (error) {
            failed++;
        }
    }
    console.log(`📊 Categories: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
}

// Migrate product images
async function migrateProducts() {
    console.log('\n📦 Migrating Product Images...');
    const products = await prisma.product.findMany();

    let migratedThumbnails = 0;
    let migratedGallery = 0;
    let failed = 0;

    for (const product of products) {
        let hasChanges = false;
        const updates: { thumbnail?: string; images?: string[] } = {};

        // 1. Thumbnail
        if (product.thumbnail && isCloudinaryUrl(product.thumbnail)) {
            try {
                console.log(`[Product Thumbnail] ${product.name}`);
                const localUrl = await downloadAndSaveImage(product.thumbnail, 'products');
                updates.thumbnail = localUrl;
                migratedThumbnails++;
                hasChanges = true;
            } catch (error) {
                failed++;
            }
        }

        // 2. Images gallery array
        if (product.images && product.images.length > 0) {
            const updatedImages: string[] = [];
            let galleryChanged = false;

            for (const img of product.images) {
                if (isCloudinaryUrl(img)) {
                    try {
                        console.log(`[Product Gallery] ${product.name}`);
                        const localUrl = await downloadAndSaveImage(img, 'products');
                        updatedImages.push(localUrl);
                        migratedGallery++;
                        galleryChanged = true;
                    } catch (error) {
                        failed++;
                        updatedImages.push(img); // keep original on failure
                    }
                } else {
                    updatedImages.push(img);
                }
            }

            if (galleryChanged) {
                updates.images = updatedImages;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await prisma.product.update({
                where: { id: product.id },
                data: updates
            });
            console.log(`    ✅ Updated product: ${product.name}`);
        }
    }

    console.log(`📊 Products: ${migratedThumbnails} thumbnails, ${migratedGallery} gallery images migrated, ${failed} failed`);
    return { migratedThumbnails, migratedGallery, failed };
}

// Migrate slide images
async function migrateSlides() {
    console.log('\n🖼️ Migrating Slide Images...');
    const slides = await prisma.slide.findMany();

    let migrated = 0;
    let failed = 0;

    for (const slide of slides) {
        let hasChanges = false;
        const updates: { desktopImage?: string; mobileImage?: string } = {};

        if (isCloudinaryUrl(slide.desktopImage)) {
            try {
                console.log(`[Slide Desktop] ID: ${slide.id}`);
                updates.desktopImage = await downloadAndSaveImage(slide.desktopImage, 'sliders');
                hasChanges = true;
                migrated++;
            } catch (error) {
                failed++;
            }
        }

        if (isCloudinaryUrl(slide.mobileImage)) {
            try {
                console.log(`[Slide Mobile] ID: ${slide.id}`);
                updates.mobileImage = await downloadAndSaveImage(slide.mobileImage, 'sliders');
                hasChanges = true;
                migrated++;
            } catch (error) {
                failed++;
            }
        }

        if (hasChanges) {
            await prisma.slide.update({
                where: { id: slide.id },
                data: updates
            });
            console.log(`    ✅ Updated slide ID: ${slide.id}`);
        }
    }

    console.log(`📊 Slides: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
}

// Migrate banner images
async function migrateBanners() {
    console.log('\n🎨 Migrating Banner Images...');
    const banners = await prisma.banner.findMany();

    let migrated = 0;
    let failed = 0;

    for (const banner of banners) {
        let hasChanges = false;
        const updates: { desktopImage?: string; mobileImage?: string } = {};

        if (isCloudinaryUrl(banner.desktopImage)) {
            try {
                console.log(`[Banner Desktop] ${banner.title}`);
                updates.desktopImage = await downloadAndSaveImage(banner.desktopImage, 'banners');
                hasChanges = true;
                migrated++;
            } catch (error) {
                failed++;
            }
        }

        if (isCloudinaryUrl(banner.mobileImage)) {
            try {
                console.log(`[Banner Mobile] ${banner.title}`);
                updates.mobileImage = await downloadAndSaveImage(banner.mobileImage, 'banners');
                hasChanges = true;
                migrated++;
            } catch (error) {
                failed++;
            }
        }

        if (hasChanges) {
            await prisma.banner.update({
                where: { id: banner.id },
                data: updates
            });
            console.log(`    ✅ Updated banner: ${banner.title}`);
        }
    }

    console.log(`📊 Banners: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
}

// Migrate blog post images
async function migrateBlogPosts() {
    console.log('\n📝 Migrating Blog Post Images...');
    const posts = await prisma.blogPost.findMany();

    let migrated = 0;
    let failed = 0;

    for (const post of posts) {
        let hasChanges = false;
        const updates: { coverImage?: string; thumbnail?: string } = {};

        if (post.coverImage && isCloudinaryUrl(post.coverImage)) {
            try {
                console.log(`[Blog Cover] ${post.title}`);
                updates.coverImage = await downloadAndSaveImage(post.coverImage, 'blog-covers');
                hasChanges = true;
                migrated++;
            } catch (error) {
                failed++;
            }
        }

        if (post.thumbnail && isCloudinaryUrl(post.thumbnail)) {
            try {
                console.log(`[Blog Thumbnail] ${post.title}`);
                updates.thumbnail = await downloadAndSaveImage(post.thumbnail, 'blog-covers');
                hasChanges = true;
                migrated++;
            } catch (error) {
                failed++;
            }
        }

        if (hasChanges) {
            await prisma.blogPost.update({
                where: { id: post.id },
                data: updates
            });
            console.log(`    ✅ Updated blog post: ${post.title}`);
        }
    }

    console.log(`📊 Blog Posts: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
}

// Migrate blog category images
async function migrateBlogCategories() {
    console.log('\n📁 Migrating Blog Category Images...');
    const categories = await prisma.blogCategory.findMany({
        where: {
            image: {
                contains: 'cloudinary.com'
            }
        }
    });

    let migrated = 0;
    let failed = 0;

    for (const category of categories) {
        if (!category.image) continue;
        try {
            console.log(`[Blog Category] ${category.name}`);
            const localUrl = await downloadAndSaveImage(category.image, 'blog-categories');
            await prisma.blogCategory.update({
                where: { id: category.id },
                data: { image: localUrl }
            });
            migrated++;
        } catch (error) {
            failed++;
        }
    }

    console.log(`📊 Blog Categories: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
}

// Main execution function
async function main() {
    console.log('🚀 Starting Cloudinary to Local Storage Download & Update (Sorted)');
    console.log('=================================================================\n');

    // Verify upload directories exist
    const subfolders = [
        'categories',
        'products',
        'sliders',
        'banners',
        'blog-covers',
        'blog-categories',
        'author-avatars'
    ];
    for (const folder of subfolders) {
        const folderPath = path.join(UPLOAD_DIR, folder);
        console.log(`📁 Preparing directory: public/uploads/${folder}`);
        await mkdir(folderPath, { recursive: true });
    }

    // Verify database connection
    if (!connectionString) {
        console.error('❌ Missing database connection string!');
        console.error('   Required: POSTGRES_URL or DATABASE_URL');
        process.exit(1);
    }
    console.log('✅ Database connection configured');

    try {
        const catRes = await migrateCategories();
        const prodRes = await migrateProducts();
        const slideRes = await migrateSlides();
        const bannerRes = await migrateBanners();
        const postRes = await migrateBlogPosts();
        const blogCatRes = await migrateBlogCategories();

        console.log('\n=================================================================');
        console.log('🎉 Migration Completed successfully!');
        console.log('=================================================================');
        console.log('\nSummary of local migrations:');
        console.log(`  - Categories: ${catRes.migrated} migrated`);
        console.log(`  - Product Thumbnails: ${prodRes.migratedThumbnails} migrated`);
        console.log(`  - Product Gallery: ${prodRes.migratedGallery} migrated`);
        console.log(`  - Slides: ${slideRes.migrated} migrated`);
        console.log(`  - Banners: ${bannerRes.migrated} migrated`);
        console.log(`  - Blog Posts: ${postRes.migrated} migrated`);
        console.log(`  - Blog Categories: ${blogCatRes.migrated} migrated`);

        const totalFailed = catRes.failed + prodRes.failed + slideRes.failed + bannerRes.failed + postRes.failed + blogCatRes.failed;
        if (totalFailed > 0) {
            console.log(`\n⚠️  Warning: ${totalFailed} images failed to download/update. Please check logs.`);
        }
    } catch (error) {
        console.error('\n❌ Local migration script failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
