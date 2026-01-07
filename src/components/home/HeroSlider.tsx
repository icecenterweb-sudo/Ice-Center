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

interface HeroSliderProps {
  slides?: Slide[];
}

// Fallback slides when none from database
const fallbackSlides: Slide[] = [
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

const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  // Use provided slides or fallback
  const displaySlides = slides && slides.length > 0 ? slides : fallbackSlides;

  return (
    <div className="w-full">
      {/* Desktop Slider - Original full-width with fade effect */}
      <div className="hidden md:block relative">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={{
            nextEl: '.swiper-button-next-desktop',
            prevEl: '.swiper-button-prev-desktop',
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination-desktop',
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
          className="hero-slider-desktop"
        >
          {displaySlides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <Link href={slide.link || '#'} className="block relative">
                <div className="relative w-full h-[400px]">
                  <Image
                    src={slide.desktopImage}
                    alt={slide.alt}
                    fill
                    className="object-fill"
                    priority={index === 0}
                    sizes="100vw"
                  />
                </div>
              </Link>
            </SwiperSlide>
          ))}

          {/* Desktop Navigation Arrows */}
          <div
            className="swiper-button-prev-desktop absolute top-1/2 right-4 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110"
            role="button"
            aria-label="اسلاید قبلی"
            tabIndex={0}
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div
            className="swiper-button-next-desktop absolute top-1/2 left-4 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110"
            role="button"
            aria-label="اسلاید بعدی"
            tabIndex={0}
          >
            <svg className="w-6 h-6 text-gray-800 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Desktop Pagination Dots */}
          <div className="swiper-pagination-desktop absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2"></div>
        </Swiper>
      </div>

      {/* Mobile Slider - Digikala-style with center focus and side previews */}
      <div className="md:hidden px-4 py-3">
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={12}
          slidesPerView={1.08}
          centeredSlides={true}
          loop={true}
          pagination={{
            clickable: true,
            el: '.swiper-pagination-mobile',
            bulletClass: 'inline-block w-2 h-2 rounded-full bg-gray-300 mx-1 cursor-pointer transition-all',
            bulletActiveClass: '!bg-ocean !w-5',
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          className="hero-slider-mobile"
        >
          {displaySlides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <Link href={slide.link || '#'} className="block">
                <div className="relative w-full h-[160px] sm:h-[180px] rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={slide.mobileImage}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="95vw"
                  />
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Mobile Pagination Dots */}
        <div className="swiper-pagination-mobile flex justify-center mt-3"></div>
      </div>
    </div>
  );
};

export default HeroSlider;
