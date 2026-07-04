/**
 * Migration Script: Convert Base64 Images to Cloudinary URLs
 * 
 * This script:
 * 1. Finds all products and categories with base64 images
 * 2. Uploads each image to Cloudinary
 * 3. Updates the database with the new Cloudinary URLs
 * 
 * Usage:
 *   npx tsx scripts/migrate-images-to-cloudinary.ts
 * 
 * Note: Run this in a safe environment first (staging) before production.
 */

import { config } from 'dotenv';
config({ path: '.env' });
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary - using NEXT_PUBLIC_ prefix as per Next.js convention
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Prisma with pg adapter (matching src/lib/db.ts)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Check if a string is a base64 data URL
function isBase64DataUrl(str: string | null): boolean {
    if (!str) return false;
    return str.startsWith('data:image/');
}

// Upload base64 to Cloudinary and return the URL
async function uploadBase64ToCloudinary(base64: string, folder: string): Promise<string> {
    try {
        const result = await cloudinary.uploader.upload(base64, {
            folder: `ice-center-migration/${folder}`,
            resource_type: 'image',
        });
        return result.secure_url;
    } catch (error) {
        console.error('Failed to upload to Cloudinary:', error);
        throw error;
    }
}

// Migrate category images
async function migrateCategories() {
    console.log('\n📁 Migrating Category Images...');

    const categories = await prisma.category.findMany({
        select: { id: true, name: true, image: true }
    });

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const category of categories) {
        if (!isBase64DataUrl(category.image)) {
            skipped++;
            continue;
        }

        try {
            console.log(`  → Uploading image for category: ${category.name}`);
            const cloudinaryUrl = await uploadBase64ToCloudinary(category.image!, 'categories');

            await prisma.category.update({
                where: { id: category.id },
                data: { image: cloudinaryUrl }
            });

            migrated++;
            console.log(`    ✅ Migrated: ${category.name}`);
        } catch (error) {
            failed++;
            console.error(`    ❌ Failed: ${category.name}`, error);
        }
    }

    console.log(`\n📊 Categories: ${migrated} migrated, ${skipped} skipped (already URLs), ${failed} failed`);
    return { migrated, skipped, failed };
}

// Migrate product images
async function migrateProducts() {
    console.log('\n📦 Migrating Product Images...');

    const products = await prisma.product.findMany({
        select: { id: true, name: true, thumbnail: true, images: true }
    });

    let migratedThumbnails = 0;
    let migratedGallery = 0;
    let skipped = 0;
    let failed = 0;

    for (const product of products) {
        let hasChanges = false;
        const updates: { thumbnail?: string; images?: string[] } = {};

        // Migrate thumbnail
        if (isBase64DataUrl(product.thumbnail)) {
            try {
                console.log(`  → Uploading thumbnail for: ${product.name}`);
                const cloudinaryUrl = await uploadBase64ToCloudinary(product.thumbnail!, 'products/thumbnails');
                updates.thumbnail = cloudinaryUrl;
                migratedThumbnails++;
                hasChanges = true;
            } catch (error) {
                failed++;
                console.error(`    ❌ Failed thumbnail: ${product.name}`, error);
            }
        }

        // Migrate gallery images
        const images = product.images as string[] | null;
        if (images && images.length > 0) {
            const newImages: string[] = [];
            let galleryMigrated = false;

            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (isBase64DataUrl(img)) {
                    try {
                        console.log(`  → Uploading gallery image ${i + 1}/${images.length} for: ${product.name}`);
                        const cloudinaryUrl = await uploadBase64ToCloudinary(img, 'products/gallery');
                        newImages.push(cloudinaryUrl);
                        galleryMigrated = true;
                    } catch (error) {
                        failed++;
                        console.error(`    ❌ Failed gallery image: ${product.name}`, error);
                        newImages.push(img); // Keep original on failure
                    }
                } else {
                    newImages.push(img); // Already a URL
                }
            }

            if (galleryMigrated) {
                updates.images = newImages;
                migratedGallery++;
                hasChanges = true;
            }
        }

        // Apply updates
        if (hasChanges) {
            await prisma.product.update({
                where: { id: product.id },
                data: updates
            });
            console.log(`    ✅ Updated: ${product.name}`);
        } else {
            skipped++;
        }
    }

    console.log(`\n📊 Products: ${migratedThumbnails} thumbnails, ${migratedGallery} galleries, ${skipped} skipped, ${failed} failed`);
    return { migratedThumbnails, migratedGallery, skipped, failed };
}

// Migrate slide images
async function migrateSlides() {
    console.log('\n🖼️ Migrating Slide Images...');

    const slides = await prisma.slide.findMany({
        select: { id: true, alt: true, desktopImage: true, mobileImage: true }
    });

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const slide of slides) {
        let hasChanges = false;
        const updates: { desktopImage?: string; mobileImage?: string } = {};

        if (isBase64DataUrl(slide.desktopImage)) {
            try {
                console.log(`  → Uploading desktop image for slide: ${slide.alt || slide.id}`);
                updates.desktopImage = await uploadBase64ToCloudinary(slide.desktopImage, 'slides/desktop');
                hasChanges = true;
            } catch (error) {
                failed++;
                console.error(`    ❌ Failed desktop: ${slide.alt || slide.id}`, error);
            }
        }

        if (isBase64DataUrl(slide.mobileImage)) {
            try {
                console.log(`  → Uploading mobile image for slide: ${slide.alt || slide.id}`);
                updates.mobileImage = await uploadBase64ToCloudinary(slide.mobileImage, 'slides/mobile');
                hasChanges = true;
            } catch (error) {
                failed++;
                console.error(`    ❌ Failed mobile: ${slide.alt || slide.id}`, error);
            }
        }

        if (hasChanges) {
            await prisma.slide.update({
                where: { id: slide.id },
                data: updates
            });
            migrated++;
            console.log(`    ✅ Updated: ${slide.alt || slide.id}`);
        } else {
            skipped++;
        }
    }

    console.log(`\n📊 Slides: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);
    return { migrated, skipped, failed };
}

// Migrate banner images
async function migrateBanners() {
    console.log('\n🎨 Migrating Banner Images...');

    const banners = await prisma.banner.findMany({
        select: { id: true, title: true, desktopImage: true, mobileImage: true }
    });

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const banner of banners) {
        let hasChanges = false;
        const updates: { desktopImage?: string; mobileImage?: string } = {};

        if (isBase64DataUrl(banner.desktopImage)) {
            try {
                console.log(`  → Uploading desktop image for banner: ${banner.title || banner.id}`);
                updates.desktopImage = await uploadBase64ToCloudinary(banner.desktopImage, 'banners/desktop');
                hasChanges = true;
            } catch (error) {
                failed++;
                console.error(`    ❌ Failed desktop: ${banner.title || banner.id}`, error);
            }
        }

        if (isBase64DataUrl(banner.mobileImage)) {
            try {
                console.log(`  → Uploading mobile image for banner: ${banner.title || banner.id}`);
                updates.mobileImage = await uploadBase64ToCloudinary(banner.mobileImage, 'banners/mobile');
                hasChanges = true;
            } catch (error) {
                failed++;
                console.error(`    ❌ Failed mobile: ${banner.title || banner.id}`, error);
            }
        }

        if (hasChanges) {
            await prisma.banner.update({
                where: { id: banner.id },
                data: updates
            });
            migrated++;
            console.log(`    ✅ Updated: ${banner.title || banner.id}`);
        } else {
            skipped++;
        }
    }

    console.log(`\n📊 Banners: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);
    return { migrated, skipped, failed };
}

// Main migration function
async function main() {
    console.log('🚀 Starting Base64 to Cloudinary Migration');
    console.log('==========================================\n');

    // Verify Cloudinary config
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ Missing Cloudinary environment variables!');
        console.error('   Required: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
        process.exit(1);
    }

    console.log('✅ Cloudinary configured');

    // Verify database connection
    if (!connectionString) {
        console.error('❌ Missing database connection string!');
        console.error('   Required: POSTGRES_URL or DATABASE_URL');
        process.exit(1);
    }

    console.log('✅ Database configured');

    try {
        const categoryResults = await migrateCategories();
        const productResults = await migrateProducts();
        const slideResults = await migrateSlides();
        const bannerResults = await migrateBanners();

        console.log('\n==========================================');
        console.log('🎉 Migration Complete!');
        console.log('==========================================');
        console.log('\nSummary:');
        console.log(`  Categories: ${categoryResults.migrated} migrated`);
        console.log(`  Product thumbnails: ${productResults.migratedThumbnails} migrated`);
        console.log(`  Product galleries: ${productResults.migratedGallery} migrated`);
        console.log(`  Slides: ${slideResults.migrated} migrated`);
        console.log(`  Banners: ${bannerResults.migrated} migrated`);

        const totalFailed = categoryResults.failed + productResults.failed + slideResults.failed + bannerResults.failed;
        if (totalFailed > 0) {
            console.log(`\n⚠️  ${totalFailed} items failed to migrate. Check logs above.`);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
