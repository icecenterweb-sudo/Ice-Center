// ============================================
// HOMEPAGE - FULLY CACHED (5 min TTL)
// ============================================
// ❌ Do NOT import from lib/offers/queries.ts
// ❌ Do NOT import from lib/blog/queries.ts  
// ❌ Do NOT use connection(), cookies(), headers()
// ❌ Do NOT use new Date() in UI layer
// ✅ Only import from lib/cache/homepage.ts
// ============================================

import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  Truck,
  MessageSquare,
  RotateCcw,
  ChevronLeft,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Newspaper,
  CalendarDays,
  BadgeCheck
} from 'lucide-react';

// Cached queries from isolated file
import {
  getCachedCategories,
  getCachedCategoryProducts,
  getCachedBlogPosts,
  type BlogPostForDisplay,
} from '@/lib/cache/homepage';

import { formatPersianCurrency, toPersianDigits } from '@/lib/persian';

// Client components
import HeroCarousel from '@/components/home/HeroCarousel';
import ScrollDriftIcon from '@/components/home/ScrollDriftIcon';

// Skeletal fallback while streaming
import { HeroSkeleton } from '@/components/home/Skeletons';

// ============================================
// Helper Sub-components (Server Side)
// ============================================

// 1. Hero Promotional Area (Desktop single-card slider / Mobile carousel)
function HeroPromoArea() {
  const heroBanners = [
    {
      bg: 'bg-gradient-to-br from-teal-800 via-teal-900 to-[#0A1424] text-white',
      accent: 'تجهیزات کافی‌شاپ و بستنی',
      title: 'دستگاه بستنی قیفی شمس، مدل سناتور جدید',
      badge: '۱۸ ماه گارانتی شرکتی و نصب رایگان سراسر کشور',
      image: '/uploads/products/1781933621437-wmnkpa6dorxel02sn1gx.jpg',
      link: '/products/dstgah-bstny-ghyfy-shms-mdl-snatvr',
      isDouble: true,
    },
    {
      bg: 'bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#0A1424] text-white',
      accent: 'تضمین اصالت و گارانتی طلایی',
      title: 'آبمیوه‌گیری ایتالیایی سیدو Ceado ES900',
      badge: 'موتور پرقدرت و بادوام اصلی ایتالیا',
      image: '/uploads/products/0a5a6d9d-ffe6-446c-9e8e-ccf44d85249b.webp',
      link: '/products/bmyvhgyry-aytalyayy-sydv-mdl-ceado-es900',
      isDouble: false,
    },
    {
      bg: 'bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#0A1424] text-white',
      accent: 'صنایع برودتی البرز سرمایش',
      title: 'دستگاه بارسفت کن تنوری البرز',
      badge: 'طرح ویژه خرید اقساطی بلند مدت بدون ضامن',
      image: '/uploads/products/1781933614219-yudsihpnpsnzocft1yrk.jpg',
      link: '/products/alborz-batch-freezer',
      isDouble: false,
    },
  ];

  return <HeroCarousel banners={heroBanners} />;
}

// 2. Trust Bar (Deeply rounded capsule bar - appears exactly once)
function TrustBar() {
  const items = [
    {
      icon: ShieldCheck,
      colorClass: 'text-sky-breeze bg-ocean/10 hover:bg-ocean/20',
      title: 'ضمانت اصالت کالا',
      subtitle: '۱۸ ماه گارانتی رسمی',
    },
    {
      icon: Truck,
      colorClass: 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20',
      title: 'ارسال بیمه‌شده سراسری',
      subtitle: 'تحویل فوری درب پروژه',
    },
    {
      icon: Wrench,
      colorClass: 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20',
      title: 'پشتیبانی فنی تضمینی',
      subtitle: 'تامین قطعات تا ۱۰ سال',
    },
    {
      icon: MessageSquare,
      colorClass: 'text-sky-breeze bg-ocean/10 hover:bg-ocean/20',
      title: 'مشاوره تخصصی رایگان',
      subtitle: 'چیدمان و تجهیز رستوران',
    },
    {
      icon: RotateCcw,
      colorClass: 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20',
      title: 'ضمانت ۱۰ روزه بازگشت',
      subtitle: 'امکان عودت بی‌قید و شرط',
    },
  ];

  return (
    <div className="w-full bg-[#0A1424] noise-overlay border border-slate-800 text-white rounded-[32px] px-6 py-5 md:px-10 md:py-6 mb-16 shadow-[0_12px_40px_rgba(8,31,55,0.15)] select-none">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-right">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-right gap-3 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.colorClass}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-100 leading-normal">{item.title}</span>
                <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. Top Products and Vertical Sticky Sidebar
interface TopProductsProps {
  products: any[];
}

// Single product card used inside the popular-equipment grids
function TopProductCard({ p }: { p: any }) {
  const isCallForPrice = p.price === 0 || p.price === null || p.price === undefined;
  return (
    <Link
      href={p.href}
      className="group bg-white border border-gray-100 rounded-[20px] flex flex-col justify-between select-none shadow-[0_4px_15px_rgba(8,31,55,0.02)] overflow-hidden interactive-card-hover"
    >
      {/* Photo on neutral backdrop - Full Bleed */}
      <div className="w-full aspect-square bg-gray-50/50 overflow-hidden relative">
        <Image
          src={p.image}
          alt={p.title}
          fill
          className="object-cover image-zoom-hover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 20vw, 15vw"
        />
      </div>

      {/* Info block */}
      <div className="flex flex-col text-right mt-4 px-4 pb-4">
        <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed min-h-[36px]">
          {p.title}
        </h3>

        {/* Price / Call for price */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          {isCallForPrice ? (
            <span className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition">
              تماس برای قیمت
            </span>
          ) : (
            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-[9px] text-gray-400 font-medium">تومان</span>
              <span className="text-xs md:text-sm font-extrabold text-midnight mt-0.5">
                {toPersianDigits(p.price.toLocaleString())}
              </span>
            </div>
          )}

          <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#0A1424] group-hover:text-white transition-colors">
            <ArrowLeft size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function TopProductsSection({ products }: TopProductsProps) {
  // Filler pool guarantees at least 10 cards for the two 5-column grids
  const fillerProducts = [
    { id: 99, title: 'دستگاه اسپرسوساز صنعتی جیمبالی Cimbali M26 دو گروپ', price: 185000000, image: '/uploads/custom/hero_coffee.png', href: '/products' },
    { id: 98, title: 'آب پرتقال گیر صنعتی اتوماتیک زومکس Zumex Soul', price: 120000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 97, title: 'فریزر صندوقی درب شیشه‌ای بستنی آیس‌من ۶۰۰ لیتری', price: 42000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 96, title: 'دستگاه بستنی ساز قیفی شمس مدل سناتور سه فاز', price: 295000000, image: '/uploads/custom/hero_ice_cream.png', href: '/products' },
    { id: 95, title: 'بلندر صنعتی کاوردار همیلتون بیچ مدل HBH850', price: 68000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 94, title: 'یخساز حبه‌ای صنعتی آیس‌تک مدل IT-200 دویست کیلوگرم', price: 98000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 93, title: 'شیکر میلک‌شیک سه‌کاره صنعتی همیلتون بیچ HMD400', price: 54000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 92, title: 'ویترین بستنی تاپینگ ۱۲ لگنه صنعتی کینگ‌استار', price: 76000000, image: '/uploads/custom/hero_ice_cream.png', href: '/products' },
    { id: 91, title: 'آسیاب قهوه صنعتی ثابت‌دان مازر مدل Major', price: 62000000, image: '/uploads/custom/hero_coffee.png', href: '/products' },
    { id: 90, title: 'دستگاه قهوه‌ساز فیلتر صنعتی مارکو مدل Jet 6', price: 48000000, image: '/uploads/custom/hero_coffee.png', href: '/products' },
  ];

  const pool = [...products, ...fillerProducts];
  const firstRowProducts = pool.slice(0, 5);

  // Juicers & Blenders block — shares the right column beneath the popular grids
  const juicerFillerProducts = [
    { id: 89, title: 'آب پرتقال گیر صنعتی اتوماتیک زومکس Zumex Soul', price: 120000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 88, title: 'بلندر صنعتی کاوردار همیلتون بیچ مدل HBH850', price: 68000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 87, title: 'آبمیوه‌گیری ایتالیایی سیدو Ceado ES900', price: 145000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 86, title: 'مخلوط کن صنعتی وایتامیکس Vitamix The Quiet One', price: 98000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 85, title: 'آب هویج گیر صنعتی سانتوس Santos مدل ۲۸', price: 72000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 84, title: 'اسموتی ساز صنعتی بلندتک Blendtec مدل Connoisseur', price: 84000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 83, title: 'آبمیوه‌گیری آهسته صنعتی هوروم Hurom مدل H-AA', price: 46000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 82, title: 'مخلوط کن دو جام صنعتی وارینگ Waring MX1500', price: 58000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 81, title: 'آب انار گیر صنعتی تمام استیل مدل صنعت‌کار', price: 39000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
    { id: 80, title: 'بلندر بار صنعتی سه‌کاره همیلتون بیچ HBB250', price: 51000000, image: '/uploads/custom/hero_juicer.png', href: '/products' },
  ];
  const juicerPool = [...products, ...juicerFillerProducts];
  const juicerFirstRow = juicerPool.slice(0, 5);

  // Refrigerators & Freezers block — shares the right column beneath the juicer grids
  const fridgeFillerProducts = [
    { id: 79, title: 'یخچال ایستاده صنعتی چهار درب استیل مدل کینگ‌استار', price: 132000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 78, title: 'فریزر صندوقی درب شیشه‌ای بستنی آیس‌من ۶۰۰ لیتری', price: 42000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 77, title: 'یخچال ویترینی عمودی نوشیدنی مدل امرسان', price: 58000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 76, title: 'فریزر ایستاده صنعتی شش کشو استیل مدل الکترواستیل', price: 96000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 75, title: 'یخچال تاپینگ سالادبار صنعتی ۱.۵ متری کینگ‌استار', price: 74000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 74, title: 'یخچال زیرکانتری میزکار صنعتی سه درب استیل', price: 88000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 73, title: 'فریزر ویترینی افقی درب کشویی بستنی ۳۰۰ لیتری', price: 36000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 72, title: 'یخچال ایستاده تک درب صنعتی استیل مدل کول‌استار', price: 64000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 71, title: 'فریزر و یخچال دوقلو صنعتی استیل مدل هایسنس پرو', price: 118000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
    { id: 70, title: 'یخچال ویترینی شیرینی و کیک منحنی صنعتی', price: 82000000, image: '/uploads/custom/hero_appliances.png', href: '/products' },
  ];
  const fridgePool = [...products, ...fridgeFillerProducts];
  const fridgeFirstRow = fridgePool.slice(0, 5);

  return (
    <div className="w-full mb-16">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Side (Desktop): Vertical Warranty Card — sticky wrapper.
            NOTE: keep positioning (sticky) on THIS element only. Do NOT add
            `noise-overlay` here — that class sets `position: relative` later in
            the cascade and would silently override `position: sticky`. */}
        <div className="w-full lg:w-72 shrink-0 self-start lg:sticky lg:top-28">
          <div className="group relative overflow-hidden bg-gradient-to-br from-royal via-ocean to-steel text-white p-6 rounded-[24px] shadow-md hover:shadow-xl transition-shadow noise-overlay">
            {/* Ambient glow + oversized watermark */}
            <div className="pointer-events-none absolute -bottom-20 -left-16 w-52 h-52 bg-sky-breeze/10 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-110" />
            <ScrollDriftIcon distance={80} className="absolute -top-6 -left-6 pointer-events-none">
              <ShieldCheck
                size={140}
                strokeWidth={1.25}
                className="text-white/[0.06] rotate-12"
              />
            </ScrollDriftIcon>

            <div className="relative z-10 text-right flex flex-col">
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-sky-breeze flex items-center justify-center mb-5 ring-1 ring-white/10">
                <ShieldCheck size={22} />
              </div>
              <span className="text-[10px] text-sky-breeze font-bold uppercase tracking-[0.15em] block mb-2">
                گارانتی طلایی آیس سنتر
              </span>
              <h3 className="text-xl font-extrabold leading-snug text-balance">
                تضمین اصالت کالا و خدمات پس از فروش
              </h3>

              {/* Feature list with icons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-3 py-2.5 rounded-2xl">
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-white/10 text-sky-breeze flex items-center justify-center">
                    <BadgeCheck size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-100 leading-tight">۱۸ ماه گارانتی معتبر شرکتی</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-3 py-2.5 rounded-2xl">
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-white/10 text-sky-breeze flex items-center justify-center">
                    <Wrench size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-100 leading-tight">۱۰ سال خدمات پس از فروش</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-3 py-2.5 rounded-2xl">
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-white/10 text-sky-breeze flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-100 leading-tight">نصب و ارسال رایگان سراسر کشور</span>
                </div>
              </div>

              {/* CTA bar */}
              <Link
                href="/contact"
                className="relative z-10 mt-8 flex items-center justify-between gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3.5 rounded-2xl transition-colors"
              >
                <span>درخواست مشاوره رایگان خرید</span>
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side (Desktop): Product Grid */}
        <div className="flex-grow flex flex-col w-full">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-5 px-1">
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">محبوب‌ترین تجهیزات صنعتی</h2>
            <Link href="/products" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          {/* 5-Column Grid — single row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {firstRowProducts.map((p) => (
              <TopProductCard key={p.id} p={p} />
            ))}
          </div>

          {/* Juicers & Blenders — second block sharing the same sticky sidebar */}
          <div className="flex justify-between items-center mb-5 mt-10 px-1">
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">آبمیوه گیری و مخلوط کن</h2>
            <Link href="/products" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          {/* 5-Column Grid — single row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {juicerFirstRow.map((p) => (
              <TopProductCard key={p.id} p={p} />
            ))}
          </div>

          {/* Refrigerators & Freezers — third block sharing the same sticky sidebar */}
          <div className="flex justify-between items-center mb-5 mt-10 px-1">
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">یخچال و فریزر</h2>
            <Link href="/products" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          {/* 5-Column Grid — single row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {fridgeFirstRow.map((p) => (
              <TopProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// 4. Shop By Category (Vibrant blue offset folder shape backdrop - mapping DB categories)
interface CategorySectionProps {
  categories: any[];
}
function ShopByCategorySection({ categories }: CategorySectionProps) {
  // Split database categories dynamically into two balanced rows
  const midPoint = Math.ceil(categories.length / 2);
  const row1Categories = categories.slice(0, midPoint);
  const row2Categories = categories.slice(midPoint);

  return (
    <div className="w-full mb-20 px-4">
      <div className="text-center mb-12">
        <h2 className="fluid-heading-lg font-extrabold text-midnight text-balance">دسته بندی محصولات</h2>
      </div>

      {/* Row 1 Flex Wrapper */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-12 mb-12 max-w-6xl mx-auto">
        {row1Categories.map((c, i) => {
          const categoryImage = c.image || '/no-image.svg';
          const subText = c.subcategories && c.subcategories.length > 0
            ? c.subcategories.slice(0, 2).map((s: any) => s.name).join(' ، ') + ' و ...'
            : 'تجهیزات و لوازم جانبی';

          return (
            <Link 
              key={c.id || i} 
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center text-center select-none w-48 md:w-52 shrink-0"
            >
              <div className="w-44 h-52 relative flex items-center justify-center mb-4">
                {/* Vibrant blue offset backdrop — intentionally smaller so the product overflows it */}
                <div className="w-36 h-36 bg-gradient-to-br from-royal via-ocean to-steel rounded-[22px] absolute bottom-4 left-1/2 -translate-x-1/2 -z-10 shadow-[0_12px_30px_rgba(0,0,0,0)] group-hover:scale-105 transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]" />

                {/* Oversized product image — pops out above/around the blue pill */}
                <div className="w-48 h-48 relative select-none pointer-events-none z-10 flex items-center justify-center drop-shadow-[0_14px_18px_rgba(15,23,42,0.18)]">
                  <Image
                    src={categoryImage}
                    alt={c.name}
                    width={192}
                    height={192}
                    className="object-contain max-h-[192px] transform group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center w-full px-2">
                <h4 className="text-sm md:text-base font-extrabold text-gray-800 group-hover:text-ocean transition-colors line-clamp-1 w-full">
                  {c.name}
                </h4>
                <p className="text-[10px] md:text-xs text-ocean font-bold mt-1.5 leading-relaxed line-clamp-1 w-full">
                  {subText}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Row 2 Flex Wrapper */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-12 max-w-5xl mx-auto">
        {row2Categories.map((c, i) => {
          const categoryImage = c.image || '/no-image.svg';
          const subText = c.subcategories && c.subcategories.length > 0
            ? c.subcategories.slice(0, 2).map((s: any) => s.name).join(' ، ') + ' و ...'
            : 'تجهیزات و لوازم جانبی';

          return (
            <Link 
              key={c.id || i} 
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center text-center select-none w-48 md:w-52 shrink-0"
            >
              <div className="w-44 h-52 relative flex items-center justify-center mb-4">
                {/* Vibrant blue offset backdrop — intentionally smaller so the product overflows it */}
                <div className="w-36 h-36 bg-gradient-to-br from-royal via-ocean to-steel rounded-[22px] absolute bottom-4 left-1/2 -translate-x-1/2 -z-10 shadow-[0_12px_30px_rgba(0,0,0,0)] group-hover:scale-105 transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]" />

                {/* Oversized product image — pops out above/around the blue pill */}
                <div className="w-48 h-48 relative select-none pointer-events-none z-10 flex items-center justify-center drop-shadow-[0_14px_18px_rgba(15,23,42,0.18)]">
                  <Image
                    src={categoryImage}
                    alt={c.name}
                    width={192}
                    height={192}
                    className="object-contain max-h-[192px] transform group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  />
                </div>
              </div>
              
              <div className="flex flex-col items-center w-full px-2">
                <h4 className="text-sm md:text-base font-extrabold text-gray-800 group-hover:text-ocean transition-colors line-clamp-1 w-full">
                  {c.name}
                </h4>
                <p className="text-[10px] md:text-xs text-ocean font-bold mt-1.5 leading-relaxed line-clamp-1 w-full">
                  {subText}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// 5. Two-column Promotional Module
interface PromoProps {
  products: any[];
}
function TwoColumnPromoModule({ products }: PromoProps) {
  const displayProducts = products.length >= 4 ? products.slice(0, 4) : products;

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-[288px_1fr] gap-6 mb-16 items-start">

      {/* Column A: Spare Parts feature panel (dark, single strong message).
          NOTE: keep positioning (sticky) on the wrapper only. Do NOT add
          `noise-overlay` to the sticky element — that class sets
          `position: relative` later in the cascade and would silently
          override `position: sticky`. */}
      <div className="self-start xl:sticky xl:top-28">
        <Link
          href="/categories/spare-parts"
          className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-royal via-ocean to-steel text-white p-6 shadow-md hover:shadow-xl transition-shadow select-none noise-overlay"
        >
          {/* Ambient glow + oversized watermark */}
          <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-sky-breeze/10 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-110" />
          <ScrollDriftIcon distance={80} className="absolute -top-6 -left-6 pointer-events-none">
            <Wrench
              size={140}
              strokeWidth={1.25}
              className="text-white/[0.06] rotate-12"
            />
          </ScrollDriftIcon>

          <div className="relative z-10 text-right">
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-sky-breeze flex items-center justify-center mb-5 ring-1 ring-white/10">
              <Wrench size={22} />
            </div>
            <span className="text-[10px] text-sky-breeze font-bold uppercase tracking-[0.15em] block mb-2">
              دپارتمان خدمات فنی
            </span>
            <h3 className="text-xl font-extrabold leading-snug text-balance">
              تامین تخصصی قطعات یدکی و لوازم جانبی
            </h3>
            <p className="text-sm text-slate-200/90 mt-3 leading-relaxed">
              انواع شیر خروجی، سوپاپ، بویلر، برد الکترونیکی، پاروی همزن بستنی‌ساز و بابل‌تی، اورجینال و شرکتی با تضمین کارکرد مطمئن.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between gap-2 text-xs font-bold bg-white/10 group-hover:bg-white/20 border border-white/10 px-4 py-3 rounded-2xl transition-colors">
            <span>ورود به بخش قطعات و ...</span>
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Column B: Featured products (light frost surface for contrast) */}
      <div className="relative flex flex-col overflow-hidden rounded-[24px] bg-transparent border border-slate-200/70 p-5 md:p-6">
        {/* Header row: eyebrow + title + view-all link */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg mb-3">
              ویژه کافی‌شاپ و بستنی‌فروشی
            </span>
            <h3 className="text-lg md:text-xl font-extrabold text-midnight leading-snug text-balance">
              تجهیزات منتخب هفته با پشتیبانی کامل
            </h3>
          </div>
          <Link
            href="/products"
            className="hidden md:inline-flex items-center gap-1 shrink-0 text-xs font-bold text-ocean hover:text-royal transition-colors mt-1"
          >
            <span>مشاهده همه</span>
            <ChevronLeft size={16} />
          </Link>
        </div>

        {/* Featured product cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-auto">
          {displayProducts.map((p) => (
            <Link
              key={p.id}
              href={p.href || '/products'}
              className="group/card relative flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm select-none interactive-card-hover"
            >
              {/* Featured tag */}
              <span className="absolute top-2 right-2 z-20 bg-orange-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                ویژه
              </span>

              <div className="w-full aspect-square bg-slate-50 overflow-hidden relative">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-cover image-zoom-hover"
                  sizes="(max-width: 640px) 45vw, 200px"
                />
              </div>

              <div className="flex flex-col flex-grow text-right px-3 py-3">
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {p.title}
                </h4>
                <span className="mt-2 text-sm font-extrabold text-midnight tabular-nums">
                  {p.price > 0 ? `${toPersianDigits(p.price.toLocaleString())} تومان` : 'تماس برای قیمت'}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view-all link */}
        <Link
          href="/products"
          className="md:hidden inline-flex items-center justify-center gap-1 mt-5 text-xs font-bold text-ocean"
        >
          <span>مشاهده همه محصولات</span>
          <ChevronLeft size={16} />
        </Link>
      </div>

    </div>
  );
}

// 6. Three vertical "stand" promotional banners (side by side)
interface StandBannerTrioProps {
  products: any[];
}
function StandBannerTrio({ products: _products }: StandBannerTrioProps) {
  const banners = [
    {
      href: '/categories/ice-cream-machines',
      image: '/uploads/custom/hero_ice_cream.png',
      badge: 'پرفروش‌ترین',
      badgeClass: 'bg-orange-500',
      title: 'بستنی‌سازهای قیفی صنعتی',
      subtitle: 'موتور ایتالیایی، بازدهی بالا و کیفیت تضمینی',
    },
    {
      href: '/categories/coffee-machines',
      image: '/uploads/custom/hero_coffee.png',
      badge: 'ویژه کافی‌شاپ',
      badgeClass: 'bg-sky-breeze text-midnight',
      title: 'اسپرسوسازهای حرفه‌ای چندگروپ',
      subtitle: 'مناسب کافی‌شاپ‌های پرتردد و پرحجم',
      gradient: 'from-teal-800 via-[#081F37] to-[#0A1424]',
    },
    {
      href: '/categories/juicers',
      image: '/uploads/custom/hero_juicer.png',
      badge: 'اقساط بدون ضامن',
      badgeClass: 'bg-emerald-500',
      title: 'آبمیوه و مرکبات‌گیرهای صنعتی',
      subtitle: 'بدنه استیل، تیغه مقاوم و راندمان بالا',
      gradient: 'from-[#0A1424] via-[#081F37] to-[#1E549F]',
    },
    {
      href: '/categories/appliances',
      image: '/uploads/custom/hero_appliances.png',
      badge: 'تحویل فوری',
      badgeClass: 'bg-purple-500',
      title: 'یخچال و فریزرهای ویترینی صنعتی',
      subtitle: 'مصرف بهینه، فضای گسترده و دوام بالا',
      gradient: 'from-[#0A1424] via-[#102A43] to-[#334E68]',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
      {banners.map((b, i) => (
        <Link
          key={i}
          href={b.href}
          className="group relative flex flex-col justify-end overflow-hidden rounded-[24px] text-white shadow-md hover:shadow-xl transition-shadow aspect-[3/4] lg:aspect-[9/16] select-none"
        >
          {/* Full-bleed background image */}
          <Image
            src={b.image}
            alt={b.title}
            fill
            sizes="(max-width: 1024px) 50vw, 220px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          />

          {/* Dark gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1424]/95 via-[#0A1424]/45 to-transparent" />

          {/* Badge (top-right corner) */}
          <span className={`absolute top-4 right-4 z-10 inline-block text-[10px] font-bold text-white px-3 py-1 rounded-lg shadow-sm ${b.badgeClass}`}>
            {b.badge}
          </span>

          {/* Content anchored to the bottom */}
          <div className="relative z-10 p-5 text-right">
            <h3 className="text-base md:text-lg font-extrabold leading-snug">{b.title}</h3>
            <p className="text-[11px] md:text-xs text-slate-200 mt-2 leading-relaxed">
              {b.subtitle}
            </p>

            {/* CTA */}
            <div className="mt-4 flex items-center justify-between text-xs font-bold bg-white/10 group-hover:bg-white/20 border border-white/15 px-4 py-3 rounded-xl transition-colors backdrop-blur-sm">
              <span>مشاهده محصولات</span>
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// 7. Blog / Magazine Section (server-rendered from cached posts)
interface BlogSectionProps {
  posts: BlogPostForDisplay[];
}

function formatBlogDate(date: Date | null): string {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return '';
  }
}

function BlogSection({ posts }: BlogSectionProps) {
  // Don't render the block at all when there's nothing to show
  if (!posts || posts.length === 0) return null;

  const [lead, ...rest] = posts;
  const sidePosts = rest.slice(0, 4);

  return (
    <div className="w-full mb-20">
      {/* Section header */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div className="text-right">
          <div className="flex items-center gap-2 justify-start">
            <Newspaper size={18} className="text-ocean" />
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">مجله آیس سنتر</h2>
          </div>
          <p className="text-xs text-gray-400 mt-2">راهنمای خرید، آموزش و جدیدترین اخبار تجهیزات صنعتی و سرمایشی</p>
        </div>
        <Link
          href="/blog"
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-ocean hover:text-royal transition-colors shrink-0"
        >
          <span>مشاهده همه مقالات</span>
          <ArrowLeft size={12} className="group-hover:translate-x-[-2px] transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead article — large */}
        <Link
          href={`/blog/${lead.slug}`}
          className="relative h-[280px] md:h-[360px] rounded-[24px] overflow-hidden group shadow-md select-none block border border-gray-100 interactive-card-hover"
        >
          <Image
            src={lead.coverImage || lead.thumbnail || '/no-image.svg'}
            alt={lead.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover image-zoom-hover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1424]/95 via-black/40 to-transparent flex flex-col justify-end p-6 text-right text-white">
            {lead.publishedAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-300 mb-2 font-medium">
                <CalendarDays size={11} className="text-sky-breeze" />
                <span>{toPersianDigits(formatBlogDate(lead.publishedAt))}</span>
              </div>
            )}
            <h3 className="text-base md:text-xl font-extrabold text-slate-50 leading-snug line-clamp-2">
              {lead.title}
            </h3>
            {lead.summary && (
              <p className="text-[11px] md:text-xs text-gray-300 mt-2 font-normal leading-relaxed line-clamp-2 max-w-[95%]">
                {lead.summary}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-breeze mt-3 group-hover:text-white transition-colors">
              <span>ادامه مطلب</span>
              <ArrowLeft size={11} />
            </div>
          </div>
        </Link>

        {/* Side list — compact rows */}
        <div className="flex flex-col gap-4">
          {sidePosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-ocean/30 transition-all select-none"
            >
              <div className="relative w-32 md:w-36 aspect-video rounded-xl overflow-hidden shrink-0 bg-frost">
                <Image
                  src={post.thumbnail || post.coverImage || '/no-image.svg'}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 128px, 144px"
                  className="object-cover image-zoom-hover"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1 text-right">
                <h4 className="text-xs md:text-sm font-extrabold text-gray-800 group-hover:text-ocean transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h4>
                {post.publishedAt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2 font-medium">
                    <CalendarDays size={10} className="text-ocean" />
                    <span>{toPersianDigits(formatBlogDate(post.publishedAt))}</span>
                  </div>
                )}
              </div>
              <ChevronLeft size={16} className="text-gray-300 group-hover:text-ocean group-hover:-translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile "view all" */}
      <Link
        href="/blog"
        className="sm:hidden flex items-center justify-center gap-1.5 text-[11px] font-bold text-ocean mt-5"
      >
        <span>مشاهده همه مقالات</span>
        <ArrowLeft size={12} />
      </Link>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default async function Home() {
  await connection();

  // Load database tables in parallel
  const [
    dbCategories,
    { newestProducts },
    blogPosts
  ] = await Promise.all([
    getCachedCategories(),
    getCachedCategoryProducts(),
    getCachedBlogPosts(5),
  ]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 pt-5">
      
      {/* 1. Hero Promo Area (Client Carousel) */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroPromoArea />
      </Suspense>

      {/* 2. Capsule-shaped Trust Bar */}
      <TrustBar />

      {/* 3. Top Products Grid + Sidebar */}
      <TopProductsSection products={newestProducts} />

      {/* 5. Three vertical stand promotional banners */}
      <StandBannerTrio products={newestProducts} />

      {/* 4. Two-Column Promo Module */}
      <TwoColumnPromoModule products={newestProducts} />

      {/* 6. Shop by Category with custom group coding */}
      <ShopByCategorySection categories={dbCategories} />

      {/* 7. Blog / Magazine Section (before footer) */}
      <BlogSection posts={blogPosts} />

    </div>
  );
}
