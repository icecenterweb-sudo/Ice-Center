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

type Specification = {
    title: string;
    specs: Array<{ label: string; value: string }>;
};

type ProductClientProps = {
    product: {
        id: number;
        slug: string;
        name: string;
        nameEnglish: string;
        brand: string;
        model: string;
        price: number;
        listPrice?: number | null;
        stock: number;
        inventoryStatus: string;
        rating: number;
        reviewCount: number;
        images: string[];
        thumbnail?: string | null;
        warranty: string;
        seller: string;
        description: string;
        specifications: Specification[];
        features: string[];
        categoryName: string;
        subcategoryName: string;
        sku?: string | null;
    };
};

export default function ProductClient({ product }: ProductClientProps) {
    const [activeTab, setActiveTab] = useState('desc');

    // Build advantages from features array
    const icons = [Zap, Snowflake, Settings, Award];
    const advantages = product.features.slice(0, 4).map((feature, index) => ({
        icon: icons[index % icons.length],
        title: feature,
        description: '',
    }));

    // Placeholder reviews (will come from DB later)
    const reviews = [
        {
            id: 1,
            customerName: 'کاربر ناشناس',
            businessType: 'خریدار',
            rating: 5,
            comment: 'هنوز نظری ثبت نشده است.',
            date: '-',
        },
    ];

    return (
        <div className="min-h-screen bg-white" dir="rtl">

            {/* Breadcrumb */}
            <div className="border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 py-3 text-xs text-gray-500">
                    <span>فروشگاه اینترنتی آیس سنتر</span>
                    <span className="mx-2">/</span>
                    <span>{product.categoryName}</span>
                    {product.subcategoryName && (
                        <>
                            <span className="mx-2">/</span>
                            <span>{product.subcategoryName}</span>
                        </>
                    )}
                    <span className="mx-2">/</span>
                    <span className="font-bold text-gray-800">{product.name}</span>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 py-6">

                {/* Top Section: Gallery, Info, BuyBox */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 border-b border-gray-100 pb-10">

                    {/* Right: Gallery */}
                    <div className="lg:col-span-4">
                        <ProductImageGallery images={product.images} productName={product.name} />
                    </div>

                    {/* Center: Product Info */}
                    <div className="lg:col-span-5 relative">
                        <ProductInfo product={product} advantages={advantages} />
                    </div>

                    {/* Left: Buy Box */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-100 p-2 rounded-xl lg:sticky lg:top-4">
                            <PricingBox product={product} />
                        </div>
                    </div>

                </div>

                {/* Trust Badges */}
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
                                <h2 className="text-xl font-bold text-gray-900 mb-4 border-r-4 border-blue-500 pr-3">نقد و بررسی تخصصی</h2>
                                <div className="text-gray-700 leading-8 text-justify">
                                    {product.description ? (
                                        <p className="mb-4">{product.description}</p>
                                    ) : (
                                        <p className="mb-4 text-gray-400">توضیحات محصول به زودی اضافه خواهد شد.</p>
                                    )}
                                </div>

                                {/* Features list */}
                                {product.features.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-bold text-gray-800 mb-3">ویژگی‌های کلیدی</h3>
                                        <ul className="space-y-2">
                                            {product.features.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-2 text-gray-600">
                                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>

                            {/* Specs Section */}
                            <section id="specs" className="scroll-mt-24">
                                {product.specifications.length > 0 ? (
                                    <ProductSpecifications categories={product.specifications} />
                                ) : (
                                    <div className="text-gray-400 text-center py-8">
                                        مشخصات فنی محصول به زودی اضافه خواهد شد.
                                    </div>
                                )}
                            </section>

                            {/* Reviews Section */}
                            <section id="comments" className="scroll-mt-24">
                                <ProductReviews reviews={reviews} averageRating={product.rating} totalReviews={product.reviewCount} />
                            </section>

                        </div>

                        {/* Sidebar */}
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
