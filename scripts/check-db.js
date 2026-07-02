const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

pool.query(`
    SELECT
        (SELECT COUNT(*) FROM "Slide") as slides,
        (SELECT COUNT(*) FROM "Category") as categories,
        (SELECT COUNT(*) FROM "Product") as products,
        (SELECT COUNT(*) FROM "Subcategory") as subcategories,
        (SELECT COUNT(*) FROM "User") as users,
        (SELECT COUNT(*) FROM "Admin") as admins,
        (SELECT COUNT(*) FROM "Offer") as offers,
        (SELECT COUNT(*) FROM "OfferProduct") as offer_products,
        (SELECT COUNT(*) FROM "ProductVariant") as variants,
        (SELECT COUNT(*) FROM "BlogPost") as posts,
        (SELECT COUNT(*) FROM "Banner") as banners,
        (SELECT COUNT(*) FROM "CartItem") as cart_items,
        (SELECT COUNT(*) FROM "WishlistItem") as wishlist,
        (SELECT COUNT(*) FROM "AuditLog") as audit_logs
`).then(r => {
    console.log('DB counts:', r.rows[0]);
    pool.end();
    process.exit(0);
}).catch(e => {
    console.error('DB ERROR:', e.message);
    pool.end();
    process.exit(1);
});
