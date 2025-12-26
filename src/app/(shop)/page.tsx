import BannerSection from '@/components/home/BannerSection';
import CategorySection from '@/components/home/CategorySection';
import HeroSlider from '@/components/home/HeroSlider';
import AmazingOfferCarousel from '@/components/home/OfferCarousel';

import ProductCarousel from '@/components/home/ProductCarousel';
import BlogCarousel from '@/components/home/BlogCarousel';
import { prisma } from '@/lib/db';

// Define product type for transformation
type DBProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  listPrice: number | null;
  thumbnail: string | null;
};

// Transform DB products to carousel format
function transformProducts(products: DBProduct[]) {
  return products.map((p) => ({
    id: p.id,
    title: p.name,
    image: p.thumbnail || 'https://via.placeholder.com/300x300?text=No+Image',
    price: p.price,
    oldPrice: p.listPrice || undefined,
    href: `/products/${p.slug}`,
  }));
}

// Fetch categories with their products
async function getCategoriesWithProducts() {
  try {
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
              },
              take: 12, // Limit per category
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

const singleBanner = [
  {
    id: 1,
    image: {
      desktop: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png',
      mobile: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png'
    },
    link: '/special-offer',
    alt: 'Special Offer Banner'
  }
];

const doubleBanner = [
  {
    id: 2,
    image: {
      desktop: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png',
      mobile: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png'
    },
    link: '/ice-cream-machines',
    alt: 'Ice Cream Machines'
  },
  {
    id: 3,
    image: {
      desktop: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png',
      mobile: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png'
    },
    link: '/cafe-equipment',
    alt: 'Cafe Equipment'
  }
];

export default async function Home() {
  const [categories, categoriesWithProducts] = await Promise.all([
    getCategories(),
    getCategoriesWithProducts(),
  ]);

  return (
    <>
      {/* اسلایدر اصلی */}
      <HeroSlider />

      {/* بخش دسته‌بندی‌ها */}
      <CategorySection categories={categories} />

      {/* تخفیف‌های ویژه */}
      <AmazingOfferCarousel />

      {/* بخش بنر تکی */}
      <BannerSection
        banners={singleBanner}
        heightClass="h-[130px] md:h-[250px] lg:h-[180px] xl:h-[210px]"
      />

      {/* اسلایدرهای محصولات بر اساس دسته‌بندی */}
      {categoriesWithProducts.map((category, index) => (
        <div key={category.id}>
          <ProductCarousel
            title={category.name}
            products={category.products}
            viewAllHref={`/categories/${category.slug}`}
          />

          {/* Add banner after first 2 categories */}
          {index === 1 && (
            <BannerSection
              banners={doubleBanner}
              heightClass="h-[130px] md:h-[250px] lg:h-[180px] xl:h-[180px]"
            />
          )}
        </div>
      ))}

      {/* اسلایدر وبلاگ */}
      <BlogCarousel />
    </>
  );
}
