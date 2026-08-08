/**
 * Database Backup Script (Prisma-based, no pg_dump required)
 * 
 * Exports all database tables to a timestamped JSON file.
 * Works on any machine — only needs a database connection.
 * 
 * Run with: npm run db:backup
 * Or: npx tsx scripts/backup-db.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Tables to skip (ephemeral data that doesn't need backup)
const SKIP_TABLES = ['AnalyticsEvent', 'ErrorLog', 'OtpRequest'];

// All tables in dependency order (parents before children)
const TABLE_ORDER = [
    'SiteSetting',
    'Category',
    'Subcategory',
    'Product',
    'ProductVariant',
    'User',
    'Address',
    'CartItem',
    'WishlistItem',
    'Admin',
    'AuditLog',
    'BlogCategory',
    'BlogTag',
    'BlogPost',
    'BlogComment',
    'Offer',
    'OfferProduct',
    'Campaign',
    'Slide',
    'Banner',
    'Order',
    'OrderItem',
    'Notification',
    'SupportRoom',
    'SupportMessage',
    'ProductReview',
    'Coupon',
    'CouponUsage',
];

async function runBackup() {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ POSTGRES_URL or DATABASE_URL is not defined.');
        process.exit(1);
    }

    let host = 'unknown';
    try { host = new URL(connectionString).hostname; } catch {}

    console.log('🔄 Initializing database backup...');
    console.log(`📡 Connecting to: ${host}`);

    const ssl = connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000, ssl });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    // Create backups directory
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const filename = `backup_${timestamp}.json`;
    const outputPath = path.join(backupsDir, filename);

    const backup: Record<string, unknown[]> = {};
    let totalRows = 0;
    const startTime = Date.now();

    for (const table of TABLE_ORDER) {
        if (SKIP_TABLES.includes(table)) {
            console.log(`  ⏭️  Skipping: ${table}`);
            continue;
        }

        try {
            // Use Prisma's dynamic model access
            const modelName = table.charAt(0).toLowerCase() + table.slice(1);
            const data = await (prisma as any)[modelName].findMany();
            backup[table] = data;
            totalRows += data.length;
            console.log(`  📥 ${table}: ${data.length} rows`);
        } catch (err: any) {
            console.log(`  ⚠️  ${table}: ${err.message?.slice(0, 80) || 'error'}`);
        }
    }

    // Write JSON backup
    fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf-8');

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ Backup completed!`);
    console.log(`📄 File: ${path.relative(process.cwd(), outputPath)} (${sizeMB} MB)`);
    console.log(`📊 ${totalRows} total rows across ${Object.keys(backup).length} tables in ${elapsed}s`);

    await prisma.$disconnect();
    await pool.end();
}

runBackup();
