const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

async function main() {
    console.log("=== Checking Categories ===");
    const cats = await pool.query('SELECT id, name, slug FROM "Category"');
    console.log(cats.rows);

    console.log("\n=== Checking Subcategories ===");
    const subcats = await pool.query('SELECT id, name, slug, "categoryId" FROM "Subcategory"');
    console.log(subcats.rows);

    console.log("\n=== Checking Products ===");
    const products = await pool.query('SELECT id, name, slug, "isActive", "subcategoryId" FROM "Product"');
    console.log(products.rows);

    await pool.end();
}

main().catch(e => {
    console.error(e);
    pool.end();
});
