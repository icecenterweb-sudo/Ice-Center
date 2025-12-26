// Script to add two products from products.md to database
// Run with: node prisma/add-products.js

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addProducts() {
    console.log('🚀 Starting to add products...\n');

    try {
        // Find the correct subcategory IDs
        const softServeSubcategory = await prisma.subcategory.findFirst({
            where: {
                category: {
                    name: { contains: 'بستنی قیفی' }
                }
            }
        });

        const juicerSubcategory = await prisma.subcategory.findFirst({
            where: {
                category: {
                    name: { contains: 'آبمیوه گیری' }
                }
            }
        });

        console.log('📂 Found subcategories:');
        console.log('   Soft-serve:', softServeSubcategory?.id || 'Not found');
        console.log('   Juicer:', juicerSubcategory?.id || 'Not found\n');

        // Product 1: دستگاه بستنی قیفی البرز
        const product1 = await prisma.product.create({
            data: {
                name: 'دستگاه بستنی قیفی البرز',
                slug: 'soft-serve-ice-cream-alborz-' + Date.now(),
                description: 'برند البرز با بیش از 20 سال تجربه تولید تجهیزات برودتی، در سال‌های اخیر جهش قابل توجهی در کیفیت محصولات خود داشته است، به طوری که در بازار، کیفیت بستنی تولید شده توسط دستگاه بستنی قیفی البرز، با کیفیت بستنی دستگاه‌های ایتالیایی مقایسه می‌شود. یک بستنی خامه‌ای و بافتی نرم را ارائه می‌دهد. همچنین خدمات پس از فروش و پشتیبانی کمپانی البرز سرمایش از تولیدات خود باعث شده است تا مصرف کنندگان با آسودگی خاطر از محصولات البرز استفاده کنند.',
                brand: 'البرز',
                sku: 'ALBORZ-SOFTSERVE-001',
                price: 250000000, // 250 million تومان
                listPrice: 280000000, // 280 million تومان (for discount display)
                stock: 5,
                isActive: true,
                subcategoryId: softServeSubcategory?.id,
                features: [
                    'دو کمپرسور',
                    'اینورتردار',
                    'تکفاز',
                    'لبه رنگی',
                    'همزن مخزن بالا',
                    'دارای ۲ برد کنترل',
                    '۱۸ ماه گارانتی بی‌قید و شرط'
                ],
                specifications: {
                    'شرایط اقساط': '60% نقد الباقی 4 فقره چک یکماه یکماه',
                    'نوع برق': 'تکفاز',
                    'تعداد کمپرسور': '2',
                    'سیستم کنترل': 'اینورتردار',
                    'گارانتی': '18 ماه'
                },
                warranty: '18 ماه گارانتی بی‌قید و شرط',
                installmentEnabled: true,
                installmentTerms: {
                    downPaymentPercentage: 60,
                    numberOfInstallments: 4,
                    installmentInterval: 'monthly'
                }
            }
        });

        console.log('✅ Product 1 created:', product1.name);

        // Product 2: آب مرکبات و آب انار گیر البرز
        const product2 = await prisma.product.create({
            data: {
                name: 'آب مرکبات و آب انار گیر البرز',
                slug: 'citrus-pomegranate-juicer-alborz-' + Date.now(),
                description: 'دستگاه آب پرتقال و آب انار گیر البرز، یکی از بهترین‌های بازار است. در طراحی این دستگاه از طرح زومکس اسپانیا الهام گرفته شده و با موتور پرقدرت 1 اسب بخاری، عملکرد بسیار خوبی را به شما می‌دهد. کیفیت بالای مونتاژ دستگاه مرکبات البرز باعث می‌شود که در عین حال که تمام آب میوه گرفته شود، پوست میوه تحت فشار قرار نمیگیرد و مزه آبمیوه کاملاً طبیعی باقی می‌ماند',
                brand: 'البرز',
                sku: 'ALBORZ-JUICER-001',
                price: 45000000, // 45 million تومان
                listPrice: 50000000, // 50 million تومان (for discount display)
                stock: 8,
                isActive: true,
                subcategoryId: juicerSubcategory?.id,
                features: [
                    'طرح زومکس',
                    'موتور ۱ اسب',
                    'جنس تیغه از فنر',
                    '۳۲ میوه در دقیقه',
                    'کیفیت مونتاژ بالا',
                    'رضایت مشتری بالا',
                    '۱۸ ماه گارانتی'
                ],
                specifications: {
                    'شرایط اقساط': '60% نقد الباقی 4 فقره چک یکماه یکماه',
                    'قدرت موتور': '1 اسب بخار',
                    'ظرفیت تولید': '32 میوه در دقیقه',
                    'طرح': 'زومکس اسپانیا',
                    'جنس تیغه': 'فنر',
                    'گارانتی': '18 ماه'
                },
                warranty: '18 ماه گارانتی',
                installmentEnabled: true,
                installmentTerms: {
                    downPaymentPercentage: 60,
                    numberOfInstallments: 4,
                    installmentInterval: 'monthly'
                }
            }
        });

        console.log('✅ Product 2 created:', product2.name);

        console.log('\n🎉 Successfully added 2 products!');

    } catch (error) {
        console.error('❌ Error adding products:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addProducts()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
