const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

const fs = require('fs');
const readline = require('readline');

async function main() {
    const rl = readline.createInterface({
        input: fs.createReadStream('backups/backup_2026-07-02_07-44-22.sql', { encoding: 'utf8' }),
        crlfDelay: Infinity
    });

    let isProductBlock = false;
    let cols = '';
    const rows = [];

    for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed.startsWith('COPY public."Product" ') && trimmed.endsWith(';')) {
            const match = trimmed.match(/^COPY public\."Product" \((.+)\) FROM stdin;$/);
            if (match) {
                cols = match[1];
                isProductBlock = true;
            }
            continue;
        }

        if (isProductBlock) {
            if (trimmed === '\\.') {
                isProductBlock = false;
                break;
            }
            if (trimmed !== '') {
                rows.push(line);
            }
        }
    }

    console.log(`Found ${rows.length} rows for Product. columns: ${cols}`);

    if (rows.length > 0) {
        const firstRow = rows[0].split('\t').map(col => col === '\\N' ? null : col);
        const placeholders = Array.from({ length: firstRow.length }, (_, i) => `$${i + 1}`).join(', ');
        
        console.log("Attempting to insert first row:");
        console.log("Values:", firstRow);

        try {
            const query = `INSERT INTO "Product" (${cols}) VALUES (${placeholders})`;
            await pool.query(query, firstRow);
            console.log("Insert succeeded!");
        } catch (e) {
            console.error("Insert failed with error:", e);
        }
    }

    await pool.end();
}

main().catch(console.error);
