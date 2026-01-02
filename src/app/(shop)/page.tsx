import BannerSection from '@/components/home/BannerSection';
import CategorySection from '@/components/home/CategorySection';
import HeroSlider from '@/components/home/HeroSlider';
import AmazingOfferCarousel from '@/components/home/OfferCarousel';
import ProductCarousel from '@/components/home/ProductCarousel';
import BlogCarousel from '@/components/home/BlogCarousel';
import { prisma } from '@/lib/db';
import { getRecentPosts } from '@/lib/blog/queries';
import { getCarouselOffers } from '@/lib/offers';
import { getSingleBanners, getDoubleBanners } from '@/lib/banners';

// Define product type for transformation
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

// Transform DB products to carousel format with offer-based pricing
function transformProducts(products: DBProduct[]) {
  const now = new Date();
  return products.map((p) => {
    // Calculate effective price from offers
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
      // Legacy discount
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

// Fetch categories with their products (including offer data)
async function getCategoriesWithProducts() {
  try {
    const now = new Date();
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
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
              take: 12,
            },
            _count: {
              select: { products: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform to flat structure with products
    return categories.map(category => {
      // Flatten products from all subcategories
      const products = category.subcategories.flatMap(sub => sub.products);
      const productCount = category.subcategories.reduce((sum, sub) => sum + sub._count.products, 0);

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        productCount,
        products: transformProducts(products),
      };
    }).filter(cat => cat.products.length > 0); // Only categories with products
  } catch (error) {
    console.error('Failed to fetch categories with products:', error);
    return [];
  }
}

// Fetch all categories for CategorySection
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        subcategories: {
          select: {
            _count: {
              select: { products: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      productCount: category.subcategories.reduce((sum, sub) => sum + sub._count.products, 0)
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// Fetch active slides for hero slider
async function getSlides() {
  try {
    const slides = await prisma.slide.findMany({
      where: { isActive: true },
      include: {
        product: { select: { id: true, slug: true } },
        category: { select: { id: true, slug: true } },
      },
      orderBy: { order: 'asc' },
    });

    return slides.map(slide => ({
      id: slide.id,
      desktopImage: slide.desktopImage,
      mobileImage: slide.mobileImage,
      alt: slide.alt,
      link: slide.link ||
        (slide.product ? `/products/${slide.product.slug}` : null) ||
        (slide.category ? `/categories/${slide.category.slug}` : '#'),
    }));
  } catch (error) {
    console.error('Failed to fetch slides:', error);
    return [];
  }
}



export default async function Home() {
  const [categories, categoriesWithProducts, blogPosts, offerItems, slides, singleBanners, doubleBanners] = await Promise.all([
    getCategories(),
    getCategoriesWithProducts(),
    getRecentPosts(6),
    getCarouselOffers(12),
    getSlides(),
    getSingleBanners(),
    getDoubleBanners(),
  ]);

  return (
    <>
      {/* اسلایدر اصلی */}
      <HeroSlider slides={slides} />

      {/* بخش دسته‌بندی‌ها */}
      <CategorySection categories={categories} />

      {/* تخفیف‌های ویژه */}
      <AmazingOfferCarousel offers={offerItems} />

      {/* اسلایدر جدیدترین محصولات */}
      {categoriesWithProducts.length > 0 && (
        <ProductCarousel
          title="جدیدترین محصولات"
          products={categoriesWithProducts.flatMap(cat => cat.products).slice(0, 12)}
          viewAllHref="/products"
        />
      )}

      {/* بخش بنر تکی */}
      <BannerSection
        banners={singleBanners}
        heightClass="h-[130px] md:h-[250px] lg:h-[180px] xl:h-[210px]"
      />

      {/* اسلایدرهای محصولات بر اساس دسته‌بندی */}
      {categoriesWithProducts.map((category: { id: number; name: string; slug: string; products: { id: number; title: string; image: string; price: number; oldPrice?: number; href: string }[] }, index: number) => (
        <div key={category.id}>
          <ProductCarousel
            title={category.name}
            products={category.products}
            viewAllHref={`/categories/${category.slug}`}
          />

          {/* Add banner after first 2 categories */}
          {index === 1 && (
            <BannerSection
              banners={doubleBanners}
              heightClass="h-[130px] md:h-[250px] lg:h-[180px] xl:h-[180px]"
            />
          )}
        </div>
      ))}

      {/* اسلایدر وبلاگ */}
      <BlogCarousel posts={blogPosts} />
    </>
  );
}
