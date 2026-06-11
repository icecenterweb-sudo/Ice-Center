import { Redis } from '@upstash/redis'

const redisUrl = process.env.KV_REST_API_URL
const redisToken = process.env.KV_REST_API_TOKEN

// Cache is optional: callers must fall back to the database if Redis is not
// configured or is temporarily unreachable.
const redis = redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
    })
    : null

export default redis
