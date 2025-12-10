import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import PricingBox from '@/components/product/PricingBox';
import ProductSpecifications from '@/components/product/ProductSpecifications';
import ProductReviews from '@/components/product/ProductReviews';
import { Shield, Zap, Snowflake, Settings, Award, Wrench, Package, Phone } from 'lucide-react';

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
    description: 'دستگاه بستنی‌ساز صنعتی با ظرفیت تولید بالا، مناسب برای کارخانجات، بستنی‌فروشی‌ها و کافه‌های بزرگ. ساخت ایتالیا با کیفیت عالی و قطعات اصلی.',
};

const advantages = [
    { icon: Zap, title: 'ظرفیت تولید بالا', description: '30 لیتر در ساعت' },
    { icon: Snowflake, title: 'کمپرسور صنعتی', description: 'اسکرو ایتالیایی Copeland' },
    { icon: Settings, title: 'کنترل دیجیتال', description: 'پنل PLC هوشمند' },
    { icon: Award, title: 'استاندارد بهداشتی', description: 'استیل ضد زنگ 304' },
];

const trustBadges = [
    { icon: Shield, text: 'گارانتی 18 ماهه' },
    { icon: Wrench, text: 'نصب رایگان' },
    { icon: Package, text: 'قطعات یدکی اصلی' },
    { icon: Phone, text: '10 سال پشتیبانی' },
];

const specifications = [
    {
        title: 'مشخصات فنی',
        specs: [
            { label: 'ظرفیت تولید', value: '30 لیتر در ساعت' },
            { label: 'نوع کمپرسور', value: 'کمپرسور اسکرو ایتالیایی Copeland' },
            { label: 'سیستم سرمایش', value: 'سیستم خنک‌کننده دوبل با گاز R404A' },
            { label: 'توان موتور', value: '3.5 کیلووات' },
            { label: 'سیستم کنترل', value: 'پنل دیجیتال PLC با نمایشگر لمسی' },
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
    {
        title: 'مواد و ساخت',
        specs: [
            { label: 'بدنه خارجی', value: 'استیل ضد زنگ 304' },
            { label: 'مخزن', value: 'استیل بهداشتی با قابلیت شستشوی آسان' },
            { label: 'سیلندر', value: 'آلومینیوم آندایز شده' },
            { label: 'کشور سازنده', value: 'ایتالیا (مونتاژ ایران)' },
        ],
    },
];

const reviews = [
    {
        id: 1,
        customerName: 'محمد رضایی',
        businessType: 'بستنی‌فروشی رضوان - تهران',
        rating: 5,
        comment: 'دستگاه فوق‌العاده‌ای است. 8 ماهه که استفاده می‌کنیم و هیچ مشکلی نداشتیم. کیفیت بستنی تولیدی عالی و سرعت تولید بسیار بالاست. خدمات پس از فروش هم حرف نداره.',
        date: '2 ماه پیش',
    },
    {
        id: 2,
        customerName: 'احمد کریمی',
        businessType: 'کارخانه بستنی سحر - اصفهان',
        rating: 5,
        comment: 'برای کارخانه 3 دستگاه خریدیم. کیفیت ساخت ایتالیایی معلومه. کمپرسور قوی و سیستم کنترل دیجیتال عالیه. پیشنهاد می‌کنم حتماً بخرید.',
        date: '4 ماه پیش',
    },
    {
        id: 3,
        customerName: 'فاطمه احمدی',
        businessType: 'کافه رستوران آرامیس - شیراز',
        rating: 4,
        comment: 'دستگاه خوبیه ولی کمی سنگینه. برای نصب نیاز به فضای مناسب داره. در کل راضی هستیم و کیفیت بستنی‌ها خیلی بهتر شده.',
        date: '6 ماه پیش',
    },
];

export default function ProductPage() {
    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="max-w-[95%] mx-auto px-4 py-4">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                    <span>خانه</span>
                    <span>/</span>
                    <span>تجهیزات صنعتی</span>
                    <span>/</span>
                    <span className="text-gray-900">دستگاه بستنی‌ساز</span>
                </div>

                {/* Main Content Grid - 75/25 split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

                    {/* Left Column - Content Boxes (9 cols = 75%) */}
                    <div className="lg:col-span-9 space-y-3">

                        {/* MAIN PRODUCT BOX */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Left: Product Information */}
                                <ProductInfo product={product} advantages={advantages} />

                                {/* Right: Image Gallery */}
                                <div>
                                    <ProductImageGallery images={product.images} productName={product.name} />
                                </div>

                            </div>
                        </div>

                        {/* Product Description Box */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h2 className="text-base font-bold text-gray-900 mb-2.5 pb-2.5 border-b border-gray-200">
                                توضیحات محصول
                            </h2>
                            <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                        </div>

                        {/* Technical Specifications Box */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <ProductSpecifications categories={specifications} />
                        </div>

                        {/* Trust & Warranty Box */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                خدمات و پشتیبانی
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {trustBadges.map((badge, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-lg p-3 border border-blue-100 flex flex-col items-center text-center gap-1.5"
                                    >
                                        <badge.icon className="w-5 h-5 text-blue-600" />
                                        <span className="text-xs font-medium text-gray-900">{badge.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reviews Box */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <ProductReviews reviews={reviews} averageRating={4.7} totalReviews={reviews.length} />
                        </div>

                    </div>

                    {/* Right Column - Sticky Pricing Card (3 cols = 25%) */}
                    <div className="lg:col-span-3">
                        <div className="lg:sticky lg:top-4">
                            <PricingBox product={product} />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
