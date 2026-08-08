import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WEBP_SOURCE_DIR = 'C:\\Users\\Hamidreza\\Downloads\\procced_images_webp';
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

async function assignImages() {
    console.log(`🚀 Starting assignment of compressed WebP images to database products...\n`);

    if (!fs.existsSync(WEBP_SOURCE_DIR)) {
        console.error(`❌ WebP folder not found: ${WEBP_SOURCE_DIR}`);
        process.exit(1);
    }

    if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
        fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(WEBP_SOURCE_DIR).filter(f => f.endsWith('.webp'));
    console.log(`📁 Found ${files.length} WebP files in downloads folder.`);

    // Group files by product number e.g. "1-1.webp", "1-2.webp" -> num = 1, images = ["1-1.webp", "1-2.webp"]
    const productImagesMap = new Map<number, string[]>();

    for (const file of files) {
        const match = file.match(/^([۰-۹0-9]+)[-_]/);
        if (match) {
            const num = parseInt(match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
            if (!productImagesMap.has(num)) {
                productImagesMap.set(num, []);
            }
            productImagesMap.get(num)!.push(file);
        }
    }

    // Sort files within each product number group (e.g. 1-1, 1-2, 1-3)
    for (const [num, imgList] of productImagesMap.entries()) {
        imgList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }

    // Copy files to public/uploads/products/ and update DB
    const parsedTxtPath = path.join(process.cwd(), 'products.txt');
    const txtContent = fs.readFileSync(parsedTxtPath, 'utf-8');
    const blocks = txtContent.split(/[-–]{4,}/).map(b => b.trim()).filter(Boolean);

    // Map item number in txt to title
    const numToTitle = new Map<number, string>();
    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;

        let num = 0;
        let titleLine = lines[0];
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/^([۰-۹0-9]+)\s*[-–]?/);
            if (m && parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10) > 0) {
                num = parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
                titleLine = lines[i];
                if ((titleLine.includes('عنوان:') || titleLine.endsWith('-')) && i + 1 < lines.length) {
                    if (!lines[i + 1].includes(':')) titleLine = lines[i + 1];
                }
                break;
            }
        }

        let cleanTitle = titleLine.replace(/^([۰-۹0-9]+)\s*[-–]?\s*/, '').replace(/^[📌📍]\s*عنوان:\s*/, '').replace(/^مشخصات\s+/, '').trim();
        if (num && cleanTitle && !numToTitle.has(num)) {
            numToTitle.set(num, cleanTitle);
        }
    }

    const dbProducts = await prisma.product.findMany({
        select: { id: true, name: true }
    });

    let updatedCount = 0;

    for (const [num, imgList] of productImagesMap.entries()) {
        const title = numToTitle.get(num);
        if (!title) {
            console.warn(`⚠️ Could not find title mapping for product #${num}`);
            continue;
        }

        // Copy files to public/uploads/products/
        const webpUrls: string[] = [];
        for (const file of imgList) {
            const srcPath = path.join(WEBP_SOURCE_DIR, file);
            const destPath = path.join(PUBLIC_UPLOADS_DIR, file);
            fs.copyFileSync(srcPath, destPath);
            webpUrls.push(`/uploads/products/${file}`);
        }

        const thumbnail = webpUrls[0] || null;

        // Find product in DB by title matching
        const cleanTitleLower = title.replace(/[\s\u200c]+/g, ' ').trim().toLowerCase();
        const product = dbProducts.find(p => {
            const pNameLower = p.name.replace(/[\s\u200c]+/g, ' ').trim().toLowerCase();
            return pNameLower.includes(cleanTitleLower.slice(0, 15)) || cleanTitleLower.includes(pNameLower.slice(0, 15));
        });

        if (product) {
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    thumbnail,
                    images: webpUrls,
                }
            });
            console.log(`🖼️ Assigned ${webpUrls.length} image(s) to Product ID ${product.id}: "${product.name}"`);
            updatedCount++;
        } else {
            console.warn(`⚠️ Product #${num} (${title}) not found in DB`);
        }
    }

    console.log(`\n========================================`);
    console.log(`✅ Image Assignment Finished!`);
    console.log(`- Updated ${updatedCount} products in DB with images`);
    console.log(`========================================\n`);

    await prisma.$disconnect();
    await pool.end();
}

assignImages().catch(console.error);
