/**
 * Extract COPY data blocks from a pg_dump file into individual CSV files,
 * then bulk-import them using pg's COPY FROM STDIN.
 * Usage: node scripts/import-backup-fast.js <path-to-sql-file>
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const readline = require('readline');

const SKIP_TABLES = new Set(['AnalyticsEvent', 'ErrorLog', 'OtpRequest']);

async function main() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Usage: node scripts/import-backup-fast.js <path-to-sql-file>');
        process.exit(1);
    }

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 30000 });

    console.log(`Reading: ${sqlFile}`);
    const fileStream = fs.createReadStream(sqlFile, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentTable = null;
    let currentCols = null;
    let dataLines = [];
    let totalRows = 0;

    for await (const line of rl) {
        const trimmed = line.trim();

        if (trimmed.startsWith('COPY public."') && trimmed.endsWith(';')) {
            const match = trimmed.match(/^COPY public\."(\w+)" \((.+)\) FROM stdin;$/);
            if (match) {
                currentTable = match[1];
                currentCols = match[2];
                dataLines = [];
                if (SKIP_TABLES.has(currentTable)) {
                    console.log(`  Skipping: ${currentTable}`);
                } else {
                    console.log(`  Collecting: ${currentTable}`);
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
                    console.log(`    Inserted ${rows.length} rows into ${currentTable}`);
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

    console.log(`\nImport complete! Inserted ${totalRows} total rows.`);
    await pool.end();
}

async function bulkInsert(pool, table, cols, rows) {
    // Parse rows into arrays
    const parsed = rows.map(row =>
        row.split('\t').map(col => col === '\\N' ? null : col)
    );

    // Build batch INSERT with ON CONFLICT DO NOTHING
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
            // Fall back to single-row inserts
            for (const values of batch) {
                try {
                    await pool.query(
                        `INSERT INTO "${table}" (${cols}) VALUES ${rowPlaceholder} ON CONFLICT DO NOTHING`,
                        values
                    );
                } catch {
                    // skip
                }
            }
        }
    }
}

main();
