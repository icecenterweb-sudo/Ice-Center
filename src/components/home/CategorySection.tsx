'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import { toPersianNumber } from '@/utils/persian';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

interface CategorySectionProps {
  categories: Category[];
}

const CategorySection: React.FC<CategorySectionProps> = ({ categories }) => {
  // Fallback placeholder image for categories without images
  const fallbackImage = 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999156/711Jw2d2LuL_jwsd9x.jpg';

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
                          src={category.image || fallbackImage}
                          alt={category.name}
                          fill
                          className="object-cover bg-blue-300 group-hover:bg-stone-300 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Badge تعداد محصولات */}
                    {category.productCount > 0 && (
                      <div className="absolute top-0 right-0 z-10 transform scale-0 group-hover:scale-100 transition-transform duration-300 origin-bottom-left">
                        <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-gradient-to-r from-blue-300 to-blue-400 px-1.5 text-[11px] md:text-xs font-bold text-white shadow-lg ring-2 ring-white">
                          {category.productCount > 99 ? '۹۹+' : toPersianNumber(category.productCount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* نام دسته */}
                  <span className="text-xs md:text-sm font-medium text-gray-700 text-center group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 px-1">
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
      </div>
    </section>
  );
};

export default CategorySection;