const redis = require('@upstash/redis');
require('dotenv').config();

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
    console.log("Redis credentials not found. Skipping Redis cache clearing.");
    process.exit(0);
}

const client = new redis.Redis({
    url: redisUrl,
    token: redisToken,
});

async function main() {
    console.log("Connecting to Redis...");
    let cursor = 0;
    let totalDeleted = 0;

    do {
        const [nextCursor, keys] = await client.scan(cursor, {
            match: 'products:*',
            count: 100,
        });

        cursor = Number(nextCursor);

        if (keys.length > 0) {
            console.log(`Deleting keys: ${keys.join(', ')}`);
            await client.del(...keys);
            totalDeleted += keys.length;
        }
    } while (cursor !== 0);

    console.log(`✅ Redis cache cleared. Deleted ${totalDeleted} key(s).`);
}

main().catch(console.error);
