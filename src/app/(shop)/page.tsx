import BannerSection from '@/components/home/BannerSection';
import CategorySection from '@/components/home/CategorySection';
import HeroSlider from '@/components/home/HeroSlider';
import AmazingOfferCarousel from '@/components/home/OfferCarousel';

import ProductCarousel from '@/components/home/ProductCarousel';
import BlogCarousel from '@/components/home/BlogCarousel';

async function getProducts() {
  const res = await fetch('http://localhost:3000/api/products', {
    cache: 'no-store'
  });
  
  if (!res.ok) return [];
  
  const data = await res.json();
  return data.data || [];
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
      desktop: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png', // Placeholder reuse
      mobile: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png'
    },
    link: '/ice-cream-machines',
    alt: 'Ice Cream Machines'
  },
  {
    id: 3,
    image: {
      desktop: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png', // Placeholder reuse
      mobile: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764054358/banner_SingleFullWidthBanner_yk8jye_a6284428-1eb1-497b-bcbc-d9e4f93199c8_skkgva.png'
    },
    link: '/cafe-equipment',
    alt: 'Cafe Equipment'
  }
];

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      {/* اسلایدر اصلی */}
      <HeroSlider />

      {/* بخش دسته‌بندی‌ها */}
      <CategorySection />

      {/* تخفیف‌های ویژه */}
      <AmazingOfferCarousel />

      {/* بخش بنر تکی */}
      <BannerSection 
        banners={singleBanner}
        heightClass="h-[130px] md:h-[250px] lg:h-[180px] xl:h-[210px]"
      />

      {/* اسلایدر محصولات 1 */}
      <ProductCarousel title="پرفروش‌ترین بستنی‌سازها" />

      {/* اسلایدر محصولات 2 */}
      <ProductCarousel title="تجهیزات کافی‌شاپ" />

      {/* اسلایدر محصولات 3 */}
      <ProductCarousel title="دستگاه‌های آبمیوه‌گیری" />

      {/* بخش بنر دوتایی */}
      <BannerSection 
        banners={doubleBanner}
        heightClass="h-[130px] md:h-[250px] lg:h-[180px] xl:h-[180px]"
      />

      {/* اسلایدر محصولات 4 */}
      <ProductCarousel title="یخچال و فریزر صنعتی" />

      {/* اسلایدر محصولات 5 */}
      <ProductCarousel title="مواد اولیه بستنی" />

      {/* اسلایدر وبلاگ */}
      <BlogCarousel />
    </>
  );
}