'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface Slide {
  id: number;
  desktopImage: string;
  mobileImage: string;
  link: string;
  alt: string;
}

const HeroSlider: React.FC = () => {
  const slides: Slide[] = [
    {
      id: 1,
      desktopImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763996646/banner_8aea786e-9d20-4118-85ec-bcd9c03cdd1f_umupvr.jpg',
      mobileImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763996646/banner_8aea786e-9d20-4118-85ec-bcd9c03cdd1f_umupvr.jpg',
      link: '/offers/ice-cream-maker',
      alt: 'تخفیف ویژه دستگاه بستنی ساز'
    },
    {
      id: 2,
      desktopImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763997961/20250325151925_336_vsdvza.jpg',
      mobileImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763997961/20250325151925_336_vsdvza.jpg',
      link: '/offers/freezer',
      alt: 'فریزر صنعتی با گارانتی'
    },
    {
      id: 3,
      desktopImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763996706/20190226173421_988_mp1urf.jpg',
      mobileImage: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763996706/20190226173421_988_mp1urf.jpg',
      link: '/offers/ice-maker',
      alt: 'دستگاه یخ‌ساز حرفه‌ای'
    },
  ];

  return (
    <div className="w-full relative">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination-custom',
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true
        }}
        loop={true}
        className="hero-slider"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <Link href={slide.link} className="block relative">
              {/* تصویر دسکتاپ - ارتفاع ثابت */}
              <div className="hidden md:block relative w-full h-[380px]">
                <Image
                  src={slide.desktopImage}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  priority={slide.id === 1}
                  sizes="100vw"
                />
              </div>

              {/* تصویر موبایل - ارتفاع کوتاه‌تر */}
              <div className="md:hidden relative w-full h-[200px]">
                <Image
                  src={slide.mobileImage}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  priority={slide.id === 1}
                  sizes="100vw"
                />
              </div>
            </Link>
          </SwiperSlide>
        ))}

        {/* دکمه‌های Next/Prev - فقط دسکتاپ */}
        <div className="swiper-button-prev-custom hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110">
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="swiper-button-next-custom hidden md:flex absolute top-1/2 left-4 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110">
          <svg className="w-6 h-6 text-gray-800 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Pagination Dots */}
        <div className="swiper-pagination-custom absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2"></div>
      </Swiper>
    </div>
  );
};

export default HeroSlider;