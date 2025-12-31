// Script to upload a new blog post about starting an ice cream shop
// Run with: npx tsx scripts/upload-blog.ts

import 'dotenv/config';
import { prisma } from '../src/lib/db';

const blogPost = {
    title: 'راهنمای جامع راه‌اندازی آبمیوه و بستنی‌فروشی در سال ۱۴۰۳',
    slug: 'rahnama-rahandazi-abmive-bastani-forushi-1403',
    summary: 'همه چیز درباره راه‌اندازی یک کسب‌وکار موفق آبمیوه و بستنی‌فروشی: از انتخاب تجهیزات تا ترندهای جدید بازار',
    coverImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1700000000/ice-center-blog/ice-cream-shop-cover.jpg',
    seoTitle: 'راهنمای راه‌اندازی آبمیوه بستنی‌فروشی ۱۴۰۳ | آیس سنتر',
    seoDescription: 'آموزش کامل راه‌اندازی آبمیوه و بستنی‌فروشی: تجهیزات لازم، ترندهای ۱۴۰۳، نکات موفقیت و راهنمای خرید یخچال تاپینگ و دستگاه یخ در بهشت',
    status: 'PUBLISHED' as const,
    keywords: ['آبمیوه فروشی', 'بستنی فروشی', 'راه اندازی کسب و کار', 'تجهیزات بستنی', 'ترند بستنی ۱۴۰۳'],
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'چرا آبمیوه و بستنی‌فروشی یک کسب‌وکار سودآور است؟' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'بازار جهانی بستنی در سال ۲۰۲۴ به ارزش حدود ۷۵ میلیارد دلار رسیده است و همچنان در حال رشد است. در ایران نیز با توجه به آب و هوای گرم بسیاری از مناطق، تقاضا برای بستنی و آبمیوه همیشه بالاست. اگر به دنبال یک کسب‌وکار با سرمایه‌گذاری متوسط و بازگشت سرمایه سریع هستید، آبمیوه و بستنی‌فروشی گزینه‌ای عالی است.'
                }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'ترندهای بستنی در سال ۱۴۰۳' }]
            },
            {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: '۱. طعم‌های سنتی ایرانی' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'بستنی با طعم گل محمدی، زعفران، و فالوده شیرازی در سال‌های اخیر حتی در بازارهای بین‌المللی مورد توجه قرار گرفته است. این طعم‌های اصیل ایرانی می‌توانند تمایز شما از رقبا باشند.'
                }]
            },
            {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: '۲. بستنی‌های لوکس و پرمیوم' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'مشتریان امروز به دنبال تجربه‌های خاص هستند. بستنی‌های دست‌ساز با مواد اولیه باکیفیت و ارائه لوکس می‌تواند حاشیه سود بیشتری داشته باشد.'
                }]
            },
            {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: '۳. اسموتی و نوشیدنی‌های ترکیبی' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'اسموتی‌ها، میلک‌شیک‌ها و نوشیدنی‌های ویتامینه با میوه‌های تازه به یکی از پرطرفدارترین محصولات تبدیل شده‌اند. ترکیب آبمیوه با بستنی می‌تواند منوی شما را متنوع‌تر کند.'
                }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'تجهیزات ضروری برای شروع' }]
            },
            {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: 'یخچال تاپینگ' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'یخچال تاپینگ نگین هر فروشگاه آبمیوه بستنی است. برای نمایش حرفه‌ای بستنی‌ها و تاپینگ‌ها، یخچال تاپینگ با کیفیت بالا ضروری است. برندهای معتبری مانند پارس گل و ایران صنعت بهترین انتخاب هستند.'
                }]
            },
            {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: 'دستگاه یخ در بهشت' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'دستگاه یخ در بهشت یکی از پرفروش‌ترین محصولات تابستانی است. برندهای اوگولینی و براس (Bras) با کیفیت ساخت ایتالیایی، بهترین انتخاب برای کسب‌وکارهای حرفه‌ای هستند.'
                }]
            },
            {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: 'سایر تجهیزات' }]
            },
            {
                type: 'bulletList',
                content: [
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'دستگاه بستنی‌ساز نرم (سافت سرو)' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'مخلوط‌کن صنعتی برای اسموتی و میلک‌شیک' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'فریزر صندوقی برای نگهداری موجودی' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'یخچال ویترینی برای نمایش محصولات' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'آبمیوه‌گیری صنعتی' }]
                        }]
                    }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'نکات طلایی موفقیت' }]
            },
            {
                type: 'orderedList',
                content: [
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'مکان‌یابی مناسب: نزدیک مدارس، پارک‌ها یا مراکز خرید' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'تنوع منو: ترکیب بستنی سنتی، ایتالیایی و نوشیدنی‌ها' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'کیفیت مواد اولیه: هرگز از کیفیت کم نزنید' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'بهداشت و نظافت: اولین اولویت' }]
                        }]
                    },
                    {
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'حضور در شبکه‌های اجتماعی: اینستاگرام برای جذب مشتری' }]
                        }]
                    }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'جمع‌بندی' }]
            },
            {
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'راه‌اندازی آبمیوه و بستنی‌فروشی با برنامه‌ریزی درست و انتخاب تجهیزات باکیفیت می‌تواند یک کسب‌وکار پرسود باشد. آیس سنتر با ارائه تجهیزات اصل و باکیفیت، همراه شما در این مسیر است. برای مشاوره رایگان و خرید تجهیزات با ما تماس بگیرید.'
                }]
            }
        ]
    }
};

async function uploadBlog() {
    console.log('📝 Uploading blog post...\n');

    try {
        // Check if post already exists
        const existing = await prisma.blogPost.findUnique({
            where: { slug: blogPost.slug },
        });

        if (existing) {
            console.log(`⚠️  Blog post with slug "${blogPost.slug}" already exists.`);
            console.log('   Updating the post...');

            const updated = await prisma.blogPost.update({
                where: { slug: blogPost.slug },
                data: {
                    title: blogPost.title,
                    summary: blogPost.summary,
                    coverImage: blogPost.coverImage,
                    seoTitle: blogPost.seoTitle,
                    seoDescription: blogPost.seoDescription,
                    content: blogPost.content,
                    keywords: blogPost.keywords,
                    status: blogPost.status,
                    publishedAt: new Date(),
                },
            });

            console.log(`✅ Updated: "${updated.title}" (ID: ${updated.id})`);
            return;
        }

        // Create post
        const created = await prisma.blogPost.create({
            data: {
                title: blogPost.title,
                slug: blogPost.slug,
                summary: blogPost.summary,
                coverImage: blogPost.coverImage,
                seoTitle: blogPost.seoTitle,
                seoDescription: blogPost.seoDescription,
                content: blogPost.content,
                keywords: blogPost.keywords,
                status: blogPost.status,
                publishedAt: new Date(),
            },
        });

        console.log(`✅ Created: "${created.title}" (ID: ${created.id})`);
    } catch (error) {
        console.error('❌ Error uploading blog:', error);
    }

    console.log('\n🎉 Done!');
}

uploadBlog()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
