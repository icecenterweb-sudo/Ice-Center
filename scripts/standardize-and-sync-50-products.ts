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

const SOURCE_DIR = 'C:\\Users\\Hamidreza\\Downloads\\procced_images';
const TARGET_DIR = 'C:\\Users\\Hamidreza\\Downloads\\procced_images_standardized';
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

// Standard canvas size for all product images
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

function cleanStr(s: string): string {
    return s.replace(/^مشخصات\s+/, '').replace(/^📌\s*عنوان:\s*/, '').replace(/^📍\s*عنوان:\s*/, '').trim();
}

/**
 * Reads products.txt and returns mapping of item number (#1 to #50) -> cleanTitle
 */
function parseTxtMapping(): Map<number, string> {
    const filePath = path.join(process.cwd(), 'products.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = content.split(/[-–]{4,}/).map(b => b.trim()).filter(Boolean);

    const mapping = new Map<number, string>();
    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;

        let itemNum = 0;
        let titleLine = lines[0];
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/^([۰-۹0-9]+)\s*[-–]?/);
            if (m && parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10) > 0) {
                itemNum = parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
                titleLine = lines[i];
                if ((titleLine.includes('عنوان:') || titleLine.endsWith('-')) && i + 1 < lines.length) {
                    if (!lines[i + 1].includes(':')) titleLine = lines[i + 1];
                }
                break;
            }
        }

        let rawTitle = titleLine.replace(/^([۰-۹0-9]+)\s*[-–]?\s*/, '').trim();
        rawTitle = cleanStr(rawTitle);

        if (!rawTitle) {
            for (const l of lines) {
                if (!l.includes(':') && !l.startsWith('📌') && !l.startsWith('📍')) {
                    rawTitle = cleanStr(l.replace(/^([۰-۹0-9]+)\s*[-–]?\s*/, ''));
                    if (rawTitle) break;
                }
            }
        }

        if (itemNum && rawTitle && !mapping.has(itemNum)) {
            mapping.set(itemNum, rawTitle);
        }
    }

    return mapping;
}

async function main() {
    console.log(`🖼️ Standardizing images to uniform square size (${CANVAS_WIDTH}x${CANVAS_HEIGHT} px WebP)...\n`);

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }
    if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
        fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
    }

    const txtMapping = parseTxtMapping();
    console.log(`📋 Loaded ${txtMapping.size} item mappings from products.txt\n`);

    const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    });

    console.log(`📂 Found ${sourceFiles.length} source images in ${SOURCE_DIR}\n`);

    // Group source files by product number e.g. "1-1.png", "1-2.png" -> 1
    // Also track sub-index e.g. 1-1 -> index 1, 1-2 -> index 2
    const productImagesMap = new Map<number, Map<number, string>>();

    for (const file of sourceFiles) {
        const match = file.match(/^([۰-۹0-9]+)[-_]([۰-۹0-9]+)/);
        if (match) {
            const num = parseInt(match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
            const idx = parseInt(match[2].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);

            if (!productImagesMap.has(num)) {
                productImagesMap.set(num, new Map<number, string>());
            }

            // Prefer PNG or larger file if duplicate index
            const group = productImagesMap.get(num)!;
            if (!group.has(idx) || file.endsWith('.png')) {
                group.set(idx, file);
            }
        }
    }

    // Fetch all products from DB for matching
    const dbProducts = await prisma.product.findMany({
        select: { id: true, name: true, brand: true, model: true }
    });

    let processedImageCount = 0;
    let updatedProductCount = 0;

    for (let num = 1; num <= 50; num++) {
        const itemTitle = txtMapping.get(num);
        const imagesGroup = productImagesMap.get(num);

        if (!itemTitle) {
            console.warn(`⚠️ Item #${num} title not found in products.txt`);
            continue;
        }

        // Find corresponding product in DB by exact name match
        const cleanTitleLower = itemTitle.replace(/[\s\u200c]+/g, ' ').trim().toLowerCase();
        const dbProduct = dbProducts.find(p => {
            const pNameLower = p.name.replace(/[\s\u200c]+/g, ' ').trim().toLowerCase();
            return pNameLower === cleanTitleLower;
        });

        if (!dbProduct) {
            console.warn(`⚠️ Product #${num} (${itemTitle}) not found in database`);
            continue;
        }

        if (!imagesGroup || imagesGroup.size === 0) {
            console.log(`ℹ️ Product #${num} (${dbProduct.name}) has no images in downloads folder.`);
            continue;
        }

        const sortedIndexes = Array.from(imagesGroup.keys()).sort((a, b) => a - b);
        const finalWebpUrls: string[] = [];

        for (const idx of sortedIndexes) {
            const sourceFile = imagesGroup.get(idx)!;
            const inputPath = path.join(SOURCE_DIR, sourceFile);

            const outputFileName = `${num}-${idx}.webp`;
            const outputPath = path.join(TARGET_DIR, outputFileName);
            const publicPath = path.join(PUBLIC_UPLOADS_DIR, outputFileName);

            // Resize & pad to uniform 800x800 square with white background
            await sharp(inputPath)
                .resize(CANVAS_WIDTH, CANVAS_HEIGHT, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .webp({ quality: 85, effort: 6 })
                .toFile(outputPath);

            // Copy to public/uploads/products/
            fs.copyFileSync(outputPath, publicPath);

            const webpUrl = `/uploads/products/${outputFileName}`;
            finalWebpUrls.push(webpUrl);
            processedImageCount++;
        }

        const thumbnail = finalWebpUrls[0] || null;

        // Update DB
        await prisma.product.update({
            where: { id: dbProduct.id },
            data: {
                thumbnail,
                images: finalWebpUrls,
            }
        });

        console.log(`✅ Product #${num} [ID ${dbProduct.id}]: "${dbProduct.name}" -> Assigned ${finalWebpUrls.length} standardized image(s) (${finalWebpUrls.join(', ')})`);
        updatedProductCount++;
    }

    console.log(`\n========================================`);
    console.log(`🎉 Standardizing & Image Assignment Complete!`);
    console.log(`- Total Images Standardized (800x800 WebP): ${processedImageCount}`);
    console.log(`- Total DB Products Updated: ${updatedProductCount}`);
    console.log(`========================================\n`);

    await prisma.$disconnect();
    await pool.end();
}

main().catch(err => {
    console.error('Fatal error during standardization:', err);
    process.exit(1);
});
