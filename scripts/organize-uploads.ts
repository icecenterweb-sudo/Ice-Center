import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper to move file and return the new URL path
function organizeFile(localUrl: string | null | undefined, targetSubfolder: string): string | null {
    if (!localUrl) return null;
    
    // Check if it is a local upload path, e.g. starts with '/uploads/'
    if (!localUrl.startsWith('/uploads/')) {
        return localUrl; // Keep Cloudinary or external urls as-is
    }

    const filename = localUrl.replace('/uploads/', '');
    
    // If the filename already contains a slash, it's already sorted
    if (filename.includes('/')) {
        return localUrl;
    }

    const oldPath = path.join(UPLOAD_DIR, filename);
    const targetDir = path.join(UPLOAD_DIR, targetSubfolder);
    const newPath = path.join(targetDir, filename);

    if (fs.existsSync(oldPath)) {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`✅ Moved: public/uploads/${filename} → public/uploads/${targetSubfolder}/${filename}`);
        } catch (err: any) {
            console.error(`❌ Failed to move public/uploads/${filename}:`, err.message);
        }
    } else if (fs.existsSync(newPath)) {
        console.log(`ℹ️ Already organized: public/uploads/${targetSubfolder}/${filename}`);
    } else {
        console.warn(`⚠️ Physical file not found: public/uploads/${filename}`);
    }

    return `/uploads/${targetSubfolder}/${filename}`;
}

async function main() {
    console.log('🔄 Reorganizing existing uploaded files and migrating database paths...');
    console.log('========================================================================\n');

    // 1. Categories
    console.log('📁 Reorganizing Categories...');
    const categories = await prisma.category.findMany();
    for (const category of categories) {
        if (category.image) {
            const newUrl = organizeFile(category.image, 'categories');
            if (newUrl !== category.image) {
                await prisma.category.update({
                    where: { id: category.id },
                    data: { image: newUrl }
                });
            }
        }
    }

    // 2. Products
    console.log('\n📦 Reorganizing Products...');
    const products = await prisma.product.findMany();
    for (const product of products) {
        let hasChanges = false;
        const updates: { thumbnail?: string; images?: string[] } = {};

        if (product.thumbnail) {
            const newThumbnail = organizeFile(product.thumbnail, 'products');
            if (newThumbnail !== product.thumbnail) {
                updates.thumbnail = newThumbnail!;
                hasChanges = true;
            }
        }

        if (product.images && product.images.length > 0) {
            const updatedImages: string[] = [];
            let galleryChanged = false;

            for (const img of product.images) {
                const newImg = organizeFile(img, 'products');
                if (newImg !== img) {
                    galleryChanged = true;
                }
                updatedImages.push(newImg!);
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
            console.log(`   Updated database paths for product: ${product.name}`);
        }
    }

    // 3. Slides
    console.log('\n🖼️ Reorganizing Slides...');
    const slides = await prisma.slide.findMany();
    for (const slide of slides) {
        let hasChanges = false;
        const updates: { desktopImage?: string; mobileImage?: string } = {};

        if (slide.desktopImage) {
            const newDesktop = organizeFile(slide.desktopImage, 'sliders');
            if (newDesktop !== slide.desktopImage) {
                updates.desktopImage = newDesktop!;
                hasChanges = true;
            }
        }

        if (slide.mobileImage) {
            const newMobile = organizeFile(slide.mobileImage, 'sliders');
            if (newMobile !== slide.mobileImage) {
                updates.mobileImage = newMobile!;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await prisma.slide.update({
                where: { id: slide.id },
                data: updates
            });
            console.log(`   Updated database paths for slide ID: ${slide.id}`);
        }
    }

    // 4. Banners
    console.log('\n🎨 Reorganizing Banners...');
    const banners = await prisma.banner.findMany();
    for (const banner of banners) {
        let hasChanges = false;
        const updates: { desktopImage?: string; mobileImage?: string } = {};

        if (banner.desktopImage) {
            const newDesktop = organizeFile(banner.desktopImage, 'banners');
            if (newDesktop !== banner.desktopImage) {
                updates.desktopImage = newDesktop!;
                hasChanges = true;
            }
        }

        if (banner.mobileImage) {
            const newMobile = organizeFile(banner.mobileImage, 'banners');
            if (newMobile !== banner.mobileImage) {
                updates.mobileImage = newMobile!;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await prisma.banner.update({
                where: { id: banner.id },
                data: updates
            });
            console.log(`   Updated database paths for banner: ${banner.title}`);
        }
    }

    // 5. Blog Posts
    console.log('\n📝 Reorganizing Blog Posts...');
    const posts = await prisma.blogPost.findMany();
    for (const post of posts) {
        let hasChanges = false;
        const updates: { coverImage?: string; thumbnail?: string } = {};

        if (post.coverImage) {
            const newCover = organizeFile(post.coverImage, 'blog-covers');
            if (newCover !== post.coverImage) {
                updates.coverImage = newCover!;
                hasChanges = true;
            }
        }

        if (post.thumbnail) {
            const newThumbnail = organizeFile(post.thumbnail, 'blog-covers');
            if (newThumbnail !== post.thumbnail) {
                updates.thumbnail = newThumbnail!;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await prisma.blogPost.update({
                where: { id: post.id },
                data: updates
            });
            console.log(`   Updated database paths for blog post: ${post.title}`);
        }
    }

    // 6. Blog Categories
    console.log('\n📁 Reorganizing Blog Categories...');
    const blogCats = await prisma.blogCategory.findMany();
    for (const blogCat of blogCats) {
        if (blogCat.image) {
            const newUrl = organizeFile(blogCat.image, 'blog-categories');
            if (newUrl !== blogCat.image) {
                await prisma.blogCategory.update({
                    where: { id: blogCat.id },
                    data: { image: newUrl }
                });
                console.log(`   Updated database paths for blog category: ${blogCat.name}`);
            }
        }
    }

    console.log('\n========================================================================');
    console.log('🎉 Reorganization & Database migration completed successfully!');
    console.log('========================================================================');

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
