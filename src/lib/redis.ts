import { Redis } from '@upstash/redis'

// Upstash Redis client for caching (via Vercel KV)
// Uses REST API - works in Edge functions and serverless environments
const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
})

redis.ping()
    .then(() => console.log('✅ Redis connected successfully'))
    .catch((err) => console.error('❌ Redis connection failed:', err))

export default redis
