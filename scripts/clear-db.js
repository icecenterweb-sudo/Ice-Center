const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
// Match the SSL handling used by backup/import scripts so this works against
// a managed VPS Postgres that requires SSL (sslmode=require in the URL).
const ssl = connectionString && connectionString.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined;

const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl,
});

// Truncate all data tables (keep schema, wipe rows).
// SiteSetting is included so a fresh backup import repopulates it cleanly —
// otherwise ON CONFLICT DO NOTHING on import would keep the old settings row.
const tables = [
    'CouponUsage', 'Coupon', 'ProductReview',
    'SupportMessage', 'SupportRoom', 'ErrorLog',
    'AnalyticsEvent', 'Notification',
    'WishlistItem', 'OrderItem', 'Order',
    'CartItem', 'Address', 'OtpRequest', 'BlogComment',
    'BlogPost', 'OfferProduct', 'Offer', 'Campaign',
    'Banner', 'Slide', 'ProductVariant', 'Product',
    'Subcategory', 'Category', 'AuditLog', 'Admin', 'User',
    '_BlogPostToBlogTag', 'BlogTag', 'BlogCategory',
    'SiteSetting',
];

async function main() {
    const client = await pool.connect();
    try {
        // Disable FK checks, truncate, re-enable
        await client.query('SET CONSTRAINTS ALL DEFERRED');
        for (const table of tables) {
            try {
                await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
                console.log(`  cleared: ${table}`);
            } catch (e) {
                console.log(`  skip: ${table} (${e.message})`);
            }
        }
        console.log('\n✅ Database cleared. Ready for backup import.');
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
