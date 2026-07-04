// Simplified restore script - uses CREATE instead of UPSERT
// Run with: node prisma/restore-simple.js

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
    console.log('📥 Restoring database from backup...\n')
    console.log(`🔗 Connected to: ${connectionString?.substring(0, 30)}...\n`)

    // Load backup
    const backupPath = path.join(__dirname, '..', 'db-backup.json')
    if (!fs.existsSync(backupPath)) {
        console.error('❌ db-backup.json not found!')
        process.exit(1)
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))

    // 1. Restore Admins
    console.log('  → Restoring admins...')
    for (const admin of backup.admins || []) {
        try {
            await prisma.admin.create({ data: admin })
        } catch (e) {
            console.log(`    ⚠️  Admin ${admin.phone} - ${e.message}`)
        }
    }
    console.log(`    ✅ Done`)

    // 2. Restore Categories
    console.log('  → Restoring categories...')
    const categoryMap = {}
    for (const cat of backup.categories || []) {
        try {
            const newCat = await prisma.category.create({
                data: {
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    image: cat.image,
                    isActive: cat.isActive
                }
            })
            categoryMap[cat.id] = newCat.id
        } catch (e) {
            console.log(`    ⚠️  Category ${cat.name} - ${e.message}`)
        }
    }
    console.log(`    ✅ Done`)

    // 3. Restore Subcategories
    console.log('  → Restoring subcategories...')
    const subcategoryMap = {}
    for (const sub of backup.subcategories || []) {
        try {
            const newCategoryId = categoryMap[sub.categoryId]
            if (!newCategoryId) {
                console.log(`    ⚠️  Subcategory ${sub.name} - category not found`)
                continue
            }
            const newSub = await prisma.subcategory.create({
                data: {
                    name: sub.name,
                    slug: sub.slug,
                    description: sub.description,
                    categoryId: newCategoryId,
                    isActive: sub.isActive
                }
            })
            subcategoryMap[sub.id] = newSub.id
        } catch (e) {
            console.log(`    ⚠️  Subcategory ${sub.name} - ${e.message}`)
        }
    }
    console.log(`    ✅ Done`)

    // 4. Restore Products
    console.log('  → Restoring products...')
    const productMap = {}
    for (const product of backup.products || []) {
        try {
            const newSubcategoryId = product.subcategoryId ? subcategoryMap[product.subcategoryId] : null
            const newProduct = await prisma.product.create({
                data: {
                    name: product.name,
                    nameEnglish: product.nameEnglish,
                    slug: product.slug,
                    sku: product.sku,
                    description: product.description,
                    price: product.price,
                    listPrice: product.listPrice,
                    brand: product.brand,
                    model: product.model,
                    manufacturingCountry: product.manufacturingCountry,
                    condition: product.condition,
                    powerSource: product.powerSource,
                    voltage: product.voltage,
                    phase: product.phase,
                    power: product.power,
                    coolingSystem: product.coolingSystem,
                    capacity: product.capacity,
                    width: product.width,
                    depth: product.depth,
                    height: product.height,
                    weight: product.weight,
                    stock: product.stock,
                    inventoryStatus: product.inventoryStatus,
                    isActive: product.isActive,
                    featured: product.featured,
                    subcategoryId: newSubcategoryId,
                    images: product.images,
                    thumbnail: product.thumbnail,
                    features: product.features,
                    specifications: product.specifications,
                    warranty: product.warranty,
                    installmentEnabled: product.installmentEnabled,
                    installmentTerms: product.installmentTerms,
                    metaTitle: product.metaTitle,
                    metaDescription: product.metaDescription,
                    keywords: product.keywords
                }
            })
            productMap[product.id] = newProduct.id
        } catch (e) {
            console.log(`    ⚠️  Product ${product.name} - ${e.message}`)
        }
    }
    console.log(`    ✅ Done`)

    // 5. Restore Product Variants
    console.log('  → Restoring product variants...')
    for (const variant of backup.productVariants || []) {
        try {
            const newProductId = productMap[variant.productId]
            if (!newProductId) {
                console.log(`    ⚠️  Variant ${variant.name} - product not found`)
                continue
            }
            await prisma.productVariant.create({
                data: {
                    name: variant.name,
                    sku: variant.sku,
                    capacity: variant.capacity,
                    phase: variant.phase,
                    voltage: variant.voltage,
                    price: variant.price,
                    stock: variant.stock,
                    inventoryStatus: variant.inventoryStatus,
                    isActive: variant.isActive,
                    isDefault: variant.isDefault,
                    specifications: variant.specifications,
                    productId: newProductId
                }
            })
        } catch (e) {
            console.log(`    ⚠️  Variant ${variant.name} - ${e.message}`)
        }
    }
    console.log(`    ✅ Done`)

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
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
