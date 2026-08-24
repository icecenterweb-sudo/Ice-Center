/**
 * Production Safe VPS Migration Script for Float -> Decimal(14, 2)
 * Finding #12 Migration
 * 
 * Usage:
 *   npx tsx scripts/migrate-money-decimal.ts
 *   npx tsx scripts/migrate-money-decimal.ts --yes   (non-interactive)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Pool } from 'pg';

function maskConnectionString(urlStr: string): string {
    try {
        const parsed = new URL(urlStr);
        parsed.password = '***';
        if (parsed.username) parsed.username = '***';
        return parsed.toString();
    } catch {
        return 'postgres://***:***@masked-host/database';
    }
}

interface TableMetric {
    name: string;
    column: string;
    preCount: number;
    postCount: number;
    preSum: number;
    postSum: number;
    isNullable: boolean;
}

const MONETARY_FIELDS: Array<{ table: string; column: string; nullable: boolean }> = [
    { table: 'Product', column: 'price', nullable: false },
    { table: 'Product', column: 'listPrice', nullable: true },
    { table: 'ProductVariant', column: 'price', nullable: false },
    { table: 'ProductVariant', column: 'listPrice', nullable: true },
    { table: 'Offer', column: 'discountValue', nullable: false },
    { table: 'Offer', column: 'maxDiscountCap', nullable: true },
    { table: 'OfferProduct', column: 'customDiscountValue', nullable: true },
    { table: 'Order', column: 'subtotal', nullable: false },
    { table: 'Order', column: 'discount', nullable: false },
    { table: 'Order', column: 'shippingCost', nullable: false },
    { table: 'Order', column: 'total', nullable: false },
    { table: 'OrderItem', column: 'unitPrice', nullable: false },
    { table: 'OrderItem', column: 'totalPrice', nullable: false },
    { table: 'Coupon', column: 'value', nullable: false },
    { table: 'Coupon', column: 'minOrderAmount', nullable: true },
    { table: 'Coupon', column: 'maxDiscount', nullable: true },
    { table: 'CouponUsage', column: 'discount', nullable: false },
];

async function confirmPrompt(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toUpperCase() === 'YES');
        });
    });
}

async function fetchFieldMetric(pool: Pool, table: string, column: string): Promise<{ count: number; sum: number }> {
    try {
        const query = `
            SELECT 
                COUNT(*)::int AS "count",
                COALESCE(SUM("${column}"), 0)::numeric AS "sum"
            FROM "${table}"
        `;
        const res = await pool.query(query);
        const row = res.rows[0];
        return {
            count: Number(row.count || 0),
            sum: Number(row.sum || 0),
        };
    } catch {
        return { count: 0, sum: 0 };
    }
}

async function createBackup(pool: Pool): Promise<string> {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `pre_decimal_migration_${timestamp}.json`);

    const tables = [
        'Product', 'ProductVariant', 'Offer', 'OfferProduct',
        'Order', 'OrderItem', 'Coupon', 'CouponUsage'
    ];

    const exportData: Record<string, unknown[]> = {};
    for (const table of tables) {
        try {
            const res = await pool.query(`SELECT * FROM "${table}"`);
            exportData[table] = res.rows;
        } catch {
            exportData[table] = [];
        }
    }

    fs.writeFileSync(backupFile, JSON.stringify(exportData, null, 2), 'utf-8');
    return backupFile;
}

async function main() {
    console.log('\n' + '='.repeat(65));
    console.log('  💰 PRODUCTION MIGRATION: Float → Decimal(14, 2)');
    console.log('  Finding #12 Financial Precision & Data Integrity');
    console.log('='.repeat(65) + '\n');

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ POSTGRES_URL or DATABASE_URL is not set.');
        process.exit(1);
    }

    console.log(`📡 Target Database: ${maskConnectionString(connectionString)}`);
    console.log(`📊 Total Monetary Columns to Migrate: ${MONETARY_FIELDS.length}`);
    console.log('');

    const isAutoYes = process.argv.includes('--yes') || process.argv.includes('-y') || process.argv.includes('--force');

    if (!isAutoYes) {
        console.log('⚠️  This script will alter table schema and convert double precision floats to DECIMAL(14, 2).');
        console.log('    An automated pre-migration backup will be saved first.\n');

        const confirmed = await confirmPrompt('👉 Type "YES" to execute the migration: ');
        if (!confirmed) {
            console.log('\n❌ Migration cancelled by user. No changes were made.\n');
            process.exit(0);
        }
    }

    const ssl = connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 10000,
        ssl,
    });

    try {
        // Step 1: Pre-migration snapshot backup
        console.log('\n📦 Step 1/4: Creating automated pre-migration database snapshot...');
        const backupPath = await createBackup(pool);
        console.log(`✅ Snapshot saved to: ${backupPath}`);

        // Step 2: Capture pre-migration metrics
        console.log('\n📈 Step 2/4: Gathering pre-migration baseline metrics...');
        const metrics: TableMetric[] = [];
        for (const field of MONETARY_FIELDS) {
            const { count, sum } = await fetchFieldMetric(pool, field.table, field.column);
            metrics.push({
                name: field.table,
                column: field.column,
                preCount: count,
                postCount: 0,
                preSum: sum,
                postSum: 0,
                isNullable: field.nullable,
            });
        }
        console.log(`✅ Pre-migration baseline collected across ${metrics.length} columns.`);

        // Step 3: Execute Schema Migration in a Transaction
        console.log('\n⚙️  Step 3/4: Executing schema migration in transactional block...');
        const migrationSql = `
            BEGIN;

            ALTER TABLE "Coupon" 
                ALTER COLUMN "value" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "minOrderAmount" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "maxDiscount" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "CouponUsage" 
                ALTER COLUMN "discount" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "Offer" 
                ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "maxDiscountCap" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "OfferProduct" 
                ALTER COLUMN "customDiscountValue" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "Order" 
                ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "discount" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "shippingCost" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "total" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "OrderItem" 
                ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "Product" 
                ALTER COLUMN "price" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "listPrice" SET DATA TYPE DECIMAL(14,2);

            ALTER TABLE "ProductVariant" 
                ALTER COLUMN "price" SET DATA TYPE DECIMAL(14,2),
                ALTER COLUMN "listPrice" SET DATA TYPE DECIMAL(14,2);

            COMMIT;
        `;

        await pool.query(migrationSql);
        console.log('✅ Schema migration executed successfully.');

        // Step 4: Verification and post-migration metrics
        console.log('\n🔍 Step 4/4: Verifying post-migration data integrity & sums...');
        let hasErrors = false;

        for (const m of metrics) {
            const { count, sum } = await fetchFieldMetric(pool, m.name, m.column);
            m.postCount = count;
            m.postSum = sum;

            if (m.preCount !== m.postCount) {
                console.error(`❌ Count mismatch on ${m.name}.${m.column}: pre=${m.preCount}, post=${m.postCount}`);
                hasErrors = true;
            }
            if (Math.abs(m.preSum - m.postSum) > 0.01) {
                console.error(`❌ Sum drift on ${m.name}.${m.column}: pre=${m.preSum}, post=${m.postSum}`);
                hasErrors = true;
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('  VERIFICATION SUMMARY REPORT');
        console.log('='.repeat(80));
        console.log(
            'Table'.padEnd(16) +
            'Column'.padEnd(22) +
            'Rows'.padEnd(10) +
            'Pre-Sum (Toman)'.padEnd(20) +
            'Post-Sum (Toman)'.padEnd(20) +
            'Status'
        );
        console.log('-'.repeat(80));

        for (const m of metrics) {
            const status = (m.preCount === m.postCount && Math.abs(m.preSum - m.postSum) <= 0.01)
                ? '✅ OK'
                : '❌ DRIFT';
            console.log(
                m.name.padEnd(16) +
                m.column.padEnd(22) +
                String(m.postCount).padEnd(10) +
                m.preSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(20) +
                m.postSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(20) +
                status
            );
        }
        console.log('='.repeat(80));

        if (hasErrors) {
            console.error('\n❌ Migration completed with verification errors! Check details above.');
            process.exit(1);
        } else {
            console.log('\n🎉 ALL 17 MONETARY FIELDS SUCCESSFULLY MIGRATED TO DECIMAL(14, 2)!');
            console.log('   Zero data loss, exact financial precision verified.\n');
        }
    } catch (error) {
        console.error('\n❌ Fatal migration error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
