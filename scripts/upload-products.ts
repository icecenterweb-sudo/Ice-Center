// Script to upload products from products.txt
// Run with: npx tsx scripts/upload-products.ts

import 'dotenv/config';
import { prisma } from '../src/lib/db';

interface ProductData {
    name: string;
    slug: string;
    description: string;
    features: string[];
    images: string[];
    price: number;
    stock: number;
    isActive: boolean;
}

const products: ProductData[] = [
    {
        name: 'دستگاه یخ در بهشت اوگولینی Ugolini',
        slug: 'ugolini-slush-machine',
        description: 'دستگاه‌های یخ در بهشت ساز به علت پیچیدگی‌های مهندسی در بخش تولید، به ندرت توسط برندهای متفرقه بازطراحی شده‌اند. البته اخیراً کمپانی‌های چینی اقدام به طراحی برخی نمونه‌های دستگاه یخ در بهشت کرده‌اند. اما ما در مجموعه آیس سنتر تعهد داریم تا بهترین انتخاب را به شما معرفی کنیم، بنابراین آیس سنتر فقط ۲ برند اوگولینی و براس Bras را پیشنهاد می‌دهد تا علاوه به کارایی و دوام بالا، از سرمایه شما نیز محافظت کند. همچین این برندها در بازار دست دوم نیز طرفداران زیادی دارند.',
        features: [
            'همزن حلزونی',
            'مخزن پلی‌کربنات دوجداره',
            'توان ۱۱۰۰ وات',
            'جنس بدنه استیل',
            'ساخت ایتالیا',
        ],
        images: [
            'https://res.cloudinary.com/diebgixmj/image/upload/v1767159482/ugolini-slush-machine-1_rnmmtc.png',
            'https://res.cloudinary.com/diebgixmj/image/upload/v1767159482/ugolini-slush-machine-2_gumwia.png',
        ],
        price: 45000000, // 45 million Toman
        stock: 10,
        isActive: true,
    },
    {
        name: 'یخچال تاپینگ پارس گل، مدل ARZ90',
        slug: 'parsgol-topping-refrigerator-arz90',
        description: 'یخچال تاپینگ، نگین هر فروشگاه آبمیوه بستنی است. به همین دلیل باید در انتخاب آن بسیار دقت کنید و معیارهای زیادی را مدنظر قرار دهید. یخچال تاپینگ برای به نمایش گذاشتن بستنی‌های شما استفاده می‌شود اما نکات فنی بسیار زیادی در تولید آن باید رعایت شود. به همین دلیل اکیداً توصیه می‌کنم که تنها از 2 برند معتبر پارس گل و ایران صنعت انتخاب خود را انجام دهید. تولیدات کارگاهی بسیار زیادی در سطح بازار وجود دارد اما به علت حساسیت بالای این دستگاه، مجموعه آیس سنتر به هیچ عنوان توصیه‌ای برای برندهای متفرقه و کارگاهی نمی‌کند.',
        features: [
            'ظرفیت از 10 الی 20 کاسه',
            'عایق بندی فوم تزریقی',
            'شیشه سکوریت نشکن',
            'بدنه جانبی فایبرگلاس',
            'درب جلو بازشو',
            'درب عقب کشویی',
            'ترمومتر ضدبرفک',
            'کمپرسور قدرتمند',
            'مناسب مناطق گرمسیری',
        ],
        images: [
            'https://res.cloudinary.com/diebgixmj/image/upload/v1767159481/parsgol-topping-refrigerator-arz90-1_kgt78u.png',
            'https://res.cloudinary.com/diebgixmj/image/upload/v1767159481/parsgol-topping-refrigerator-arz90-2_olaixu.jpg',
            'https://res.cloudinary.com/diebgixmj/image/upload/v1767159482/parsgol-topping-refrigerator-arz90-3_quxjjd.png',
        ],
        price: 32000000, // 32 million Toman
        stock: 10,
        isActive: true,
    },
];

async function uploadProducts() {
    console.log('🚀 Starting product upload...\n');

    for (const product of products) {
        try {
            // Check if product already exists
            const existing = await prisma.product.findUnique({
                where: { slug: product.slug },
            });

            if (existing) {
                console.log(`⏭️  Skipping "${product.name}" - already exists`);
                continue;
            }

            // Create product
            const created = await prisma.product.create({
                data: {
                    name: product.name,
                    slug: product.slug,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    images: product.images,
                    thumbnail: product.images[0] || null,
                    isActive: product.isActive,
                    // features: product.features, // Uncomment if your schema has features field
                },
            });

            console.log(`✅ Created: "${created.name}" (ID: ${created.id})`);
        } catch (error) {
            console.error(`❌ Error creating "${product.name}":`, error);
        }
    }

    console.log('\n🎉 Upload complete!');
}

uploadProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
