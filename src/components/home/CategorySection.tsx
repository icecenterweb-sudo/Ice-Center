'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
}

const CategorySection: React.FC = () => {
  const categories: Category[] = [
    {
      id: 1,
      name: 'دستگاه بستنی‌ساز',
      slug: 'ice-cream-maker',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999156/711Jw2d2LuL_jwsd9x.jpg'
    },
    {
      id: 2,
      name: 'دستگاه یخ‌ساز',
      slug: 'ice-maker',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999174/yakhsaz-50kg-1232_adlyut.jpg'
    },
    {
      id: 3,
      name: 'فریزر صنعتی',
      slug: 'freezer',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg'
    },
    {
      id: 4,
      name: 'یخچال صنعتی',
      slug: 'refrigerator',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg'
    },
    {
      id: 5,
      name: 'آبمیوه‌گیر',
      slug: 'juice-maker',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999218/dc2c39_kz3wpy.jpg'
    },
    {
      id: 6,
      name: 'قطعات یدکی',
      slug: 'spare-parts',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999349/cp401-404-mobile-430in430-3_scz9sw.png'
    },
    {
      id: 7,
      name: 'لوازم جانبی',
      slug: 'accessories',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999349/D9_81_D8_B1_DB_8C_D8_B2-_D8_AF_D8_B1_D8_A7_DB_8C_D8_B1-_D8_AF_D9_87-_DA_A9_D8_B4_D9_88-_D8_A2_D8_B1_DB_8C_D8_A7-_D8_AA_D8_AC_D9_87_DB_8C_D8_B2_D8_A7_D8_AA_kprigf.jpg'
    },
    {
      id: 8,
      name: 'تجهیزات کافی‌شاپ',
      slug: 'cafe-equipment',
      image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999309/D9_82_D9_87_D9_88_D9_87-_D8_B3_D8_A7_D8_B2-_DA_A9_D8_A7_D9_81_DB_8C-_D8_B4_D8_A7_D9_BE-_D8_AF_D9_88-_DA_AF_D8_B1_D9_88_D9_BE-_D9_81_D8_A7_D8_A6_D9_85_D8_A7-_D9_85_D8_AF_D9_84-Dieci-A2-Tall_i9vkgd.jpg'
    },
  ];

  return (
    <section className="w-full bg-white py-8 md:py-12">
      <div className="max-w-[1600px] mx-auto px-4">
        
        {/* اسلایدر دسته‌بندی‌ها */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={16}
            slidesPerView={3}
            navigation={{
              nextEl: '.category-button-next',
              prevEl: '.category-button-prev',
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 5,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 7,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 8,
                spaceBetween: 24,
              },
            }}
            loop={categories.length > 8}
            className="category-slider"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="group flex flex-col items-center"
                >
                  {/* دایره با 2 بوردر */}
                  <div className="relative mb-3">
                    
                    {/* بوردر میانی (Ring دوم) */}
                    <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-30 lg:h-30 rounded-full border-3 border-sky-500 group-hover:border-sky-600 transition-all duration-300 bg-white">
                      
                      {/* بوردر داخلی */}
                      <div className="absolute inset-1 rounded-full border-2 border-gray-200 transition-all duration-300 overflow-hidden">
                        
                        {/* تصویر */}
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover scale-65 group-hover:scale-75 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Badge تعداد */}
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      12
                    </div>
                  </div>

                  {/* نام دسته */}
                  <span className="text-xs md:text-sm lg:text-base font-medium text-gray-700 text-center group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 px-1">
                    {category.name}
                  </span>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* دکمه‌های Navigation - فقط دسکتاپ و اگه بیش از 8 تا باشه */}
          {categories.length > 8 && (
            <>
              <button 
                className="category-button-prev hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white hover:bg-blue-50 rounded-full items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 border border-gray-200"
                aria-label="دسته قبلی"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                className="category-button-next hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white hover:bg-blue-50 rounded-full items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 border border-gray-200"
                aria-label="دسته بعدی"
              >
                <svg className="w-6 h-6 text-gray-700 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* دکمه مشاهده همه */}
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base group"
          >
            <span>مشاهده همه دسته‌بندی‌ها</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CategorySection;