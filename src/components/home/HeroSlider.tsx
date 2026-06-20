'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    desktopImage: '/uploads/sliders/banner_8aea786e-9d20-4118-85ec-bcd9c03cdd1f_umupvr.jpg',
    mobileImage: '/uploads/sliders/banner_8aea786e-9d20-4118-85ec-bcd9c03cdd1f_umupvr.jpg',
    link: '/offers/ice-cream-maker',
    alt: 'تخفیف ویژه دستگاه بستنی ساز'
  },
  {
    id: 2,
    desktopImage: '/uploads/sliders/20250325151925_336_vsdvza.jpg',
    mobileImage: '/uploads/sliders/20250325151925_336_vsdvza.jpg',
    link: '/offers/freezer',
    alt: 'فریزر صنعتی با گارانتی'
  },
  {
    id: 3,
    desktopImage: '/uploads/sliders/20190226173421_988_mp1urf.jpg',
    mobileImage: '/uploads/sliders/20190226173421_988_mp1urf.jpg',
    link: '/offers/ice-maker',
    alt: 'دستگاه یخ‌ساز حرفه‌ای'
  },
];

const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  // Use provided slides or fallback
  const displaySlides = slides && slides.length > 0 ? slides : fallbackSlides;

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Desktop carousel with autoplay
  const [desktopRef, desktopApi] = useEmblaCarousel(
    { loop: true, direction: 'rtl' },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  // Mobile carousel with autoplay
  const [mobileRef, mobileApi] = useEmblaCarousel(
    { loop: true, direction: 'rtl', align: 'center', containScroll: false },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    desktopApi?.scrollPrev();
  }, [desktopApi]);

  const scrollNext = useCallback(() => {
    desktopApi?.scrollNext();
  }, [desktopApi]);

  const scrollTo = useCallback((index: number) => {
    desktopApi?.scrollTo(index);
    mobileApi?.scrollTo(index);
  }, [desktopApi, mobileApi]);

  // Sync selected index
  useEffect(() => {
    if (!desktopApi) return;

    const onSelect = () => {
      setSelectedIndex(desktopApi.selectedScrollSnap());
    };

    desktopApi.on('select', onSelect);
    onSelect();

    return () => {
      desktopApi.off('select', onSelect);
    };
  }, [desktopApi]);

  useEffect(() => {
    if (!mobileApi) return;

    const onSelect = () => {
      setSelectedIndex(mobileApi.selectedScrollSnap());
    };

    mobileApi.on('select', onSelect);

    return () => {
      mobileApi.off('select', onSelect);
    };
  }, [mobileApi]);

  return (
    <div className="w-full">
      {/* Desktop Slider */}
      <div className="hidden md:block relative">
        <div className="overflow-hidden" ref={desktopRef}>
          <div className="flex">
            {displaySlides.map((slide, index) => (
              <div key={slide.id} className="flex-[0_0_100%] min-w-0">
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
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Navigation Arrows */}
        <button
          onClick={scrollNext}
          className="absolute top-1/2 right-4 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110"
          aria-label="اسلاید قبلی"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
        <button
          onClick={scrollPrev}
          className="absolute top-1/2 left-4 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110"
          aria-label="اسلاید بعدی"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Desktop Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${index === selectedIndex
                  ? 'bg-ocean w-6'
                  : 'bg-white/70 hover:bg-white'
                }`}
              aria-label={`رفتن به اسلاید ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Mobile Slider - Digikala-style with center focus and side previews */}
      <div className="md:hidden px-4 py-3">
        <div className="overflow-hidden" ref={mobileRef}>
          <div className="flex gap-3">
            {displaySlides.map((slide, index) => (
              <div key={slide.id} className="flex-[0_0_92%] min-w-0">
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
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Pagination Dots */}
        <div className="flex justify-center mt-3 gap-1.5">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === selectedIndex
                  ? 'bg-ocean w-5'
                  : 'bg-gray-300'
                }`}
              aria-label={`رفتن به اسلاید ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
