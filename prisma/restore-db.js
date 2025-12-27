// Database restore script - imports data from backup
// Run with: node prisma/restore-db.js
// IMPORTANT: Run this AFTER prisma db push on new database

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('📥 Restoring database from backup...\n')

    // Load backup
    const backupPath = path.join(__dirname, '..', 'db-backup.json')
    if (!fs.existsSync(backupPath)) {
        console.error('❌ db-backup.json not found! Run backup-db.js first.')
        process.exit(1)
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))

    // 1. Restore Admins
    if (backup.admins && backup.admins.length > 0) {
        console.log('  → Restoring admins...')
        for (const admin of backup.admins) {
            try {
                await prisma.admin.upsert({
                    where: { phone: admin.phone },
                    update: admin,
                    create: admin,
                })
            } catch (e) {
                console.log(`    ⚠️  Admin ${admin.phone} skipped`)
            }
        }
        console.log(`    ✅ ${backup.admins.length} admins`)
    }

    // 2. Restore Categories
    if (backup.categories && backup.categories.length > 0) {
        console.log('  → Restoring categories...')
        for (const cat of backup.categories) {
            try {
                await prisma.category.upsert({
                    where: { slug: cat.slug },
                    update: { ...cat, id: undefined },
                    create: { ...cat, id: undefined },
                })
            } catch (e) {
                console.log(`    ⚠️  Category ${cat.name} skipped: ${e.message}`)
            }
        }
        console.log(`    ✅ ${backup.categories.length} categories`)
    }

    // 3. Restore Subcategories (need to map categoryId)
    if (backup.subcategories && backup.subcategories.length > 0) {
        console.log('  → Restoring subcategories...')
        const categoryMap = {}
        const dbCategories = await prisma.category.findMany()
        const backupCats = backup.categories || []

        // Create old ID -> new ID mapping
        for (const oldCat of backupCats) {
            const newCat = dbCategories.find(c => c.slug === oldCat.slug)
            if (newCat) categoryMap[oldCat.id] = newCat.id
        }

        for (const sub of backup.subcategories) {
            try {
                const newCategoryId = categoryMap[sub.categoryId]
                if (!newCategoryId) {
                    console.log(`    ⚠️  Subcategory ${sub.name} - category not found`)
                    continue
                }
                await prisma.subcategory.upsert({
                    where: { slug: sub.slug },
                    update: { ...sub, id: undefined, categoryId: newCategoryId },
                    create: { ...sub, id: undefined, categoryId: newCategoryId },
                })
            } catch (e) {
                console.log(`    ⚠️  Subcategory ${sub.name} skipped`)
            }
        }
        console.log(`    ✅ ${backup.subcategories.length} subcategories`)
    }

    // 4. Restore Products (need to map subcategoryId)
    if (backup.products && backup.products.length > 0) {
        console.log('  → Restoring products...')
        const subcategoryMap = {}
        const dbSubcategories = await prisma.subcategory.findMany()
        const backupSubs = backup.subcategories || []

        for (const oldSub of backupSubs) {
            const newSub = dbSubcategories.find(s => s.slug === oldSub.slug)
            if (newSub) subcategoryMap[oldSub.id] = newSub.id
        }

        for (const product of backup.products) {
            try {
                const newSubcategoryId = product.subcategoryId ? subcategoryMap[product.subcategoryId] : null
                const productData = {
                    ...product,
                    id: undefined,
                    subcategoryId: newSubcategoryId,
                }
                await prisma.product.upsert({
                    where: { slug: product.slug },
                    update: productData,
                    create: productData,
                })
            } catch (e) {
                console.log(`    ⚠️  Product ${product.name} skipped: ${e.message}`)
            }
        }
        console.log(`    ✅ ${backup.products.length} products`)
    }

    // 5. Restore Product Variants (need to map productId)
    if (backup.productVariants && backup.productVariants.length > 0) {
        console.log('  → Restoring product variants...')
        const productMap = {}
        const dbProducts = await prisma.product.findMany()
        const backupProducts = backup.products || []

        for (const oldProduct of backupProducts) {
            const newProduct = dbProducts.find(p => p.slug === oldProduct.slug)
            if (newProduct) productMap[oldProduct.id] = newProduct.id
        }

        for (const variant of backup.productVariants) {
            try {
                const newProductId = productMap[variant.productId]
                if (!newProductId) {
                    console.log(`    ⚠️  Variant ${variant.name} - product not found`)
                    continue
                }
                const variantData = {
                    ...variant,
                    id: undefined,
                    productId: newProductId,
                }
                await prisma.productVariant.upsert({
                    where: { sku: variant.sku },
                    update: variantData,
                    create: variantData,
                })
            } catch (e) {
                console.log(`    ⚠️  Variant ${variant.name} skipped: ${e.message}`)
            }
        }
        console.log(`    ✅ ${backup.productVariants.length} variants`)
    }

    // Summary
    console.log('\n' + '═'.repeat(50))
    console.log('✅ Database restore complete!')
    console.log('═'.repeat(50))

    const stats = {
        admins: await prisma.admin.count(),
        categories: await prisma.category.count(),
        subcategories: await prisma.subcategory.count(),
        products: await prisma.product.count(),
        variants: await prisma.productVariant.count(),
    }

    console.log(`  Admins:        ${stats.admins}`)
    console.log(`  Categories:    ${stats.categories}`)
    console.log(`  Subcategories: ${stats.subcategories}`)
    console.log(`  Products:      ${stats.products}`)
    console.log(`  Variants:      ${stats.variants}`)
    console.log('═'.repeat(50))
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
