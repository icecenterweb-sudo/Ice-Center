const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const readline = require('readline');

const SKIP_TABLES = new Set(['AnalyticsEvent', 'ErrorLog', 'OtpRequest']);

const IMPORT_ORDER = [
    'User',
    'Admin',
    'Category',
    'Subcategory',
    'Product',
    'ProductVariant',
    'Campaign',
    'Offer',
    'OfferProduct',
    'Slide',
    'Banner',
    'BlogPost',
    'BlogCategory',
    'BlogTag',
    'BlogComment',
    'Order',
    'OrderItem',
    'CartItem',
    'WishlistItem',
    'Notification',
    'AuditLog',
    'SupportRoom',
    'SupportMessage',
    '_BlogPostToBlogTag',
];

async function main() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Usage: node scripts/import-ordered.js <path-to-sql-file>');
        process.exit(1);
    }

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 30000 });

    console.log(`Reading and parsing SQL file: ${sqlFile}`);
    const fileStream = fs.createReadStream(sqlFile, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const tableDataMap = new Map();
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
            }
            continue;
        }

        if (!currentTable) continue;

        if (trimmed === '\\.') {
            if (!SKIP_TABLES.has(currentTable)) {
                const rows = dataLines.filter(l => l.trim() !== '');
                tableDataMap.set(currentTable, { cols: currentCols, rows });
            }
            currentTable = null;
            dataLines = [];
            continue;
        }

        if (trimmed !== '') {
            dataLines.push(line);
        }
    }

    console.log("SQL parsed. Starting ordered import...");
    let totalRows = 0;

    for (const tableName of IMPORT_ORDER) {
        const data = tableDataMap.get(tableName);
        if (data && data.rows.length > 0) {
            console.log(`Importing ${data.rows.length} rows into ${tableName}...`);
            await bulkInsert(pool, tableName, data.cols, data.rows);
            totalRows += data.rows.length;
        }
    }

    // Also import any remaining tables not listed in IMPORT_ORDER
    for (const [tableName, data] of tableDataMap.entries()) {
        if (!IMPORT_ORDER.includes(tableName) && data.rows.length > 0) {
            console.log(`Importing remaining ${data.rows.length} rows into ${tableName}...`);
            await bulkInsert(pool, tableName, data.cols, data.rows);
            totalRows += data.rows.length;
        }
    }

    console.log(`\nImport complete! Inserted ${totalRows} total rows.`);
    await pool.end();
}

async function bulkInsert(pool, table, cols, rows) {
    const parsed = rows.map(row =>
        row.split('\t').map(col => col === '\\N' ? null : col)
    );

    const colCount = parsed[0].length;
    const rowPlaceholder = `(${Array.from({ length: colCount }, (_, i) => `$${i + 1}`).join(', ')})`;
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
            console.warn(`Batch insert failed for ${table}, falling back to row-by-row:`, e.message);
            // Fall back to single-row inserts
            for (const values of batch) {
                try {
                    await pool.query(
                        `INSERT INTO "${table}" (${cols}) VALUES ${rowPlaceholder} ON CONFLICT DO NOTHING`,
                        values
                    );
                } catch (err) {
                    console.error(`Row insert failed for ${table}:`, err.message);
                }
            }
        }
    }
}

main().catch(console.error);
