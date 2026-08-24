const { Pool } = require('pg');
const path = require('path');
const readline = require('readline');

// Load .env from the project root by absolute path — dotenv defaults to the
// current working directory, so `node scripts/clear-db.js` launched from
// anywhere but the root would silently load nothing and leave the connection
// string undefined (which surfaces as "SASL: client password must be a string").
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
    // dotenv not installed (production-only deps) — rely on the shell/PM2 env.
}

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString || typeof connectionString !== 'string') {
    console.error('❌ POSTGRES_URL or DATABASE_URL is not set (checked both).');
    console.error('   Add it to the .env at the project root, or export it before running:');
    console.error('   POSTGRES_URL=postgres://... node scripts/clear-db.js');
    process.exit(1);
}

// Match the SSL handling used by backup/import scripts so this works against
// a managed VPS Postgres that requires SSL (sslmode=require in the URL).
const ssl = connectionString.includes('sslmode=require')
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

// Extract a human-readable target (host:port/db) without leaking credentials.
function describeTarget(connStr) {
    try {
        const url = new URL(connStr);
        return `${url.hostname}${url.port ? ':' + url.port : ''}/${url.pathname.replace(/^\//, '')}`;
    } catch {
        // Not a URL-shaped connection string (key=value style) — mask passwords.
        const host = (connStr.match(/host=([^ ]+)/i) || [])[1] || 'unknown-host';
        const db = (connStr.match(/dbname=([^ ]+)/i) || [])[1] || '';
        return `${host}${db ? '/' + db : ''}`;
    }
}

// Interactive Y/n confirmation. Defaults to ABORT unless the user types y/yes.
async function confirm(message) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = await new Promise((resolve) => {
            rl.question(`${message} `, resolve);
        });
        const normalized = answer.trim().toLowerCase();
        return normalized === 'y' || normalized === 'yes';
    } finally {
        rl.close();
    }
}

async function main() {
    const target = describeTarget(connectionString);
    const isRemote = !/(^|\.)(localhost|127\.0\.0\.1|::1)$/i.test(target.split('/')[0]);

    console.log('\n⚠️  DESTRUCTIVE OPERATION');
    console.log(`   Target database : ${target}${isRemote ? '  (REMOTE — not localhost!)' : ''}`);
    console.log(`   Tables to clear : ${tables.length} (all data will be permanently deleted)`);

    const confirmed = await confirm('Type y to TRUNCATE ALL TABLES on this database, anything else to abort:');
    if (!confirmed) {
        console.log('\n❌ Aborted. No changes were made.');
        process.exit(0);
    }

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
