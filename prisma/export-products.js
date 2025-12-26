// Script to extract all products from database to JSON file
// Run with: node prisma/export-products.js

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('📦 Extracting products from database...\n')

    const products = await prisma.product.findMany({
        include: {
            subcategory: {
                include: {
                    category: true
                }
            },
            variants: true
        },
        orderBy: { createdAt: 'desc' }
    })

    console.log(`Found ${products.length} products\n`)

    // Save as JSON
    const outputPath = path.join(__dirname, '..', 'products-export.json')
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8')
    console.log(`✅ Saved to: products-export.json`)

    // Also create readable text version
    let textOutput = `# Exported Products from Database\n`
    textOutput += `# Total: ${products.length} products\n`
    textOutput += `# Exported at: ${new Date().toISOString()}\n\n`

    for (const product of products) {
        textOutput += `${'='.repeat(60)}\n`
        textOutput += `Name: ${product.name}\n`
        textOutput += `Slug: ${product.slug}\n`
        textOutput += `SKU: ${product.sku || '-'}\n`
        textOutput += `Brand: ${product.brand || '-'}\n`
        textOutput += `Model: ${product.model || '-'}\n`
        textOutput += `Price: ${product.price}\n`
        textOutput += `List Price: ${product.listPrice || '-'}\n`
        textOutput += `Stock: ${product.stock}\n`
        textOutput += `Status: ${product.inventoryStatus}\n`
        textOutput += `Category: ${product.subcategory?.category?.name || '-'} / ${product.subcategory?.name || '-'}\n`
        textOutput += `\nDescription:\n${product.description || 'No description'}\n`
        textOutput += `\nFeatures:\n`
        if (product.features && product.features.length > 0) {
            product.features.forEach(f => {
                textOutput += `  • ${f}\n`
            })
        } else {
            textOutput += `  No features listed\n`
        }
        textOutput += `\nImages: ${product.images?.length || 0}\n`
        if (product.variants && product.variants.length > 0) {
            textOutput += `\nVariants (${product.variants.length}):\n`
            product.variants.forEach(v => {
                textOutput += `  - ${v.name} | ${v.capacity || '-'} | ${v.phase ? v.phase + ' phase' : '-'} | Price: ${v.price}\n`
            })
        }
        textOutput += `\n`
    }

    const textPath = path.join(__dirname, '..', 'products-export.txt')
    fs.writeFileSync(textPath, textOutput, 'utf-8')
    console.log(`✅ Saved to: products-export.txt`)

    console.log('\n✨ Export complete!\n')
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
