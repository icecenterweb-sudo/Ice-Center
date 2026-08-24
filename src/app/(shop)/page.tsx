// ============================================
// HOMEPAGE - CACHE COMPONENTS ARCHITECTURE (5 min TTL)
// ============================================
// - Page shell uses connection() for build safety with cacheComponents
// - All data queries use "use cache" layer in lib/cache/homepage.ts
// - Tag-based invalidation via 'homepage' cache tags on mutations
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
  BadgeCheck
} from 'lucide-react';

// Cached queries from isolated file
import {
  getCachedCategories,
  getCachedCategoryProducts,
  getCachedBlogPosts,
  getCachedSlides,
  getCachedDoubleBanners,
  getCachedSingleBanners,
  getCachedOffers,
  type BlogPostForDisplay,
  type SlideForDisplay,
  type BannerForDisplay,
  type ProductForDisplay,
  type CategoryForDisplay,
} from '@/lib/cache/homepage';

import { toPersianDigits } from '@/lib/persian';

// Client components
import HeroCarousel from '@/components/home/HeroCarousel';
import OfferCarousel from '@/components/home/OfferCarousel';
import ScrollDriftIcon from '@/components/home/ScrollDriftIcon';

// Skeletal fallback while streaming
import { HeroSkeleton } from '@/components/home/Skeletons';

// ============================================
// Helper Sub-components (Server Side)
// ============================================

interface HeroPromoAreaProps {
  slides?: SlideForDisplay[];
  doubleBanners?: BannerForDisplay[];
}

interface HeroBannerItem {
  image: string;
  link: string;
  alt: string;
  isDouble?: boolean;
  desktopImage?: string;
  mobileImage?: string;
}

// 1. Hero Promotional Area (Desktop single-card slider / Mobile carousel synced with Admin Panel)
function HeroPromoArea({ slides = [], doubleBanners = [] }: HeroPromoAreaProps) {
  const defaultHeroBanners: HeroBannerItem[] = [
    {
      image: '/uploads/custom/banner_ice_cream_persian.png',
      link: '/categories/soft-ice-machines',
      alt: 'دستگاه بستنی قیفی شمس، مدل سناتور جدید',
      isDouble: true,
    },
    {
      image: '/uploads/custom/hero_juicer.png',
      link: '/categories/juice-and-blender',
      alt: 'آبمیوه‌گیری و مخلوط‌کن صنعتی',
      isDouble: false,
    },
    {
      image: '/uploads/custom/hero_coffee.png',
      link: '/categories/drink-machines',
      alt: 'اسپرسوساز و تجهیزات کافی‌شاپ',
      isDouble: false,
    },
  ];

  let mapped: HeroBannerItem[] = [];

  if (slides && slides.length > 0) {
    mapped = slides.map((s, idx) => ({
      image: s.desktopImage,
      desktopImage: s.desktopImage,
      mobileImage: s.mobileImage,
      link: s.link,
      alt: s.alt,
      isDouble: idx === 0,
    }));
  } else if (doubleBanners && doubleBanners.length > 0) {
    mapped = doubleBanners.map((b, idx) => ({
      image: b.desktopImage,
      desktopImage: b.desktopImage,
      mobileImage: b.mobileImage,
      link: b.link,
      alt: b.alt || b.title,
      isDouble: idx === 0,
    }));
  }

  // Ensure 3 banner covers (Right double + Middle single + Left single) always fill all 4 grid columns
  const heroBanners = [
    mapped[0] || defaultHeroBanners[0],
    mapped[1] || defaultHeroBanners[1],
    mapped[2] || defaultHeroBanners[2],
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
    <div className="w-full bg-[#0A1424] noise-overlay border border-slate-800 text-white rounded-2xl md:rounded-[32px] px-4 py-4 md:px-10 md:py-6 mb-10 md:mb-16 shadow-[0_12px_40px_rgba(8,31,55,0.15)] select-none">
      {/* Mobile: horizontal scroll row | Desktop: 5-column grid */}
      <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-6 text-right overflow-x-auto scrollbar-hide md:overflow-visible">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col items-center text-center md:flex-row md:items-start md:text-right gap-2 md:gap-3 group shrink-0 min-w-[100px] md:min-w-0">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.colorClass}`}>
                <Icon size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-bold text-slate-100 leading-normal">{item.title}</span>
                <span className="hidden md:block text-[10px] text-slate-400 mt-1 leading-relaxed">{item.subtitle}</span>
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
  popularProducts?: ProductForDisplay[];
  newestProducts?: ProductForDisplay[];
  juicerProducts?: ProductForDisplay[];
  iceCreamProducts?: ProductForDisplay[];
}

// Single product card used inside product grids
function TopProductCard({ p }: { p: ProductForDisplay }) {
  const isCallForPrice = p.price === 0 || p.price === null || p.price === undefined;
  return (
    <Link
      href={p.href}
      className="group bg-white border border-gray-100 rounded-[20px] flex flex-col justify-between select-none shadow-[0_4px_15px_rgba(8,31,55,0.02)] overflow-hidden interactive-card-hover shrink-0 w-[160px] sm:w-[190px] md:w-auto snap-start"
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
      <div className="flex flex-col text-right mt-4 px-3 md:px-4 pb-3 md:pb-4">
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

function TopProductsSection({
  popularProducts = [],
  newestProducts = [],
  juicerProducts = [],
  iceCreamProducts = []
}: TopProductsProps) {
  const popularRow = popularProducts.slice(0, 5);
  const newestRow = newestProducts.slice(0, 5);
  const juicerRow = juicerProducts.slice(0, 5);
  const iceCreamRow = iceCreamProducts.slice(0, 5);

  return (
    <div className="w-full mb-10 md:mb-16">
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start">

        {/* Left Side (Desktop): Vertical Warranty Card — sticky wrapper. */}
        <div className="hidden lg:block w-full lg:w-72 shrink-0 self-start lg:sticky lg:top-28">
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

        {/* Right Side (Desktop): Product Grids */}
        <div className="flex-grow flex flex-col w-full">
          {/* Block 1: Popular Equipment */}
          <div className="flex justify-between items-center mb-5 px-1">
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">محبوب‌ترین تجهیزات صنعتی</h2>
            <Link href="/products" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide snap-x md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 pb-2 -mx-1 px-1 md:mx-0 md:px-0">
            {popularRow.map((p) => (
              <TopProductCard key={p.id} p={p} />
            ))}
          </div>

          {/* Block 2: Ice Cream Machines & Batch Freezers */}
          <div className="flex justify-between items-center mb-4 md:mb-5 mt-6 md:mt-10 px-1">
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">دستگاه بستنی ساز و بارسفت کن</h2>
            <Link href="/categories/soft-ice-machines" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide snap-x md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 pb-2 -mx-1 px-1 md:mx-0 md:px-0">
            {iceCreamRow.map((p) => (
              <TopProductCard key={p.id} p={p} />
            ))}
          </div>

          {/* Block 3: Juicers & Blenders */}
          <div className="flex justify-between items-center mb-4 md:mb-5 mt-6 md:mt-10 px-1">
            <h2 className="fluid-heading font-extrabold text-midnight text-balance">آبمیوه گیری و مخلوط کن</h2>
            <Link href="/categories/juice-and-blender" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide snap-x md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 pb-2 -mx-1 px-1 md:mx-0 md:px-0">
            {juicerRow.map((p) => (
              <TopProductCard key={p.id} p={p} />
            ))}
          </div>

          {/* Block 4: Recently Added Products (sorted strictly by createdAt: desc) */}
          {newestRow.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-4 md:mb-5 mt-6 md:mt-10 px-1">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-breeze text-midnight font-extrabold text-[10px] md:text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                    جدید
                  </span>
                  <h2 className="fluid-heading font-extrabold text-midnight text-balance">جدیدترین محصولات افزوده‌شده</h2>
                </div>
                <Link href="/products" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1">
                  <span>مشاهده همه</span>
                  <ArrowLeft size={13} />
                </Link>
              </div>

              <div className="flex overflow-x-auto scrollbar-hide snap-x md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 pb-2 -mx-1 px-1 md:mx-0 md:px-0">
                {newestRow.map((p) => (
                  <TopProductCard key={p.id} p={p} />
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// 4. Shop By Category (Vibrant blue offset folder shape backdrop - mapping DB categories)
interface CategorySectionProps {
  categories: CategoryForDisplay[];
}
function ShopByCategorySection({ categories }: CategorySectionProps) {
  if (!categories || categories.length === 0) return null;

  // On mobile display up to 9 categories in a clean 3x3 grid
  const displayCategories = categories;

  return (
    <div className="w-full mb-12 md:mb-20 px-2 md:px-4">
      <div className="text-center mb-6 md:mb-12">
        <h2 className="fluid-heading-lg font-extrabold text-midnight text-balance">دسته بندی محصولات</h2>
      </div>

      {/* Grid: 3 columns x 3 rows on mobile, flex-wrap on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap md:justify-center gap-x-3 gap-y-7 md:gap-x-6 md:gap-y-12 max-w-6xl mx-auto">
        {displayCategories.map((c, i) => {
          const categoryImage = c.image || '/no-image.svg';
          const subText = c.subcategories && c.subcategories.length > 0
            ? c.subcategories.slice(0, 2).map((s: { name: string }) => s.name).join(' ، ') + ' و ...'
            : 'تجهیزات و لوازم جانبی';

          return (
            <Link 
              key={c.id || i} 
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center text-center select-none md:w-48 lg:w-52 md:shrink-0"
            >
              <div className="w-26 h-30 sm:w-32 sm:h-40 md:w-44 md:h-52 relative flex items-center justify-center mb-2 md:mb-4">
                {/* Vibrant blue offset backdrop — rounded & enlarged on mobile */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-gradient-to-br from-royal via-ocean to-steel rounded-2xl md:rounded-[22px] absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 -z-10 shadow-[0_12px_30px_rgba(0,0,0,0)] group-hover:scale-105 transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]" />

                {/* Oversized product image — enlarged for bold visual impact */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 relative select-none pointer-events-none z-10 flex items-center justify-center drop-shadow-[0_14px_18px_rgba(15,23,42,0.18)]">
                  <Image
                    src={categoryImage}
                    alt={c.name}
                    width={192}
                    height={192}
                    className="object-contain max-h-[110px] sm:max-h-[144px] md:max-h-[192px] transform group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center w-full px-1 md:px-2">
                <h4 className="text-[11px] sm:text-sm md:text-base font-extrabold text-gray-800 group-hover:text-ocean transition-colors line-clamp-1 w-full">
                  {c.name}
                </h4>
                <p className="hidden sm:block text-[10px] md:text-xs text-ocean font-bold mt-1 md:mt-1.5 leading-relaxed line-clamp-1 w-full">
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
  products: ProductForDisplay[];
}
function TwoColumnPromoModule({ products }: PromoProps) {
  const displayProducts = products.length >= 4 ? products.slice(0, 4) : products;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-4 md:gap-6 mb-10 md:mb-16 items-start">

      {/* Column A: Spare Parts feature panel (dark, single strong message). */}
      <div className="self-start lg:sticky lg:top-28">
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
  products?: unknown[];
  singleBanners?: BannerForDisplay[];
}
function StandBannerTrio({ singleBanners = [] }: StandBannerTrioProps) {
  const defaultBanners = [
    {
      href: '/categories/soft-ice-machines',
      image: '/uploads/custom/hero_ice_cream.png',
      badge: 'پرفروش‌ترین',
      badgeClass: 'bg-orange-500',
      title: 'بستنی‌سازهای قیفی صنعتی',
      subtitle: 'موتور ایتالیایی، بازدهی بالا و کیفیت تضمینی',
    },
    {
      href: '/categories/hardening-machines',
      image: '/uploads/custom/hero_ice_cream.png',
      badge: 'ویژه بستنی‌فروشی',
      badgeClass: 'bg-sky-breeze text-midnight',
      title: 'دستگاه‌های بار سفت‌کن صنعتی',
      subtitle: 'تولید بستنی سنتی و جلاتو با سرعت بالا',
      gradient: 'from-teal-800 via-[#081F37] to-[#0A1424]',
    },
    {
      href: '/categories/juice-and-blender',
      image: '/uploads/custom/hero_juicer.png',
      badge: 'کیفیت تضمینی',
      badgeClass: 'bg-emerald-500',
      title: 'آبمیوه و مرکبات‌گیرهای صنعتی',
      subtitle: 'بدنه استیل، تیغه مقاوم و راندمان بالا',
      gradient: 'from-[#0A1424] via-[#081F37] to-[#1E549F]',
    },
    {
      href: '/categories/refrigeration',
      image: '/uploads/custom/hero_appliances.png',
      badge: 'تحویل فوری',
      badgeClass: 'bg-purple-500',
      title: 'یخچال و فریزرهای صنعتی',
      subtitle: 'مصرف بهینه، فضای گسترده و دوام بالا',
      gradient: 'from-[#0A1424] via-[#102A43] to-[#334E68]',
    },
  ];

  const badgeClasses = ['bg-orange-500', 'bg-sky-breeze text-midnight', 'bg-emerald-500', 'bg-purple-500'];

  const banners = (singleBanners && singleBanners.length > 0)
    ? singleBanners.map((b, idx) => ({
        href: b.link,
        image: b.desktopImage,
        badge: 'ویژه',
        badgeClass: badgeClasses[idx % badgeClasses.length],
        title: b.title,
        subtitle: b.alt || 'تجهیزات تخصصی سرمایشی',
      }))
    : defaultBanners;

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-16">
      {banners.map((b, i) => (
        <Link
          key={i}
          href={b.href}
          className="group relative flex flex-col justify-end overflow-hidden rounded-2xl md:rounded-[24px] text-white shadow-md hover:shadow-xl transition-shadow aspect-[4/5] lg:aspect-[9/16] select-none"
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
          <span className={`absolute top-2 right-2 md:top-4 md:right-4 z-10 inline-block text-[9px] md:text-[10px] font-bold text-white px-2 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg shadow-sm ${b.badgeClass}`}>
            {b.badge}
          </span>

          {/* Content anchored to the bottom */}
          <div className="relative z-10 p-3 md:p-5 text-right">
            <h3 className="text-sm md:text-lg font-extrabold leading-snug">{b.title}</h3>
            <p className="hidden sm:block text-[11px] md:text-xs text-slate-200 mt-1 md:mt-2 leading-relaxed">
              {b.subtitle}
            </p>

            {/* CTA */}
            <div className="mt-2 md:mt-4 flex items-center justify-between text-[10px] md:text-xs font-bold bg-white/10 group-hover:bg-white/20 border border-white/15 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors backdrop-blur-sm">
              <span>مشاهده محصولات</span>
              <ArrowLeft size={12} className="md:w-3.5 md:h-3.5 group-hover:-translate-x-0.5 transition-transform" />
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
function BlogSection({ posts }: BlogSectionProps) {
  if (!posts || posts.length === 0) return null;

  const leadPost = posts[0];
  const sidePosts = posts.slice(1, 4);

  return (
    <div className="w-full mb-12 md:mb-20 px-1 md:px-4">
      {/* Section Title */}
      <div className="flex justify-between items-center mb-6 md:mb-10 border-b border-gray-100 pb-4">
        <div>
          <h2 className="fluid-heading-lg font-extrabold text-midnight">مجله تخصصی سرمایش و بستنی</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">آخرین مقالات، راهنمای خرید و اخبار صنعتی</p>
        </div>
        <Link href="/blog" className="text-xs font-bold text-ocean hover:text-royal transition flex items-center gap-1 shrink-0">
          <span>مشاهده همه مقالات</span>
          <ArrowLeft size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead Article (Left 7 Cols) */}
        {leadPost && (
          <Link
            href={`/blog/${leadPost.slug}`}
            className="lg:col-span-7 group relative flex flex-col justify-end overflow-hidden rounded-2xl md:rounded-[24px] text-white shadow-sm hover:shadow-xl transition-all h-[200px] sm:h-[280px] md:h-[360px] select-none"
          >
            <Image
              src={leadPost.coverImage || leadPost.thumbnail || '/no-image.svg'}
              alt={leadPost.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
              sizes="(max-width: 1024px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />
            
            <div className="relative z-10 p-5 md:p-8 text-right">
              <span className="inline-block bg-sky-breeze text-midnight text-[10px] md:text-xs font-extrabold px-3 py-1 rounded-full mb-3 shadow-sm">
                مقاله برتر
              </span>
              <h3 className="text-base sm:text-xl md:text-2xl font-black text-white leading-tight group-hover:text-sky-breeze transition-colors line-clamp-2">
                {leadPost.title}
              </h3>
              {leadPost.summary && (
                <p className="text-xs md:text-sm text-gray-200 mt-2 line-clamp-2 leading-relaxed hidden sm:block max-w-2xl">
                  {leadPost.summary}
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Side Articles (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {sidePosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex gap-4 p-3 rounded-2xl bg-white border border-gray-150 hover:border-sky-breeze shadow-xs hover:shadow-md transition-all select-none items-center"
            >
              <div className="relative w-24 sm:w-32 md:w-36 h-20 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <Image
                  src={post.thumbnail || post.coverImage || '/no-image.svg'}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="144px"
                />
              </div>
              <div className="flex flex-col justify-center text-right flex-1 min-w-0 pr-1">
                <h4 className="text-xs sm:text-sm font-extrabold text-midnight group-hover:text-ocean transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </h4>
                {post.summary && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                    {post.summary}
                  </p>
                )}
              </div>
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
    { newestProducts, popularProducts, juicerProducts, iceCreamProducts, fridgeProducts },
    blogPosts,
    dbSlides,
    dbDoubleBanners,
    dbSingleBanners,
    dbOffers,
  ] = await Promise.all([
    getCachedCategories(),
    getCachedCategoryProducts(),
    getCachedBlogPosts(5),
    getCachedSlides().catch(() => []),
    getCachedDoubleBanners().catch(() => []),
    getCachedSingleBanners().catch(() => []),
    getCachedOffers().catch(() => []),
  ]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 pt-3 md:pt-5">
      
      {/* 1. Hero Promo Area (Client Carousel synced with Admin Panel) */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroPromoArea slides={dbSlides} doubleBanners={dbDoubleBanners} />
      </Suspense>

      {/* 2. Capsule-shaped Trust Bar */}
      <TrustBar />

      {/* 2.5 Active Offers Carousel (synced with Admin Panel) */}
      {dbOffers && dbOffers.length > 0 && (
        <div className="w-full mb-10 md:mb-16">
          <OfferCarousel offers={dbOffers} />
        </div>
      )}

      {/* 3. Top Products Grid + Sticky Warranty Sidebar (Includes Popular, Recently Added, Juicers, and Ice Cream blocks) */}
      <TopProductsSection
        popularProducts={popularProducts}
        newestProducts={newestProducts}
        juicerProducts={juicerProducts}
        iceCreamProducts={iceCreamProducts}
      />

      {/* 5. Stand promotional banners (Synced with Admin Panel) */}
      <StandBannerTrio products={newestProducts} singleBanners={dbSingleBanners} />

      {/* 4. Two-Column Promo Module */}
      <TwoColumnPromoModule products={[...fridgeProducts, ...popularProducts, ...newestProducts].slice(0, 4)} />

      {/* 6. Shop by Category with custom group coding */}
      <ShopByCategorySection categories={dbCategories} />

      {/* 7. Blog / Magazine Section (before footer) */}
      <BlogSection posts={blogPosts} />

    </div>
  );
}
