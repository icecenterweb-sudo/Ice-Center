const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function clearProducts() {
    console.log('🗑️  Clearing existing products...\n')

    // Delete all product variants first (cascade should handle this, but being explicit)
    const deletedVariants = await prisma.productVariant.deleteMany({})
    console.log(`   Deleted ${deletedVariants.count} product variants`)

    // Delete all products
    const deletedProducts = await prisma.product.deleteMany({})
    console.log(`   Deleted ${deletedProducts.count} products`)

    console.log('\n✅ Products cleared successfully!\n')
}

clearProducts()
    .catch(e => {
        console.error('❌ Error clearing products:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
