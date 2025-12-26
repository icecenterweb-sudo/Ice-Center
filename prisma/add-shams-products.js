// Script to add missing Shams soft serve machine models
// Run with: node prisma/add-shams-products.js

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🍦 Adding missing Shams soft serve machines...\n')

    // Find the soft-ice-machines category
    let softIceCategory = await prisma.category.findUnique({
        where: { slug: 'soft-ice-machines' }
    })

    // If no subcategory exists, we'll create one
    let softIceSubcategory = await prisma.subcategory.findFirst({
        where: { categoryId: softIceCategory?.id }
    })

    if (!softIceSubcategory && softIceCategory) {
        softIceSubcategory = await prisma.subcategory.create({
            data: {
                name: 'عمومی',
                slug: 'soft-ice-general',
                description: 'دستگاه‌های بستنی قیفی',
                categoryId: softIceCategory.id
            }
        })
        console.log('✅ Created subcategory: عمومی')
    }

    // Product 1: Galaxy Model (گلکسی)
    const galaxySlug = 'dstgah-bstny-ghyfy-shms-mdl-glksy'
    const existingGalaxy = await prisma.product.findUnique({
        where: { slug: galaxySlug }
    })

    if (!existingGalaxy) {
        await prisma.product.create({
            data: {
                name: 'دستگاه بستنی قیفی شمس، مدل گلکسی',
                slug: galaxySlug,
                sku: 'SHAMS-SOFT-GALAXY-001',
                brand: 'شمس',
                model: 'گلکسی',
                manufacturingCountry: 'ایران',
                condition: 'NEW',
                powerSource: 'ELECTRIC',
                voltage: '380V',
                phase: 3,
                coolingSystem: 'AIR',
                price: 0,
                stock: 3,
                inventoryStatus: 'IN_STOCK',
                isActive: true,
                featured: true,
                subcategoryId: softIceSubcategory?.id,
                description: `دستگاه بستنی قیفی ساز شمس، مدل گلکسی، یک دستگاه پرتوان و بسیار کارآمد هستش و از معدود دستگاه‌های بستنی قیفی ساز هستش که بازار دست دوم بسیار عالی داره. این نکته نشان از کیفیت بالای ساخت این دستگاه داره که حتی بعد از چند سال کارکرد همچنان نسبت به خرید این دستگاه کارکرده اقبال خوبی وجود داره. علاوه بر این خدمات پس از فروش و وفور قطعات یدکی محصولات کمپانی شمس، باعث شده تا دستگاه‌های بستنی قیفی ساز کمپانی شمس، تبدیل به یکی از محبوب‌ترین‌های بازار بشن. همانطور که میدونید خرید یک دستگاه بستنی قیفی، صرفاً بعنوان یک کالای مصرفی نیست، بلکه خریداران به هنگام خرید باید شرایط  سرمایه‌گذاری و بازار دست دوم را نیز در معیارهای خرید خود لحاظ کنند که در این بخش دستگاه‌های بستنی قیفی ساز شمس، در رتبه بالایی قرار می‌گیرند.`,
                features: [
                    'مجهز به ۲ کمپرسور ۲ اسب',
                    'کمپرسور نگهداری 1.6 اسب',
                    'برق سه فاز',
                    '۲ عدد موتور همزن ۲ اسب',
                    '۴۵۰-۵۰۰ بستنی در ساعت',
                    'مجهز به اینورتر',
                    '۲ عدد سیستم ژله لبه‌رنگی',
                    'ظرفیت مخزن 15+15'
                ],
                warranty: 'گارانتی شمس',
                images: [],
                thumbnail: null
            }
        })
        console.log('✅ Created: دستگاه بستنی قیفی شمس، مدل گلکسی')
    } else {
        console.log('ℹ️  Already exists: مدل گلکسی')
    }

    // Product 2: Emperor Model (امپراطور)
    const emperorSlug = 'dstgah-bstny-ghyfy-shms-mdl-ampratur'
    const existingEmperor = await prisma.product.findUnique({
        where: { slug: emperorSlug }
    })

    if (!existingEmperor) {
        await prisma.product.create({
            data: {
                name: 'دستگاه بستنی قیفی شمس، مدل امپراطور',
                slug: emperorSlug,
                sku: 'SHAMS-SOFT-EMPEROR-001',
                brand: 'شمس',
                model: 'امپراطور',
                manufacturingCountry: 'ایران',
                condition: 'NEW',
                powerSource: 'ELECTRIC',
                voltage: '380V',
                phase: 3,
                coolingSystem: 'AIR',
                price: 0,
                stock: 2,
                inventoryStatus: 'IN_STOCK',
                isActive: true,
                featured: true,
                subcategoryId: softIceSubcategory?.id,
                description: `دستگاه بستنی قیفی ساز شمس، مدل امپراطور، یکی از معدود دستگاه‌هایی هستش که بازار دست دوم بسیار عالی داره. این نکته نشان از کیفیت بالای این دستگاه داره که حتی بعد از چند سال کارکرد همچنان نسبت به خرید این دستگاه اقبال خوبی وجود داره. علاوه بر این خدمات پس از فروش و وفور قطعات یدکی محصولات کمپانی شمس، باعث شده تا دستگاه‌های بستنی قیفی ساز کمپانی شمس، تبدیل به یکی از محبوب‌ترین‌های بازار بشن. همانطور که میدونید خرید یک دستگاه بستنی قیفی، صرفاً بعنوان یک کالای مصرفی نیست، بلکه خریداران به هنگام خرید باید شرایط  سرمایه‌گذاری و بازار دست دوم را نیز در معیارهای خرید خود لحاظ کنند که در این بخش دستگاه‌های بستنی قیفی ساز شمس، در رتبه بالایی قرار می‌گیرند.`,
                features: [
                    'کمپرسور ۳ اسب',
                    'برق سه فاز',
                    'موتور همزن ۳ اسب',
                    '۶۵۰-۷۰۰ بستنی در ساعت',
                    'دارای مخزن لبه رنگی',
                    'ظرفیت مخزن 25+25',
                    'مناسب مناطق شلوغ و پرتردد'
                ],
                warranty: 'گارانتی شمس',
                images: [],
                thumbnail: null
            }
        })
        console.log('✅ Created: دستگاه بستنی قیفی شمس، مدل امپراطور')
    } else {
        console.log('ℹ️  Already exists: مدل امپراطور')
    }

    // Summary
    const productCount = await prisma.product.count()
    console.log(`\n📊 Total products in database: ${productCount}`)
    console.log('\n✨ Done!\n')
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
