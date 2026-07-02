const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

pool.query('SELECT id, name, slug FROM "Product" LIMIT 5').then(r => {
    console.log('Products:', r.rows);
    return pool.query('SELECT id, "order", "position" FROM "Banner" LIMIT 5');
}).then(r => {
    console.log('Banners:', r.rows);
    return pool.query('SELECT id, "productId", "offerId" FROM "OfferProduct" LIMIT 5');
}).then(r => {
    console.log('OfferProducts:', r.rows);
    return pool.query('SELECT id, "productId", name FROM "ProductVariant" LIMIT 5');
}).then(r => {
    console.log('Variants:', r.rows);
    return pool.query('SELECT id, "productId", "userId", quantity FROM "CartItem" LIMIT 5');
}).then(r => {
    console.log('CartItems:', r.rows);
    return pool.query('SELECT id, "userId", "productId" FROM "WishlistItem" LIMIT 5');
}).then(r => {
    console.log('Wishlist:', r.rows);
    pool.end();
}).catch(e => {
    console.error('ERROR:', e.message);
    pool.end();
});
