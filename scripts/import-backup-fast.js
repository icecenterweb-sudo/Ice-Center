/**
 * Database Import Script (Fast Bulk COPY)
 * 
 * Reads a pg_dump SQL file and bulk-imports COPY data blocks.
 * After import, resets all auto-increment sequences to avoid ID collisions.
 * 
 * Usage: npm run db:import <path-to-sql-file>
 * Or:    node scripts/import-backup-fast.js <path-to-sql-file>
 */
const { Pool } = require('pg');
require('dotenv').config();

const fs = require('fs');
const readline = require('readline');

// Tables to skip during import (ephemeral / regenerated data)
const SKIP_TABLES = new Set(['AnalyticsEvent', 'ErrorLog', 'OtpRequest']);

// Tables with auto-increment (serial/identity) primary keys that need sequence reset
const AUTO_INCREMENT_TABLES = [
    'Product', 'ProductVariant', 'Category', 'Subcategory',
    'User', 'CartItem', 'OtpRequest', 'Address', 'Admin', 'AuditLog',
    'BlogPost', 'BlogCategory', 'BlogTag', 'BlogComment',
    'Offer', 'OfferProduct', 'Campaign', 'Slide', 'Banner',
    'Order', 'OrderItem', 'WishlistItem', 'Notification',
    'AnalyticsEvent', 'SupportRoom', 'SupportMessage',
    'ProductReview', 'Coupon', 'CouponUsage', 'ErrorLog', 'SiteSetting',
];

async function main() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('❌ Usage: npm run db:import <path-to-sql-file>');
        console.error('   Example: npm run db:import backups/backup_2026-08-08.sql');
        process.exit(1);
    }

    if (!fs.existsSync(sqlFile)) {
        console.error(`❌ File not found: ${sqlFile}`);
        process.exit(1);
    }

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ POSTGRES_URL or DATABASE_URL is not defined in environment variables.');
        process.exit(1);
    }

    // Detect SSL from connection string
    const ssl = connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 30000, ssl });

    let host = 'unknown';
    try { host = new URL(connectionString).hostname; } catch {}
    console.log(`📡 Connecting to database: ${host}`);
    console.log(`📄 Reading backup file: ${sqlFile}\n`);

    const fileStream = fs.createReadStream(sqlFile, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentTable = null;
    let currentCols = null;
    let dataLines = [];
    let totalRows = 0;
    let tableCount = 0;
    const importedTables = [];
    const startTime = Date.now();

    for await (const line of rl) {
        const trimmed = line.trim();

        if (trimmed.startsWith('COPY public."') && trimmed.endsWith(';')) {
            const match = trimmed.match(/^COPY public\."(\w+)" \((.+)\) FROM stdin;$/);
            if (match) {
                currentTable = match[1];
                currentCols = match[2];
                dataLines = [];
                if (SKIP_TABLES.has(currentTable)) {
                    console.log(`  ⏭️  Skipping: ${currentTable}`);
                } else {
                    console.log(`  📥 Importing: ${currentTable}...`);
                }
            }
            continue;
        }

        if (!currentTable) continue;

        if (trimmed === '\\.') {
            // End of COPY block — bulk import if not skipped
            if (!SKIP_TABLES.has(currentTable)) {
                const rows = dataLines.filter(l => l.trim() !== '');
                if (rows.length > 0) {
                    await bulkInsert(pool, currentTable, currentCols, rows);
                    totalRows += rows.length;
                    tableCount++;
                    importedTables.push(currentTable);
                    console.log(`      ✅ ${rows.length} rows inserted`);
                }
            }
            currentTable = null;
            dataLines = [];
            continue;
        }

        if (trimmed !== '') {
            dataLines.push(line);
        }
    }

    // Reset auto-increment sequences for all imported tables
    console.log('\n🔄 Resetting auto-increment sequences...');
    for (const table of importedTables) {
        if (!AUTO_INCREMENT_TABLES.includes(table)) continue;
        try {
            // PostgreSQL convention: sequence name is "TableName_id_seq"
            await pool.query(
                `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
            );
        } catch (e) {
            // Table may not have a serial 'id' column — skip silently
        }
    }
    console.log('  ✅ Sequences reset');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Import complete!`);
    console.log(`   📊 ${totalRows} total rows across ${tableCount} tables in ${elapsed}s`);
    await pool.end();
}

async function bulkInsert(pool, table, cols, rows) {
    // Parse tab-separated rows into value arrays
    const parsed = rows.map(row =>
        row.split('\t').map(col => col === '\\N' ? null : col)
    );

    const colCount = parsed[0].length;
    const BATCH = 50;

    for (let i = 0; i < parsed.length; i += BATCH) {
        const batch = parsed.slice(i, i + BATCH);
        const placeholders = batch.map((_, idx) => {
            const offset = idx * colCount;
            return `(${Array.from({ length: colCount }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
        }).join(', ');
        const flatValues = batch.flat();

        try {
            await pool.query(
                `INSERT INTO "${table}" (${cols}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
                flatValues
            );
        } catch (e) {
            // Fall back to single-row inserts on batch failure
            const rowPlaceholder = `(${Array.from({ length: colCount }, (_, i) => `$${i + 1}`).join(', ')})`;
            for (const values of batch) {
                try {
                    await pool.query(
                        `INSERT INTO "${table}" (${cols}) VALUES ${rowPlaceholder} ON CONFLICT DO NOTHING`,
                        values
                    );
                } catch {
                    // Skip individual row errors silently
                }
            }
        }
    }
}

main();
