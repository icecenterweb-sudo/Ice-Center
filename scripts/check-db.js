const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

pool.query(`
    SELECT
        (SELECT COUNT(*) FROM "Slide") as slides,
        (SELECT COUNT(*) FROM "Category") as categories,
        (SELECT COUNT(*) FROM "Product") as products,
        (SELECT COUNT(*) FROM "User") as users,
        (SELECT COUNT(*) FROM "Offer") as offers,
        (SELECT COUNT(*) FROM "BlogPost") as posts
`).then(r => {
    console.log('DB counts:', r.rows[0]);
    pool.end();
    process.exit(0);
}).catch(e => {
    console.error('DB ERROR:', e.message);
    pool.end();
    process.exit(1);
});
