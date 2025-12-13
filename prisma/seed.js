const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Categories and Subcategories Data
const categoriesData = [
    {
        name: 'آبمیوه گیری و مخلوط کن',
        slug: 'juice-and-blender',
        description: 'دستگاه‌های آبمیوه گیری، آب مرکبات گیر و مخلوط کن',
        subcategories: [
            { name: 'آب مرکبات گیری', slug: 'citrus-juicer', description: 'دستگاه‌های آب مرکبات گیر برای پرتقال و لیمو' },
            { name: 'آبمیوه گیری', slug: 'juice-extractor', description: 'دستگاه‌های آبمیوه گیری حرفه‌ای' },
            { name: 'مخلوط کن', slug: 'blender', description: 'مخلوط کن‌های صنعتی و نیمه صنعتی' }
        ]
    },
    {
        name: 'نوشیدنی ساز',
        slug: 'drink-machines',
        description: 'دستگاه‌های تولید نوشیدنی‌های سرد',
        subcategories: [
            { name: 'یخ در بهشت', slug: 'slush-machine', description: 'دستگاه یخ در بهشت (اسلاش)' },
            { name: 'شربت سردکن', slug: 'cold-drink-dispenser', description: 'دستگاه شربت سرد کن و نوشیدنی سرد' }
        ]
    },
    {
        name: 'یخچال و فریزر',
        slug: 'refrigeration',
        description: 'یخچال و فریزرهای صنعتی',
        subcategories: [
            { name: 'یخچال ایستاده', slug: 'upright-fridge', description: 'یخچال ایستاده صنعتی' },
            { name: 'فریزر ایستاده', slug: 'upright-freezer', description: 'فریزر ایستاده با درب شیشه‌ای' },
            { name: 'فریزر صندوقی', slug: 'chest-freezer', description: 'فریزر صندوقی افقی' },
            { name: 'تاپینگ بستنی اسکوپی', slug: 'ice-cream-topping-freezer', description: 'فریزر نگهداری بستنی اسکوپی' },
            { name: 'شاک فریز', slug: 'shock-freezer', description: 'دستگاه انجماد سریع' },
            { name: 'فریزر فالوده', slug: 'faloodeh-freezer', description: 'فریزر مخصوص نگهداری فالوده' }
        ]
    },
    {
        name: 'گل خامه',
        slug: 'cream-machines',
        description: 'دستگاه‌های تولید گل خامه',
        subcategories: [
            { name: 'گل خامه اتوماتیک', slug: 'automatic-cream-machine', description: 'دستگاه گل خامه تمام اتوماتیک' }
        ]
    },
    {
        name: 'تجهیزات لبنیاتی',
        slug: 'dairy-equipment',
        description: 'تجهیزات صنعتی لبنیات',
        subcategories: [
            { name: 'پخت شیر', slug: 'milk-boiler', description: 'دستگاه پخت و پاستوریزه شیر' },
            { name: 'شیرسردکن', slug: 'milk-cooler', description: 'دستگاه سرد کن و نگهداری شیر' },
            { name: 'یخچال ایستاده', slug: 'upright-fridge-dairy', description: 'یخچال ایستاده مخصوص لبنیات' }
        ]
    },
    {
        name: 'قطعه و لوازم یدکی',
        slug: 'spare-parts',
        description: 'قطعات یدکی دستگاه‌های بستنی و نوشیدنی',
        subcategories: [
            { name: 'قطعات دستگاه بستنی قیفی', slug: 'soft-ice-parts', description: 'قطعات یدکی بستنی ساز قیفی' },
            { name: 'قطعات آب مرکبات گیر', slug: 'citrus-juicer-parts', description: 'قطعات یدکی آب مرکبات گیر' },
            { name: 'قطعات شربت سردکن', slug: 'cold-drink-parts', description: 'قطعات یدکی شربت سرد کن' },
            { name: 'قطعات یخ در بهشت', slug: 'slush-parts', description: 'قطعات یدکی دستگاه اسلاش' },
            { name: 'قطعات آبمیوه گیری', slug: 'juice-extractor-parts', description: 'قطعات یدکی آب میوه گیر' },
            { name: 'قطعات مخلوط کن', slug: 'blender-parts', description: 'قطعات یدکی مخلوط کن' }
        ]
    },
    {
        name: 'لوازم آبمیوه بستنی',
        slug: 'ice-cream-supplies',
        description: 'مواد مصرفی و لوازم جانبی بستنی',
        subcategories: [
            { name: 'ژله بستنی', slug: 'ice-cream-jelly', description: 'ژله و تزئینات بستنی' },
            { name: 'پودر بستنی', slug: 'ice-cream-powder', description: 'پودرهای آماده بستنی' },
            { name: 'نان بستنی', slug: 'ice-cream-cone', description: 'قیف و ویفر بستنی' },
            { name: 'ظروف یکبار مصرف آبمیوه بستنی', slug: 'disposable-cups', description: 'لیوان و ظروف یکبار مصرف' }
        ]
    },
    {
        name: 'دستگاه بستنی قیفی',
        slug: 'soft-ice-machines',
        description: 'دستگاه‌های بستنی قیفی (سافت آیس)',
        subcategories: []
    },
    {
        name: 'دستگاه بار سفت کن',
        slug: 'hardening-machines',
        description: 'دستگاه‌های سخت کن بستنی',
        subcategories: []
    }
];

async function seedAdmin() {
    const adminPhone = '09130027927'
    const adminName = 'حمیدرضا'

    const existingAdmin = await prisma.admin.findUnique({
        where: { phone: adminPhone },
    })

    if (!existingAdmin) {
        await prisma.admin.create({
            data: {
                phone: adminPhone,
                name: adminName,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        })
        console.log(`✅ Admin created: ${adminName}`)
    } else {
        console.log(`ℹ️  Admin already exists: ${adminName}`)
    }
}

async function seedCategories() {
    console.log('\n🏷️  Seeding Categories and Subcategories...\n')

    for (const categoryData of categoriesData) {
        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: { slug: categoryData.slug }
        })

        let category
        if (existingCategory) {
            console.log(`ℹ️  Category already exists: ${categoryData.name}`)
            category = existingCategory
        } else {
            category = await prisma.category.create({
                data: {
                    name: categoryData.name,
                    slug: categoryData.slug,
                    description: categoryData.description
                }
            })
            console.log(`✅ Category created: ${categoryData.name}`)
        }

        // Seed subcategories
        for (const subData of categoryData.subcategories) {
            const existingSubcategory = await prisma.subcategory.findUnique({
                where: { slug: subData.slug }
            })

            if (existingSubcategory) {
                console.log(`   ℹ️  Subcategory exists: ${subData.name}`)
            } else {
                await prisma.subcategory.create({
                    data: {
                        name: subData.name,
                        slug: subData.slug,
                        description: subData.description,
                        categoryId: category.id
                    }
                })
                console.log(`   ✅ Subcategory created: ${subData.name}`)
            }
        }
    }

    console.log('\n✨ Categories and Subcategories seeding completed!\n')
}

async function main() {
    console.log('🌱 Starting database seed...\n')

    await seedAdmin()
    await seedCategories()

    // Print summary
    const categoryCount = await prisma.category.count()
    const subcategoryCount = await prisma.subcategory.count()

    console.log('📊 Seed Summary:')
    console.log(`   Categories: ${categoryCount}`)
    console.log(`   Subcategories: ${subcategoryCount}`)
    console.log('\n✅ Database seed completed successfully!\n')
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
