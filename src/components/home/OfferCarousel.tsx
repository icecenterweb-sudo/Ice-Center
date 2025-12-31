'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Percent } from 'lucide-react';
import DiscountBadge from '../ui/DiscountBadge';
import { toPersianDigits } from '@/lib/numbers';

// --- Mock Data ---
const products = [
  {
    id: 1,
    title: 'دستگاه بستنی ساز خانگی مدل IC-200',
    price: 12500000,
    oldPrice: 15000000,
    discount: 17,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999156/711Jw2d2LuL_jwsd9x.jpg',
  },
  {
    id: 2,
    title: 'دستگاه یخ ساز صنعتی 50 کیلوگرمی',
    price: 35000000,
    oldPrice: 42000000,
    discount: 17,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999174/yakhsaz-50kg-1232_adlyut.jpg',
  },
  {
    id: 3,
    title: 'فریزر صنعتی 6 درب مدل F-600',
    price: 28000000,
    oldPrice: 35000000,
    discount: 20,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg',
  },
  {
    id: 4,
    title: 'دستگاه آبمیوه گیری حرفه‌ای',
    price: 8500000,
    oldPrice: 11000000,
    discount: 23,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999218/dc2c39_kz3wpy.jpg',
  },
  {
    id: 5,
    title: 'یخچال ویترینی دو درب صنعتی',
    price: 22000000,
    oldPrice: 28000000,
    discount: 21,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg',
  },
  {
    id: 6,
    title: 'قهوه ساز دو گروپ فایما',
    price: 45000000,
    oldPrice: 55000000,
    discount: 18,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999309/D9_82_D9_87_D9_88_D9_87-_D8_B3_D8_A7_D8_B2-_DA_A9_D8_A7_D9_81_DB_8C-_D8_B4_D8_A7_D9_BE-_D8_AF_D9_88-_DA_AF_D8_B1_D9_88_D9_BE-_D9_81_D8_A7_D8_A6_D9_85_D8_A7-_D9_85_D8_AF_D9_84-Dieci-A2-Tall_i9vkgd.jpg',
  },
  {
    id: 7,
    title: 'بستنی ساز صنعتی 3 فاز',
    price: 68000000,
    oldPrice: 85000000,
    discount: 20,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999156/711Jw2d2LuL_jwsd9x.jpg',
  },
  {
    id: 8,
    title: 'قطعات یدکی دستگاه بستنی ساز',
    price: 1500000,
    oldPrice: 2000000,
    discount: 25,
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999349/cp401-404-mobile-430in430-3_scz9sw.png',
  }
];

const AmazingOfferCarousel = () => {
  // --- Timer Logic ---
  const [time, setTime] = useState({ hours: 14, minutes: 57, seconds: 27 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  // --- Embla Carousel Setup for Mobile ---
  const [mobileEmblaRef, mobileEmblaApi] = useEmblaCarousel(
    {
      align: 'start',
      direction: 'rtl',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
      dragFree: true,
    }
  );

  // --- Embla Carousel Setup for Desktop ---
  const [desktopEmblaRef, desktopEmblaApi] = useEmblaCarousel(
    {
      align: 'start',
      direction: 'rtl',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [mobileCanScrollPrev, setMobileCanScrollPrev] = useState(false);
  const [mobileCanScrollNext, setMobileCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (desktopEmblaApi) desktopEmblaApi.scrollPrev();
  }, [desktopEmblaApi]);

  const scrollNext = useCallback(() => {
    if (desktopEmblaApi) desktopEmblaApi.scrollNext();
  }, [desktopEmblaApi]);

  const mobileScrollPrev = useCallback(() => {
    if (mobileEmblaApi) mobileEmblaApi.scrollPrev();
  }, [mobileEmblaApi]);

  const mobileScrollNext = useCallback(() => {
    if (mobileEmblaApi) mobileEmblaApi.scrollNext();
  }, [mobileEmblaApi]);

  const onSelect = useCallback(() => {
    if (!desktopEmblaApi) return;
    setCanScrollPrev(desktopEmblaApi.canScrollPrev());
    setCanScrollNext(desktopEmblaApi.canScrollNext());
  }, [desktopEmblaApi]);

  const onMobileSelect = useCallback(() => {
    if (!mobileEmblaApi) return;
    setMobileCanScrollPrev(mobileEmblaApi.canScrollPrev());
    setMobileCanScrollNext(mobileEmblaApi.canScrollNext());
  }, [mobileEmblaApi]);

  useEffect(() => {
    if (!desktopEmblaApi) return;
    onSelect();
    desktopEmblaApi.on('select', onSelect);
    desktopEmblaApi.on('reInit', onSelect);
  }, [desktopEmblaApi, onSelect]);

  useEffect(() => {
    if (!mobileEmblaApi) return;
    onMobileSelect();
    mobileEmblaApi.on('select', onMobileSelect);
    mobileEmblaApi.on('reInit', onMobileSelect);
  }, [mobileEmblaApi, onMobileSelect]);

  return (
    <div className="w-full max-w-[1600px] mx-auto my-1 md:my-2 lg:my-12 select-none font-yekan" dir="rtl">

      {/* Mobile/Tablet: Vertical layout - Timer on top, carousel below */}
      <div className="lg:hidden border-y border-gray-200 bg-gradient-to-l from-ocean to-royal">
        {/* Header with title and timer */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-white-500 font-extrabold" />
            <span className="text-base md:text-lg font-extrabold text-white">شگفت‌انگیز</span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1" dir="ltr">
            <div className="bg-white text-ocean w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm">
              {toPersianDigits(formatTime(time.hours))}
            </div>
            <span className="text-white font-bold">:</span>
            <div className="bg-white text-ocean w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm">
              {toPersianDigits(formatTime(time.minutes))}
            </div>
            <span className="text-white font-bold">:</span>
            <div className="bg-white text-ocean w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm">
              {toPersianDigits(formatTime(time.seconds))}
            </div>
          </div>

          {/* View All */}
          <Link href="/offers" className="flex items-center text-xs md:text-sm text-white">
            <span>همه</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative px-2 py-3">
          <div className="overflow-hidden" ref={mobileEmblaRef}>
            <div className="flex gap-2">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`
                    relative flex-shrink-0 min-w-0
                    flex-[0_0_46%]
                    md:flex-[0_0_28.57%]
                    bg-white
                    ${index === 0 ? 'rounded-r-xl' : ''}
                    ${index === products.length - 1 ? 'rounded-l-xl' : ''}
                  `}
                >
                  {/* Vertical Divider */}
                  {index !== products.length - 1 && (
                    <div className="absolute top-8 left-0 w-[0.75px] h-[88%] bg-gray-200 ml-[1px]" />
                  )}

                  <Link href={`/product/${product.id}`} className="block group h-full">
                    <div className="relative p-2 md:p-3 flex flex-col h-full hover:shadow-lg transition-shadow">
                      {/* Image */}
                      <div className="relative w-full aspect-square mb-2">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          draggable="false"
                          loading="lazy"
                          className="object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Title */}
                      <h3 className="text-xs leading-5 text-right font-normal text-black h-10 line-clamp-2 mb-2">
                        {product.title}
                      </h3>

                      {/* Price Section */}
                      <div className="w-full mt-auto text-left">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <DiscountBadge discount={product.discount} />
                          <del className="text-gray-400 text-[10px]">
                            {product.oldPrice.toLocaleString('fa-IR')}
                          </del>
                        </div>
                        <p className="text-sm font-bold text-black flex items-center justify-end">
                          <span>{product.price.toLocaleString('fa-IR')}</span>
                          <span className="text-[10px] font-medium mr-1">تومان</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Nav buttons */}
          <button
            onClick={mobileScrollPrev}
            disabled={!mobileCanScrollPrev}
            className="absolute top-1/2 -translate-y-1/2 left-1 bg-white/90 rounded-full shadow-md p-1.5 hover:bg-gray-100 transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="محصول بعدی"
          >
            <ChevronLeft className="w-4 h-4 text-ocean" />
          </button>
          <button
            onClick={mobileScrollNext}
            disabled={!mobileCanScrollNext}
            className="absolute top-1/2 -translate-y-1/2 right-1 bg-white/90 rounded-full shadow-md p-1.5 hover:bg-gray-100 transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="محصول قبلی"
          >
            <ChevronRight className="w-4 h-4 text-ocean" />
          </button>
        </div>
      </div>

      {/* Desktop: Horizontal layout with sidebar */}
      <div className="hidden lg:block lg:mx-8">
        <div className="bg-gradient-to-l from-ocean to-royal rounded-2xl py-4 px-2 pr-0 flex h-[320px] relative overflow-hidden shadow-xl border border-ocean/50">

          {/* --- Right Side: Banner & Timer --- */}
          <div className="w-[180px] xl:w-[200px] flex flex-col items-center justify-center text-white shrink-0 z-10 relative">

            {/* Title */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-extrabold leading-snug">پیشــــ٪ـــــنهاد</h3>
              <h3 className="text-xl font-extrabold leading-snug">شگــفت انگیز!</h3>
            </div>

            {/* Timer */}
            <div className="flex gap-1.5 mb-4" dir="ltr">
              <div className="bg-white text-ocean w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-md">
                {formatTime(time.seconds)}
              </div>
              <span className="text-white font-bold self-center text-lg">:</span>
              <div className="bg-white text-ocean w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-md">
                {formatTime(time.minutes)}
              </div>
              <span className="text-white font-bold self-center text-lg">:</span>
              <div className="bg-white text-ocean w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-md">
                {formatTime(time.hours)}
              </div>
            </div>

            {/* Icon */}
            <div className="mb-4">
              <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center">
                <Image
                  src="https://res.cloudinary.com/dxooxiqcz/image/upload/v1764050064/pngtree-snowflake-on-blue-ice-icon-vector-png-image_6699545_fknw7o.png"
                  alt="Offer Icon"
                  width={95}
                  height={95}
                  className="object-contain"
                />
              </div>
            </div>

            {/* See All Link */}
            <Link href="/offers" className="flex items-center text-sm font-medium hover:text-gray-200 transition-colors">
              مشاهده همه
              <ChevronLeft size={16} className="mr-1" />
            </Link>
          </div>

          {/* --- Left Side: Embla Carousel --- */}
          <div className="flex-1 overflow-hidden rounded-xl bg-sky-600 relative">

            {/* Embla Container */}
            <div className="overflow-hidden h-full" ref={desktopEmblaRef}>
              <div className="flex h-full gap-0">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="
                      relative flex-shrink-0 min-w-0
                      flex-[0_0_25%]
                      xl:flex-[0_0_20%]
                      2xl:flex-[0_0_16.666%]
                      bg-white first:rounded-r-xl last:rounded-l-xl
                    "
                  >
                    {/* Vertical Divider */}
                    {index !== products.length - 1 && (
                      <div className="absolute top-8 left-0 w-[0.75px] h-[88%] bg-gray-200" />
                    )}

                    <Link href={`/product/${product.id}`} className="flex flex-col h-full p-4 hover:shadow-lg transition-shadow duration-200 group">

                      {/* Image */}
                      <div className="relative w-full h-[140px] mb-3">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Title */}
                      <h3 className="text-sm text-gray-800 font-medium leading-6 line-clamp-2 mb-auto h-12">
                        {product.title}
                      </h3>

                      {/* Price Section */}
                      <div className="mt-3">
                        {/* Row 1: Old Price & Badge */}
                        <div className="flex items-center justify-between mb-1">
                          <DiscountBadge discount={product.discount} />
                          <del className="text-gray-400 text-xs font-light">
                            {product.oldPrice.toLocaleString('fa-IR')}
                          </del>
                        </div>

                        {/* Row 2: Current Price */}
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-900 font-bold font-yekan text-lg">
                            {product.price.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-gray-600 text-xs">تومان</span>
                        </div>
                      </div>

                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Desktop Navigation Buttons --- */}
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 transition-all disabled:opacity-0 disabled:cursor-default"
              aria-label="قبلی"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 transition-all disabled:opacity-0 disabled:cursor-default"
              aria-label="بعدی"
            >
              <ChevronRight size={24} />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AmazingOfferCarousel;