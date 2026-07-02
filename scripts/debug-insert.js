const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

// Try inserting a single Product row from the backup to see the error
const fs = require('fs');
const lines = fs.readFileSync('backups/backup_2026-07-02_07-44-22.sql', 'utf8').split('\n');

// Find the Product COPY block
let inProduct = false;
let productCols = null;
let productRow = null;

for (const line of lines) {
    if (line.startsWith('COPY public."Product"')) {
        const match = line.match(/^COPY public\."(\w+)" \((.+)\) FROM stdin;$/);
        if (match) { productCols = match[2]; inProduct = true; }
        continue;
    }
    if (inProduct) {
        if (line.trim() === '\\.') break;
        if (line.trim() !== '') { productRow = line; break; }
    }
}

if (!productRow) {
    console.error('No product data found in backup');
    process.exit(1);
}

const values = productRow.split('\t').map(col => col === '\\N' ? null : col);
const placeholders = Array.from({ length: values.length }, (_, i) => `$${i + 1}`).join(', ');

console.log('Cols:', productCols);
console.log('Values count:', values.length);
console.log('First 5 values:', values.slice(0, 5));

pool.query(
    `INSERT INTO "Product" (${productCols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING id`,
    values
).then(r => {
    console.log('Result:', r.rows);
    pool.end();
}).catch(e => {
    console.error('ERROR:', e.message);
    console.error('Code:', e.code);
    pool.end();
});
