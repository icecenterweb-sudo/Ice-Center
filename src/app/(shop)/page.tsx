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

// ✅ ONLY cached queries from isolated file
import {
  getCachedSlides,
  getCachedCategories,
  getCachedOffers,
  getCachedCategoryProducts,
  getCachedSingleBanners,
  getCachedDoubleBanners,
  getCachedBlogPosts,
} from '@/lib/cache/homepage';

// Components
import HeroSlider from '@/components/home/HeroSlider';
import CategorySection from '@/components/home/CategorySection';
import AmazingOfferCarousel from '@/components/home/OfferCarousel';
import ProductCarousel from '@/components/home/ProductCarousel';
import BannerSection from '@/components/home/BannerSection';
import BlogCarousel from '@/components/home/BlogCarousel';

// Skeletons
import {
  HeroSkeleton,
  CategorySkeleton,
  OfferSkeleton,
  ProductCarouselSkeleton,
  BannerSkeleton,
  BlogSkeleton
} from '@/components/home/Skeletons';

// ============================================
// Async Server Components (Use cached data)
// ============================================

async function HeroSection() {
  const slides = await getCachedSlides();
  return <HeroSlider slides={slides} />;
}

async function CategorySectionWrapper() {
  const categories = await getCachedCategories();
  return <CategorySection categories={categories} />;
}

async function OfferSectionWrapper() {
  const offers = await getCachedOffers();
  return <AmazingOfferCarousel offers={offers} />;
}

async function SingleBannerSection() {
  const banners = await getCachedSingleBanners();
  return (
    <BannerSection
      banners={banners}
      heightClass="aspect-[3/1] md:aspect-auto md:h-[250px] lg:h-[180px] xl:h-[210px]"
    />
  );
}

async function ProductCarouselsSection() {
  // Fetch cached data in parallel
  const [{ categories, newestProducts }, doubleBanners] = await Promise.all([
    getCachedCategoryProducts(),
    getCachedDoubleBanners(),
  ]);

  return (
    <>
      {newestProducts.length > 0 && (
        <ProductCarousel
          title="جدیدترین محصولات"
          products={newestProducts}
          viewAllHref="/products"
        />
      )}

      {categories.map((category, index) => (
        <div key={category.id}>
          <ProductCarousel
            title={category.name}
            products={category.products}
            viewAllHref={`/categories/${category.slug}`}
          />

          {index === 1 && (
            <BannerSection
              banners={doubleBanners}
              heightClass="aspect-[3/1] md:aspect-auto md:h-[250px] lg:h-[180px] xl:h-[180px]"
            />
          )}
        </div>
      ))}
    </>
  );
}

async function BlogSectionWrapper() {
  const posts = await getCachedBlogPosts(6);
  return <BlogCarousel posts={posts} />;
}

// ============================================
// Main Page Component with Streaming
// ============================================

export default function Home() {
  return (
    <>
      {/* Hero: Lightweight, quick load */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Categories: Small data */}
      <Suspense fallback={<CategorySkeleton />}>
        <CategorySectionWrapper />
      </Suspense>

      {/* Offers: Featured deals */}
      <Suspense fallback={<OfferSkeleton />}>
        <OfferSectionWrapper />
      </Suspense>

      {/* Products: Heaviest section - streams independently */}
      <Suspense fallback={
        <>
          <ProductCarouselSkeleton />
          <BannerSkeleton />
          <ProductCarouselSkeleton />
          <ProductCarouselSkeleton />
        </>
      }>
        <ProductCarouselsSection />
      </Suspense>

      {/* Single Banner */}
      <Suspense fallback={<BannerSkeleton />}>
        <SingleBannerSection />
      </Suspense>

      {/* Blog: Independent of products */}
      <Suspense fallback={<BlogSkeleton />}>
        <BlogSectionWrapper />
      </Suspense>
    </>
  );
}
