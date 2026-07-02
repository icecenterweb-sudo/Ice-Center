/**
 * Import data from a PostgreSQL dump file (row-by-row, ON CONFLICT DO NOTHING).
 * Usage: node scripts/import-backup.js <path-to-sql-file>
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
        console.error('Usage: node scripts/import-backup.js <path-to-sql-file>');
        process.exit(1);
    }

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 30000 });
    const client = await pool.connect();

    console.log(`Reading: ${sqlFile}`);
    const fileStream = fs.createReadStream(sqlFile, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let totalRows = 0;
    let currentTable = null;
    let currentCols = null;
    let colCount = 0;
    let skippingTable = false;

    try {
        await client.query('BEGIN');

        for await (const line of rl) {
            const trimmed = line.trim();

            // Detect COPY ... FROM stdin;
            if (trimmed.startsWith('COPY public."') && trimmed.endsWith(';')) {
                const match = trimmed.match(/^COPY public\."(\w+)" \((.+)\) FROM stdin;$/);
                if (match) {
                    currentTable = match[1];
                    currentCols = match[2];
                    if (SKIP_TABLES.has(currentTable)) {
                        console.log(`  Skipping: ${currentTable}`);
                        skippingTable = true;
                        currentTable = null;
                    } else {
                        console.log(`  Importing: ${currentTable}`);
                    }
                }
                continue;
            }

            if (!currentTable) {
                // If we set currentTable to null for a skipped table,
                // we still need to skip its data until \.
                if (skippingTable) {
                    if (trimmed === '\\.') skippingTable = false;
                    continue;
                }
                continue;
            }

            // End of COPY block
            if (trimmed === '\\.') {
                currentTable = null;
                continue;
            }

            if (trimmed === '') continue;

            // Parse row
            const values = line.split('\t').map(col => col === '\\N' ? null : col);
            if (colCount === 0) colCount = values.length;

            const placeholders = Array.from({ length: values.length }, (_, i) => `$${i + 1}`).join(', ');

            try {
                await client.query(
                    `INSERT INTO "${currentTable}" (${currentCols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                    values
                );
                totalRows++;
                if (totalRows % 50 === 0) process.stdout.write('.');
            } catch (e) {
                console.error(`Error inserting into ${currentTable}:`, e.message);
            }
        }

        await client.query('COMMIT');
        console.log(`\n\nImport complete! Inserted ${totalRows} rows.`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\nImport failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
