import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { getRecentPosts } from '@/lib/blog/queries';
import { getCarouselOffers } from '@/lib/offers';
import { getSingleBanners, getDoubleBanners } from '@/lib/banners';
import { connection } from 'next/server';

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
// Data Fetching Functions
// ============================================

type DBProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  listPrice: number | null;
  thumbnail: string | null;
  hasActiveOffer?: boolean;
  offerProducts?: Array<{
    customDiscountValue: number | null;
    offer: { discountType: string; discountValue: number };
  }>;
};

function transformProducts(products: DBProduct[]) {
  return products.map((p) => {
    let effectivePrice = p.price;
    let originalPrice = p.listPrice || p.price;
    let hasDiscount = false;

    const activeOffer = p.offerProducts?.[0]?.offer;
    if (activeOffer) {
      const discountValue = p.offerProducts![0].customDiscountValue ?? activeOffer.discountValue;
      if (activeOffer.discountType === 'PERCENTAGE') {
        effectivePrice = originalPrice * (1 - discountValue / 100);
      } else {
        effectivePrice = originalPrice - discountValue;
      }
      hasDiscount = true;
    } else if (p.listPrice && p.listPrice > p.price) {
      effectivePrice = p.price;
      originalPrice = p.listPrice;
      hasDiscount = true;
    }

    return {
      id: p.id,
      title: p.name,
      image: p.thumbnail || 'https://via.placeholder.com/300x300?text=No+Image',
      price: Math.round(effectivePrice),
      oldPrice: hasDiscount ? originalPrice : undefined,
      href: `/products/${p.slug}`,
    };
  });
}

// ============================================
// Async Server Components (Each fetches own data)
// ============================================

async function HeroSection() {
  await connection();
  const slides = await prisma.slide.findMany({
    where: { isActive: true },
    include: {
      product: { select: { id: true, slug: true } },
      category: { select: { id: true, slug: true } },
    },
    orderBy: { order: 'asc' },
  });

  const formattedSlides = slides.map(slide => ({
    id: slide.id,
    desktopImage: slide.desktopImage,
    mobileImage: slide.mobileImage,
    alt: slide.alt,
    link: slide.link ||
      (slide.product ? `/products/${slide.product.slug}` : null) ||
      (slide.category ? `/categories/${slide.category.slug}` : '#'),
  }));

  return <HeroSlider slides={formattedSlides} />;
}

async function CategorySectionWrapper() {
  await connection();
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      subcategories: {
        select: {
          _count: { select: { products: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const formattedCategories = categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image,
    productCount: category.subcategories.reduce((sum, sub) => sum + sub._count.products, 0)
  }));

  return <CategorySection categories={formattedCategories} />;
}

async function OfferSectionWrapper() {
  await connection();
  const offerItems = await getCarouselOffers(12);
  return <AmazingOfferCarousel offers={offerItems} />;
}

async function SingleBannerSection() {
  await connection();
  const singleBanners = await getSingleBanners();
  return (
    <BannerSection
      banners={singleBanners}
      heightClass="aspect-[3/1] md:aspect-auto md:h-[250px] lg:h-[180px] xl:h-[210px]"
    />
  );
}

async function ProductCarouselsSection() {
  await connection();
  const now = new Date();

  // Limit to 4 categories, 6 products each for better performance
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subcategories: {
        select: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              listPrice: true,
              thumbnail: true,
              hasActiveOffer: true,
              offerProducts: {
                where: {
                  offer: {
                    isActive: true,
                    startDate: { lte: now },
                    endDate: { gt: now },
                  }
                },
                select: {
                  customDiscountValue: true,
                  offer: {
                    select: {
                      discountType: true,
                      discountValue: true,
                    }
                  }
                },
                take: 1
              }
            },
            take: 6,  // Reduced from 12
          },
        }
      }
    },
    orderBy: { name: 'asc' },
    take: 4  // Limit categories
  });

  const categoriesWithProducts = categories
    .map(category => {
      const products = category.subcategories.flatMap(sub => sub.products);
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        products: transformProducts(products),
      };
    })
    .filter(cat => cat.products.length > 0);

  // Get first 12 products for "newest" carousel
  const newestProducts = categoriesWithProducts.flatMap(cat => cat.products).slice(0, 12);

  // Get double banners for between categories
  const doubleBanners = await getDoubleBanners();

  return (
    <>
      {newestProducts.length > 0 && (
        <ProductCarousel
          title="جدیدترین محصولات"
          products={newestProducts}
          viewAllHref="/products"
        />
      )}

      {categoriesWithProducts.map((category, index) => (
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
  await connection();
  const blogPosts = await getRecentPosts(6);
  return <BlogCarousel posts={blogPosts} />;
}

// ============================================
// Main Page Component with Streaming
// ============================================

export default function Home() {
  return (
    <>
      {/* Hero: Loads immediately as it's lightweight */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Categories: Quick loader, small data */}
      <Suspense fallback={<CategorySkeleton />}>
        <CategorySectionWrapper />
      </Suspense>

      {/* Offers: May take a bit due to offer logic */}
      <Suspense fallback={<OfferSkeleton />}>
        <OfferSectionWrapper />
      </Suspense>

      {/* Products: The heaviest section - streams independently */}
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
