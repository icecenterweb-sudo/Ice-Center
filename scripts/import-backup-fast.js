/**
 * Database Import Script (Prisma-based, handles JSON backups)
 * 
 * Reads a backup JSON file and imports all tables using Prisma.
 * Also supports legacy pg_dump SQL files (COPY block parsing).
 * After import, resets all auto-increment sequences.
 * 
 * Usage: npm run db:import <path-to-backup-file>
 * Or:    node scripts/import-backup-fast.js backups/backup_2026-08-08.json
 */
const { Pool } = require('pg');
const path = require('path');

// Load .env from the project root by absolute path — dotenv otherwise looks in
// the current working directory, which leaves the connection string undefined
// ("SASL: client password must be a string") when launched from elsewhere.
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
    // dotenv not installed (production-only deps) — rely on the shell/PM2 env.
}

const fs = require('fs');
const readline = require('readline');

// Tables to skip during import (ephemeral data)
const SKIP_TABLES = new Set(['AnalyticsEvent', 'ErrorLog', 'OtpRequest']);

// Import order (parents before children to respect FK constraints)
const IMPORT_ORDER = [
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

async function main() {
    const backupFile = process.argv[2];
    if (!backupFile) {
        console.error('❌ Usage: npm run db:import <path-to-backup-file>');
        console.error('   Example: npm run db:import backups/backup_2026-08-08.json');
        process.exit(1);
    }

    if (!fs.existsSync(backupFile)) {
        console.error(`❌ File not found: ${backupFile}`);
        process.exit(1);
    }

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ POSTGRES_URL or DATABASE_URL is not defined.');
        process.exit(1);
    }

    const ssl = connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 30000, ssl });

    let host = 'unknown';
    try { host = new URL(connectionString).hostname; } catch {}
    console.log(`📡 Connecting to: ${host}`);
    console.log(`📄 Reading: ${backupFile}\n`);

    const isJson = backupFile.endsWith('.json');
    const startTime = Date.now();
    let totalRows = 0;
    let tableCount = 0;

    if (isJson) {
        // ========================
        // JSON backup import
        // ========================
        const raw = fs.readFileSync(backupFile, 'utf-8');
        const backup = JSON.parse(raw);

        // Import in dependency order
        for (const table of IMPORT_ORDER) {
            if (!backup[table] || backup[table].length === 0) continue;
            if (SKIP_TABLES.has(table)) {
                console.log(`  ⏭️  Skipping: ${table}`);
                continue;
            }

            const rows = backup[table];
            console.log(`  📥 Importing: ${table} (${rows.length} rows)...`);

            const BATCH = 50;
            let inserted = 0;
            let failed = 0;
            let firstError = null;

            for (let i = 0; i < rows.length; i += BATCH) {
                const batch = rows.slice(i, i + BATCH);

                for (const row of batch) {
                    // Build column names and values from the JSON object
                    const cols = Object.keys(row);
                    const vals = Object.values(row);
                    const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
                    const colNames = cols.map(c => `"${c}"`).join(', ');

                    try {
                        await pool.query(
                            `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                            vals
                        );
                        inserted++;
                    } catch (e) {
                        // A genuine failure (FK violation, type/column mismatch) — NOT a
                        // conflict, since ON CONFLICT DO NOTHING doesn't throw. Surface it
                        // instead of silently dropping the row.
                        failed++;
                        if (!firstError) firstError = e.message;
                    }
                }
            }

            totalRows += inserted;
            tableCount++;
            if (failed > 0) {
                console.log(`      ✅ ${inserted} inserted, ⚠️  ${failed} FAILED — first error: ${firstError}`);
            } else {
                console.log(`      ✅ ${inserted} rows inserted`);
            }
        }

        // Also import any tables in backup not in IMPORT_ORDER
        for (const table of Object.keys(backup)) {
            if (IMPORT_ORDER.includes(table) || SKIP_TABLES.has(table)) continue;
            if (!backup[table] || backup[table].length === 0) continue;

            const rows = backup[table];
            console.log(`  📥 Importing: ${table} (${rows.length} rows)...`);
            let inserted = 0;
            let failed = 0;
            let firstError = null;

            for (const row of rows) {
                const cols = Object.keys(row);
                const vals = Object.values(row);
                const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
                const colNames = cols.map(c => `"${c}"`).join(', ');

                try {
                    await pool.query(
                        `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                        vals
                    );
                    inserted++;
                } catch (e) {
                    failed++;
                    if (!firstError) firstError = e.message;
                }
            }

            totalRows += inserted;
            tableCount++;
            if (failed > 0) {
                console.log(`      ✅ ${inserted} inserted, ⚠️  ${failed} FAILED — first error: ${firstError}`);
            } else {
                console.log(`      ✅ ${inserted} rows inserted`);
            }
        }
    } else {
        // ========================
        // Legacy SQL (pg_dump) import
        // ========================
        const fileStream = fs.createReadStream(backupFile, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let currentTable = null;
        let currentCols = null;
        let dataLines = [];

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
                if (!SKIP_TABLES.has(currentTable)) {
                    const rows = dataLines.filter(l => l.trim() !== '');
                    if (rows.length > 0) {
                        await bulkInsert(pool, currentTable, currentCols, rows);
                        totalRows += rows.length;
                        tableCount++;
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
    }

    // Reset auto-increment sequences
    console.log('\n🔄 Resetting auto-increment sequences...');
    const seqQuery = `
        SELECT c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
    `;
    try {
        const { rows: tables } = await pool.query(seqQuery);
        for (const { table_name } of tables) {
            try {
                await pool.query(
                    `SELECT setval(pg_get_serial_sequence('"${table_name}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table_name}"), 0) + 1, false)`
                );
            } catch {
                // Table may not have a serial 'id' column
            }
        }
        console.log('  ✅ Sequences reset');
    } catch (e) {
        console.log('  ⚠️  Could not reset sequences:', e.message);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Import complete!`);
    console.log(`   📊 ${totalRows} total rows across ${tableCount} tables in ${elapsed}s`);
    await pool.end();
}

async function bulkInsert(pool, table, cols, rows) {
    let droppedRows = 0;
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
        } catch {
            const rowPlaceholder = `(${Array.from({ length: colCount }, (_, i) => `$${i + 1}`).join(', ')})`;
            for (const values of batch) {
                try {
                    await pool.query(
                        `INSERT INTO "${table}" (${cols}) VALUES ${rowPlaceholder} ON CONFLICT DO NOTHING`,
                        values
                    );
                } catch (err) {
                    droppedRows++;
                    console.error(`[import] row dropped in ${table}:`, err.message);
                }
            }
        }
    }
    if (droppedRows > 0) {
        console.log(`  ⚠️  ${droppedRows} rows dropped in ${table} (see errors above)`);
    }
}

main();
