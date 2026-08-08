/**
 * Server Diagnostic Script
 * 
 * Run on VPS or local machine to inspect DB status, missing images, upload folder integrity, and environment vars.
 * 
 * Usage on VPS:
 *   npx tsx scripts/diagnose-server.ts
 *   OR
 *   node scripts/diagnose-server.js
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

async function diagnose() {
    console.log('====================================================');
    console.log('🔍 ICE CENTER — SERVER & DATABASE DIAGNOSTIC REPORT');
    console.log('====================================================\n');

    // 1. Environment & Database Connection
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ CRITICAL: POSTGRES_URL or DATABASE_URL is not set in environment!');
        process.exit(1);
    }

    let host = 'unknown';
    try { host = new URL(databaseUrl).hostname; } catch {}
    console.log(`📡 Database Host: ${host}`);
    console.log(`🌐 Node Environment: ${process.env.NODE_ENV || 'development'}\n`);

    const ssl = databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
    const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 10000, ssl });

    try {
        const client = await pool.connect();
        console.log('✅ Database connection: SUCCESSFUL\n');
        client.release();
    } catch (err: any) {
        console.error('❌ Database connection FAILED:', err.message);
        process.exit(1);
    }

    // 2. Table Row Counts
    console.log('--- 📊 DATABASE TABLE SUMMARY ---');
    const tables = ['Product', 'Category', 'Subcategory', 'Slide', 'Banner', 'Offer', 'User', 'Admin', 'SiteSetting'];
    for (const table of tables) {
        try {
            const res = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`  • ${table}: ${res.rows[0].count} rows`);
        } catch (e: any) {
            console.log(`  • ${table}: ⚠️ Error reading table (${e.message})`);
        }
    }

    // 3. Inspect Uploads Folder on Server
    console.log('\n--- 📁 PUBLIC UPLOADS FOLDER CHECK ---');
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    
    if (!fs.existsSync(publicDir)) {
        console.log('⚠️ /public directory does NOT exist!');
    } else if (!fs.existsSync(uploadsDir)) {
        console.log('❌ /public/uploads directory does NOT exist on this server!');
        console.log('💡 Fix: Create /public/uploads/ and copy image assets to it.');
    } else {
        const files = getAllFiles(uploadsDir);
        console.log(`✅ /public/uploads directory EXISTS.`);
        console.log(`   Total files inside /public/uploads: ${files.length} files`);
        if (files.length > 0) {
            console.log(`   Sample files:`);
            files.slice(0, 5).forEach(f => console.log(`     - ${path.relative(publicDir, f)}`));
        }
    }

    // 4. Inspect Product Images & Missing Paths
    console.log('\n--- 🖼️ PRODUCT IMAGE PATH DIAGNOSTIC ---');
    try {
        const productsRes = await pool.query(`SELECT id, name, slug, thumbnail, images FROM "Product" WHERE "isActive" = true LIMIT 50`);
        const products = productsRes.rows;

        let totalProducts = products.length;
        let withThumbnail = 0;
        let withImages = 0;
        let missingLocalFiles: string[] = [];
        let externalUrls: string[] = [];

        for (const p of products) {
            if (p.thumbnail) withThumbnail++;
            if (p.images && p.images.length > 0) withImages++;

            const allPaths = [p.thumbnail, ...(p.images || [])].filter(Boolean);
            for (const imgPath of allPaths) {
                if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
                    if (!externalUrls.includes(imgPath)) externalUrls.push(imgPath);
                } else if (imgPath.startsWith('/')) {
                    const localFilePath = path.join(publicDir, imgPath);
                    if (!fs.existsSync(localFilePath)) {
                        if (!missingLocalFiles.includes(imgPath)) missingLocalFiles.push(imgPath);
                    }
                }
            }
        }

        console.log(`  • Active Products Analyzed: ${totalProducts}`);
        console.log(`  • Products with Thumbnail: ${withThumbnail}/${totalProducts}`);
        console.log(`  • Products with Gallery Images: ${withImages}/${totalProducts}`);
        console.log(`  • External Image URLs (Cloudinary/CDN): ${externalUrls.length}`);

        if (missingLocalFiles.length > 0) {
            console.log(`\n  ❌ MISSING LOCAL IMAGE FILES (${missingLocalFiles.length} missing):`);
            missingLocalFiles.slice(0, 10).forEach(file => {
                console.log(`     - ${file}  <-- File not found in public/ directory!`);
            });
            if (missingLocalFiles.length > 10) {
                console.log(`     ... and ${missingLocalFiles.length - 10} more.`);
            }
            console.log('\n  💡 REASON: These product image files are referenced in DB but missing from the server filesystem.');
            console.log('     SOLUTION: Copy your local /public/uploads/ folder to the VPS!');
        } else {
            console.log(`  ✅ All referenced local product image files exist on disk!`);
        }
    } catch (e: any) {
        console.error('❌ Error checking product images:', e.message);
    }

    // 5. Inspect Banners & Slides
    console.log('\n--- 🎨 BANNERS & SLIDES IMAGE CHECK ---');
    try {
        const slides = (await pool.query(`SELECT id, title, "desktopImage", "mobileImage" FROM "Slide" WHERE "isActive" = true`)).rows;
        const banners = (await pool.query(`SELECT id, title, "desktopImage", "mobileImage" FROM "Banner" WHERE "isActive" = true`)).rows;

        console.log(`  • Active Slides: ${slides.length}`);
        slides.forEach(s => {
            const deskExists = s.desktopImage?.startsWith('/') ? fs.existsSync(path.join(publicDir, s.desktopImage)) : true;
            const mobExists = s.mobileImage?.startsWith('/') ? fs.existsSync(path.join(publicDir, s.mobileImage)) : true;
            console.log(`    - Slide #${s.id} (${s.title || 'Untitled'}):`);
            console.log(`        desktop: ${s.desktopImage} [${deskExists ? '✅ OK' : '❌ MISSING ON DISK'}]`);
            console.log(`        mobile:  ${s.mobileImage} [${mobExists ? '✅ OK' : '❌ MISSING ON DISK'}]`);
        });

        console.log(`  • Active Banners: ${banners.length}`);
        banners.forEach(b => {
            const deskExists = b.desktopImage?.startsWith('/') ? fs.existsSync(path.join(publicDir, b.desktopImage)) : true;
            const mobExists = b.mobileImage?.startsWith('/') ? fs.existsSync(path.join(publicDir, b.mobileImage)) : true;
            console.log(`    - Banner #${b.id} (${b.title || 'Untitled'}):`);
            console.log(`        desktop: ${b.desktopImage} [${deskExists ? '✅ OK' : '❌ MISSING ON DISK'}]`);
            console.log(`        mobile:  ${b.mobileImage} [${mobExists ? '✅ OK' : '❌ MISSING ON DISK'}]`);
        });
    } catch (e: any) {
        console.error('❌ Error checking slides/banners:', e.message);
    }

    console.log('\n====================================================');
    console.log('🏁 DIAGNOSTIC COMPLETE');
    console.log('====================================================\n');

    await pool.end();
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        });
    } catch {}
    return arrayOfFiles;
}

diagnose();
