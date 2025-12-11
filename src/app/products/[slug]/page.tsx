'use client';

import { useState } from 'react';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import PricingBox from '@/components/product/PricingBox';
import ProductSpecifications from '@/components/product/ProductSpecifications';
import ProductReviews from '@/components/product/ProductReviews';
import TrustBadges from '@/components/product/TrustBadges';
import MiniPricingBox from '@/components/product/MiniPricingBox';
import MobileActionBar from '@/components/product/MobileActionBar';
import SimilarProducts from '@/components/product/SimilarProducts';
import ProductTabs from '@/components/product/ProductTabs';
import { Zap, Snowflake, Settings, Award } from 'lucide-react';

// Demo product data
const product = {
    name: 'دستگاه بستنی ساز صنعتی مدل ICE-Pro 3000',
    nameEnglish: 'Industrial Ice Cream Maker ICE-Pro 3000',
    brand: 'آیس سنتر',
    model: 'ICE-Pro 3000',
    price: 285000000,
    originalPrice: 320000000,
    availability: 'موجود در انبار',
    rating: 4.7,
    reviewCount: 127,
    images: [
        'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg',
        'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999218/dc2c39_kz3wpy.jpg',
        'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg',
        'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999174/yakhsaz-50kg-1232_adlyut.jpg',
    ],
    warranty: 'گارانتی 18 ماهه شرکت آیس سنتر',
    seller: 'فروشنده: آیس سنتر ایران',
    description: 'دستگاه بستنی‌ساز صنعتی با ظرفیت تولید بالا، مناسب برای کارخانجات، بستنی‌فروشی‌ها و کافه‌های بزرگ. ساخت ایتالیا با کیفیت عالی و قطعات اصلی. این دستگاه با بهره‌گیری از تکنولوژی روز اروپا، مصرف انرژی پایین و بازدهی بسیار بالا را تضمین می‌کند.',
};

const advantages = [
    { icon: Zap, title: 'ظرفیت تولید بالا', description: '30 لیتر در ساعت' },
    { icon: Snowflake, title: 'کمپرسور صنعتی', description: 'اسکرو ایتالیایی Copeland' },
    { icon: Settings, title: 'کنترل دیجیتال', description: 'پنل PLC هوشمند' },
    { icon: Award, title: 'استاندارد بهداشتی', description: 'استیل ضد زنگ 304' },
];

const specifications = [
    {
        title: 'مشخصات فنی',
        specs: [
            { label: 'ظرفیت تولید', value: '30 لیتر در ساعت' },
            { label: 'نوع کمپرسور', value: 'کمپرسور اسکرو ایتالیایی Copeland' },
            { label: 'سیستم سرمایش', value: 'سیستم خنک‌کننده دوبل گاز R404A' },
            { label: 'توان موتور', value: '3.5 کیلووات' },
            { label: 'سیستم کنترل', value: 'پنل دیجیتال PLC نمایشگر لمسی' },
            { label: 'دمای کاری', value: '-8 تا -12 درجه سانتیگراد' },
        ],
    },
    {
        title: 'مشخصات الکتریکی',
        specs: [
            { label: 'ولتاژ', value: '380 ولت سه فاز' },
            { label: 'فرکانس', value: '50 هرتز' },
            { label: 'مصرف برق', value: '3.5 کیلووات' },
            { label: 'نوع پلاگ', value: 'صنعتی سه فاز' },
        ],
    },
    {
        title: 'ابعاد و وزن',
        specs: [
            { label: 'طول', value: '120 سانتی‌متر' },
            { label: 'عرض', value: '75 سانتی‌متر' },
            { label: 'ارتفاع', value: '145 سانتی‌متر' },
            { label: 'وزن خالص', value: '280 کیلوگرم' },
        ],
    },
];

const reviews = [
    {
        id: 1,
        customerName: 'محمد رضایی',
        businessType: 'بستنی‌فروشی رضوان - تهران',
        rating: 5,
        comment: 'دستگاه فوق‌العاده‌ای است. 8 ماهه که استفاده می‌کنیم و هیچ مشکلی نداشتیم.',
        date: '2 ماه پیش',
    },
    {
        id: 2,
        customerName: 'احمد کریمی',
        businessType: 'کارخانه بستنی سحر - اصفهان',
        rating: 5,
        comment: 'کیفت ساخت ایتالیایی برای کارخانه 3 دستگاه خریدیم. پیشنهاد می‌کنم.',
        date: '4 ماه پیش',
    },
];

export default function ProductPage() {
    const [activeTab, setActiveTab] = useState('desc');

    return (
        <div className="min-h-screen bg-white" dir="rtl">

            {/* Breadcrumb */}
            <div className="border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 py-3 text-xs text-gray-500">
                    <span>فروشگاه اینترنتی آیس سنتر</span>
                    <span className="mx-2">/</span>
                    <span>تجهیزات صنعتی</span>
                    <span className="mx-2">/</span>
                    <span className="font-bold text-gray-800">دستگاه بستنی‌ساز</span>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 py-6">

                {/* Top Section: Gallery, Info, BuyBox */}
                {/* Desktop: 3 Columns. Mobile/Tablet: Stacked */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 border-b border-gray-100 pb-10">

                    {/* Right: Gallery (approx 33%) */}
                    <div className="lg:col-span-4">
                        <ProductImageGallery images={product.images} productName={product.name} />
                    </div>

                    {/* Center: Product Info (approx 42%) */}
                    <div className="lg:col-span-5 relative">
                        <ProductInfo product={product} advantages={advantages} />
                    </div>

                    {/* Left: Buy Box (approx 25%) */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-100 p-2 rounded-xl lg:sticky lg:top-4">
                            <PricingBox product={product} />
                        </div>
                    </div>

                </div>

                {/* Trust / Services Section - Full Width */}
                <TrustBadges />

                {/* Content Sections with Sticky Tabs */}
                <div className="mt-8">
                    <ProductTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        tabs={[
                            { id: 'desc', label: 'نقد و بررسی' },
                            { id: 'specs', label: 'مشخصات' },
                            { id: 'comments', label: 'دیدگاه‌ها' },
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-9 space-y-12">

                            {/* Description Section */}
                            <section id="desc" className="bg-white scroll-mt-24">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 border-r-4 border-red-500 pr-3">نقد و بررسی تخصصی</h2>
                                <div className="text-gray-700 leading-8 text-justify">
                                    <p className="mb-4">{product.description}</p>
                                    <p>طراحی ارگونومیک و استفاده از متریال درجه یک، این دستگاه را به یکی از محبوب‌ترین انتخاب‌ها در بازار تبدیل کرده است. سیستم شستشوی خودکار باعث صرفه‌جویی در زمان شده و پنل لمسی امکان کنترل دقیق تمامی پارامترها را فراهم می‌کند.</p>
                                </div>
                            </section>

                            {/* Specs Section */}
                            <section id="specs" className="scroll-mt-24">
                                <ProductSpecifications categories={specifications} />
                            </section>

                            {/* Reviews Section */}
                            <section id="comments" className="scroll-mt-24">
                                <ProductReviews reviews={reviews} averageRating={4.7} totalReviews={reviews.length} />
                            </section>

                        </div>

                        {/* Sidebar Banners or Similar Products could go here */}
                        <div className="hidden lg:block lg:col-span-3">
                            <div className="sticky top-24 space-y-4">
                                <MiniPricingBox product={product} />

                                <SimilarProducts />

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                                    <p className="text-xs text-gray-500 leading-6">
                                        با اطمینان خرید کنید. پشتیبانی ۲۴ ساعته ما در کنار شماست.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </main>

            <MobileActionBar product={product} />
        </div>
    );
}
