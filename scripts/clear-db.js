const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

// Truncate all data tables (keep schema, wipe rows)
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
];

async function main() {
    const client = await pool.connect();
    try {
        // Disable FK checks, truncate, re-enable
        await client.query('SET CONSTRAINTS ALL DEFERRED');
        for (const table of tables) {
            try {
                await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
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
