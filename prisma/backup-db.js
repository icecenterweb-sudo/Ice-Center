// Complete database backup script
// Run with: node prisma/backup-db.js
// This exports all data to JSON for migration to new database

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('📦 Backing up all database tables...\n')

    const backup = {}

    // 1. Admins
    console.log('  → Exporting admins...')
    backup.admins = await prisma.admin.findMany()
    console.log(`    ✅ ${backup.admins.length} admins`)

    // 2. Categories
    console.log('  → Exporting categories...')
    backup.categories = await prisma.category.findMany()
    console.log(`    ✅ ${backup.categories.length} categories`)

    // 3. Subcategories
    console.log('  → Exporting subcategories...')
    backup.subcategories = await prisma.subcategory.findMany()
    console.log(`    ✅ ${backup.subcategories.length} subcategories`)

    // 4. Products (with all fields)
    console.log('  → Exporting products...')
    backup.products = await prisma.product.findMany()
    console.log(`    ✅ ${backup.products.length} products`)

    // 5. Product Variants
    console.log('  → Exporting product variants...')
    backup.productVariants = await prisma.productVariant.findMany()
    console.log(`    ✅ ${backup.productVariants.length} variants`)

    // 6. Users (if any)
    console.log('  → Exporting users...')
    try {
        backup.users = await prisma.user.findMany()
        console.log(`    ✅ ${backup.users.length} users`)
    } catch {
        backup.users = []
        console.log(`    ⚠️  No users table or empty`)
    }

    // 7. OTP codes (optional, might not want to migrate these)
    console.log('  → Exporting OTP codes...')
    try {
        backup.otpCodes = await prisma.oTPCode.findMany()
        console.log(`    ✅ ${backup.otpCodes.length} OTP codes`)
    } catch {
        backup.otpCodes = []
        console.log(`    ⚠️  No OTP table or empty`)
    }

    // Save to file
    const outputPath = path.join(__dirname, '..', 'db-backup.json')
    fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf-8')

    console.log('\n' + '═'.repeat(50))
    console.log('📊 Backup Summary:')
    console.log('═'.repeat(50))
    console.log(`  Admins:       ${backup.admins.length}`)
    console.log(`  Categories:   ${backup.categories.length}`)
    console.log(`  Subcategories: ${backup.subcategories.length}`)
    console.log(`  Products:     ${backup.products.length}`)
    console.log(`  Variants:     ${backup.productVariants.length}`)
    console.log(`  Users:        ${backup.users.length}`)
    console.log('═'.repeat(50))
    console.log(`\n✅ Saved to: db-backup.json`)
    console.log('\n🔄 Next steps:')
    console.log('  1. Update .env with Vercel Postgres DATABASE_URL')
    console.log('  2. Run: npx prisma db push')
    console.log('  3. Run: node prisma/restore-db.js')
    console.log('')
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
