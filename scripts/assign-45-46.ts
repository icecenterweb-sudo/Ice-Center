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

async function fix45And46() {
    const items = [
        { num: 45, search: 'ICN تک ورودی' },
        { num: 46, search: 'ICN دو دهانه' }
    ];

    for (const item of items) {
        const product = await prisma.product.findFirst({
            where: { name: { contains: item.search } }
        });

        if (!product) continue;

        const files = fs.readdirSync(SOURCE_DIR).filter(f => f.startsWith(`${item.num}-`));
        const finalWebpUrls: string[] = [];

        files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        for (const file of files) {
            const inputPath = path.join(SOURCE_DIR, file);
            const idxMatch = file.match(/[-_]([۰-۹0-9]+)\./);
            const idx = idxMatch ? idxMatch[1] : '1';
            const outputFileName = `${item.num}-${idx}.webp`;
            const outputPath = path.join(TARGET_DIR, outputFileName);
            const publicPath = path.join(PUBLIC_UPLOADS_DIR, outputFileName);

            await sharp(inputPath)
                .resize(800, 800, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .webp({ quality: 85 })
                .toFile(outputPath);

            fs.copyFileSync(outputPath, publicPath);
            finalWebpUrls.push(`/uploads/products/${outputFileName}`);
        }

        if (finalWebpUrls.length > 0) {
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    thumbnail: finalWebpUrls[0],
                    images: finalWebpUrls,
                }
            });
            console.log(`✅ Fixed Product #${item.num} [ID ${product.id}]: "${product.name}" -> ${finalWebpUrls.length} image(s)`);
        }
    }

    await prisma.$disconnect();
    await pool.end();
}

fix45And46().catch(console.error);
