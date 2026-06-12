// Complete database backup script
// Run with: node prisma/backup-db.js
// Exports all current Prisma models to JSON.

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
    console.error('Missing POSTGRES_URL or DATABASE_URL.')
    process.exit(1)
}

const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const backupDir = path.join(__dirname, '..', 'backups')
const outputPath = path.join(backupDir, 'db-backup.json')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const timestampedOutputPath = path.join(backupDir, `db-backup-${timestamp}.json`)

const tables = [
    ['admins', () => prisma.admin.findMany({ orderBy: { id: 'asc' } })],
    ['users', () => prisma.user.findMany({ orderBy: { id: 'asc' } })],
    ['categories', () => prisma.category.findMany({ orderBy: { id: 'asc' } })],
    ['subcategories', () => prisma.subcategory.findMany({ orderBy: { id: 'asc' } })],
    ['products', () => prisma.product.findMany({ orderBy: { id: 'asc' } })],
    ['productVariants', () => prisma.productVariant.findMany({ orderBy: { id: 'asc' } })],
    ['cartItems', () => prisma.cartItem.findMany({ orderBy: { id: 'asc' } })],
    ['otpRequests', () => prisma.otpRequest.findMany({ orderBy: { id: 'asc' } })],
    ['addresses', () => prisma.address.findMany({ orderBy: { id: 'asc' } })],
    ['blogCategories', () => prisma.blogCategory.findMany({ orderBy: { id: 'asc' } })],
    ['blogTags', () => prisma.blogTag.findMany({ orderBy: { id: 'asc' } })],
    ['blogPosts', () => prisma.blogPost.findMany({ orderBy: { id: 'asc' } })],
    ['blogPostTags', () => getBlogPostTags()],
    ['blogComments', () => prisma.blogComment.findMany({ orderBy: { id: 'asc' } })],
    ['campaigns', () => prisma.campaign.findMany({ orderBy: { id: 'asc' } })],
    ['offers', () => prisma.offer.findMany({ orderBy: { id: 'asc' } })],
    ['offerProducts', () => prisma.offerProduct.findMany({ orderBy: { id: 'asc' } })],
    ['slides', () => prisma.slide.findMany({ orderBy: { id: 'asc' } })],
    ['banners', () => prisma.banner.findMany({ orderBy: { id: 'asc' } })],
    ['orders', () => prisma.order.findMany({ orderBy: { id: 'asc' } })],
    ['orderItems', () => prisma.orderItem.findMany({ orderBy: { id: 'asc' } })],
    ['wishlistItems', () => prisma.wishlistItem.findMany({ orderBy: { id: 'asc' } })],
    ['notifications', () => prisma.notification.findMany({ orderBy: { id: 'asc' } })],
    ['analyticsEvents', () => prisma.analyticsEvent.findMany({ orderBy: { id: 'asc' } })],
]

async function main() {
    console.log('Backing up database tables...\n')

    const backup = {
        metadata: {
            createdAt: new Date().toISOString(),
            schemaProvider: 'postgresql',
            source: maskConnectionString(connectionString),
        },
        data: {},
        counts: {},
    }

    for (const [key, loader] of tables) {
        process.stdout.write(`  -> Exporting ${key}... `)
        try {
            const rows = await loadWithRetry(key, loader)
            backup.data[key] = rows
            backup.counts[key] = rows.length
            console.log(`${rows.length}`)
        } catch (error) {
            console.log('failed')
            throw new Error(`Could not export ${key}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    const json = JSON.stringify(backup, null, 2)
    fs.mkdirSync(backupDir, { recursive: true })
    fs.writeFileSync(outputPath, json, 'utf-8')
    fs.writeFileSync(timestampedOutputPath, json, 'utf-8')

    console.log('\nBackup summary')
    console.log('='.repeat(50))
    for (const [key] of tables) {
        console.log(`${key.padEnd(18)} ${String(backup.counts[key]).padStart(6)}`)
    }
    console.log('='.repeat(50))
    console.log(`Saved latest: ${path.relative(process.cwd(), outputPath)}`)
    console.log(`Saved copy:   ${path.relative(process.cwd(), timestampedOutputPath)}`)
}

async function loadWithRetry(key, loader, attempts = 3) {
    let lastError

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await loader()
        } catch (error) {
            lastError = error
            if (attempt < attempts) {
                process.stdout.write(`retry ${attempt}/${attempts - 1}... `)
                await wait(500 * attempt)
            }
        }
    }

    throw lastError || new Error(`Unknown error while exporting ${key}`)
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getBlogPostTags() {
    const posts = await prisma.blogPost.findMany({
        select: {
            id: true,
            tags: { select: { id: true } },
        },
        orderBy: { id: 'asc' },
    })

    return posts.flatMap((post) =>
        post.tags.map((tag) => ({
            postId: post.id,
            tagId: tag.id,
        }))
    )
}

function maskConnectionString(value) {
    try {
        const url = new URL(value)
        if (url.password) url.password = '***'
        if (url.username) url.username = '***'
        return url.toString()
    } catch {
        return 'configured'
    }
}

main()
    .catch((error) => {
        console.error('Backup failed:', error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
