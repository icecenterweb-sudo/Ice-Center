const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
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
                roles: ['SUPER_ADMIN'],
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
                where: { categoryId_slug: { categoryId: category.id, slug: subData.slug } }
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

async function seedProducts() {
    console.log('\n🛒 Seeding Products with Variants...\n')

    // Get subcategory for batch freezer (hardening machines)
    const hardeningSubcategory = await prisma.subcategory.findFirst({
        where: { slug: 'hardening-machines' }
    })

    // Product: Alborz Batch Freezer with 5 capacity variants
    const productSlug = 'alborz-batch-freezer'
    const existingProduct = await prisma.product.findUnique({
        where: { slug: productSlug }
    })

    if (!existingProduct) {
        await prisma.product.create({
            data: {
                name: 'بارسفت کن تنوری البرز',
                slug: productSlug,
                sku: 'ALBORZ-BF-BASE',
                description: `اگر قصد تولید بستنی ژلاتو، بستنی سنتی یا میوه‌ای را دارید، حتماً به یک بارسفت کن با کیفیت نیاز دارید.

شرکت البرز سرمایش با بیش از 20 سال تجربه در زمینه تولید تجهیزات برودتی، برند شماره ۱ بازار ایران در زمینه تولید دستگاه‌های بارسفت کن محسوب می‌شود.

همانطور که میدانید، بارسفت کن دستگاه اصلی در زمینه تولید بستنی سنتی، و بستنی‌های میوه‌ای است. بنابراین اگر به قصد تولید بستنی با کیفیت و ربودن گوی سبقت از رقبا هستید، بار سفت کن البرز همان چیزی است که به آن نیاز دارید.

این محصول در ظرفیت‌های 14, 20, 25, 40 و 60 کیلویی ساخته می‌شود که شما می‌توانید با توجه به میزان تولید خود، ظرفیت مناسب را انتخاب کنید.

مدل 14 کیلویی با برق تکفاز سازگار است و ظرفیت‌های بالاتر نیاز به برق سه فاز دارند.`,
                price: 0, // Will be set by variants
                brand: 'البرز سرمایش',
                model: 'تنوری',
                manufacturingCountry: 'ایران',
                condition: 'NEW',
                powerSource: 'ELECTRIC',
                coolingSystem: 'AIR',
                stock: 15, // Sum of variant stocks
                inventoryStatus: 'IN_STOCK',
                isActive: true,
                featured: true,
                subcategoryId: hardeningSubcategory?.id,
                images: [
                    '/images/products/alborz-batch-freezer-1.jpg',
                    '/images/products/alborz-batch-freezer-2.jpg'
                ],
                thumbnail: '/images/products/alborz-batch-freezer-thumb.jpg',
                features: [
                    'درب ورودی از بالا',
                    'دیگ تنوری',
                    'برد لمسی',
                    'اینورتردار',
                    'کمپرسور پرقدرت 7.5 اسب',
                    '۱۸ ماه گارانتی بی‌قید و شرط',
                    'کیفیت تولید بسیار خوب'
                ],
                warranty: '۱۸ ماه گارانتی بی‌قید و شرط',
                installmentEnabled: true,
                installmentTerms: {
                    downPaymentPercent: 60,
                    description: '۶۰٪ نقد الباقی ۴ فقره چک یکماه یکماه',
                    conditions: [
                        'پرداخت ۶۰٪ نقدی در زمان خرید',
                        'مابقی در ۴ فقره چک یک ماهه'
                    ]
                },
                metaTitle: 'بارسفت کن تنوری البرز - خرید دستگاه بارسفت کن صنعتی',
                metaDescription: 'خرید بارسفت کن تنوری البرز با ظرفیت‌های ۱۴، ۲۰، ۲۵، ۴۰ و ۶۰ کیلوگرم. ۱۸ ماه گارانتی و امکان پرداخت اقساطی',
                keywords: ['بارسفت کن', 'دستگاه بستنی سازی', 'بارسفت کن البرز', 'تجهیزات بستنی'],
                variants: {
                    create: [
                        {
                            name: '۱۴ کیلوگرم - تک فاز',
                            sku: 'ALBORZ-BF-14KG-1P',
                            capacity: '14kg',
                            phase: 1,
                            voltage: '220V',
                            price: 0, // Set actual price
                            stock: 5,
                            inventoryStatus: 'IN_STOCK',
                            isActive: true,
                            isDefault: true,
                            specifications: {
                                powerPhase: 'تک فاز',
                                voltage: '220V',
                                compressor: 'کمپرسور پرقدرت 7.5 اسب',
                                features: ['برد لمسی', 'اینورتردار', 'دیگ تنوری']
                            }
                        },
                        {
                            name: '۲۰ کیلوگرم - سه فاز',
                            sku: 'ALBORZ-BF-20KG-3P',
                            capacity: '20kg',
                            phase: 3,
                            voltage: '380V',
                            price: 0, // Set actual price
                            stock: 4,
                            inventoryStatus: 'IN_STOCK',
                            isActive: true,
                            isDefault: false,
                            specifications: {
                                powerPhase: 'سه فاز',
                                voltage: '380V',
                                compressor: 'کمپرسور پرقدرت 7.5 اسب',
                                features: ['برد لمسی', 'اینورتردار', 'دیگ تنوری']
                            }
                        },
                        {
                            name: '۲۵ کیلوگرم - سه فاز',
                            sku: 'ALBORZ-BF-25KG-3P',
                            capacity: '25kg',
                            phase: 3,
                            voltage: '380V',
                            price: 0, // Set actual price
                            stock: 3,
                            inventoryStatus: 'IN_STOCK',
                            isActive: true,
                            isDefault: false,
                            specifications: {
                                powerPhase: 'سه فاز',
                                voltage: '380V',
                                compressor: 'کمپرسور پرقدرت 7.5 اسب',
                                features: ['برد لمسی', 'اینورتردار', 'دیگ تنوری']
                            }
                        },
                        {
                            name: '۴۰ کیلوگرم - سه فاز',
                            sku: 'ALBORZ-BF-40KG-3P',
                            capacity: '40kg',
                            phase: 3,
                            voltage: '380V',
                            price: 0, // Set actual price
                            stock: 2,
                            inventoryStatus: 'LOW_STOCK',
                            isActive: true,
                            isDefault: false,
                            specifications: {
                                powerPhase: 'سه فاز',
                                voltage: '380V',
                                compressor: 'کمپرسور پرقدرت 7.5 اسب',
                                features: ['برد لمسی', 'اینورتردار', 'دیگ تنوری']
                            }
                        },
                        {
                            name: '۶۰ کیلوگرم - سه فاز',
                            sku: 'ALBORZ-BF-60KG-3P',
                            capacity: '60kg',
                            phase: 3,
                            voltage: '380V',
                            price: 0, // Set actual price
                            stock: 1,
                            inventoryStatus: 'LOW_STOCK',
                            isActive: true,
                            isDefault: false,
                            specifications: {
                                powerPhase: 'سه فاز',
                                voltage: '380V',
                                compressor: 'کمپرسور پرقدرت 7.5 اسب',
                                features: ['برد لمسی', 'اینورتردار', 'دیگ تنوری']
                            }
                        }
                    ]
                }
            }
        })
        console.log('✅ Product created: بارسفت کن تنوری البرز (with 5 variants)')
    } else {
        console.log('ℹ️  Product already exists: بارسفت کن تنوری البرز')
    }

    console.log('\n✨ Products seeding completed!\n')
}

async function main() {
    console.log('🌱 Starting database seed...\n')

    await seedAdmin()
    await seedCategories()
    await seedProducts()

    // Print summary
    const categoryCount = await prisma.category.count()
    const subcategoryCount = await prisma.subcategory.count()
    const productCount = await prisma.product.count()
    const variantCount = await prisma.productVariant.count()

    console.log('📊 Seed Summary:')
    console.log(`   Categories: ${categoryCount}`)
    console.log(`   Subcategories: ${subcategoryCount}`)
    console.log(`   Products: ${productCount}`)
    console.log(`   Product Variants: ${variantCount}`)
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
