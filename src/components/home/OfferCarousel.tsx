'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DiscountBadge from '../ui/DiscountBadge';
  
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

  // --- Embla Carousel Setup ---
  const [emblaRef, emblaApi] = useEmblaCarousel(
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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-2 mb-4 px-4 font-yekan" dir="rtl">
      
      <div className="bg-gradient-to-l from-sky-500 to-sky-600 rounded-3xl py-4 px-2 pr-0 flex h-[300px] relative overflow-hidden shadow-xl">
        
        {/* --- Right Side: Banner & Timer --- */}
        <div className="w-[160px] sm:w-[190px] flex flex-col items-center justify-center text-white shrink-0 z-10 relative">
          
          {/* Title */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-extrabold leading-snug">پیشنهاد</h3>
            <h3 className="text-lg font-extrabold leading-snug">شگفت</h3>
            <h3 className="text-lg font-extrabold leading-snug">انگیز!</h3>
          </div>

          {/* Timer */}
          <div className="flex gap-1 mb-4" dir="ltr">
            <div className="bg-white text-sky-600 w-8 h-8 rounded flex items-center justify-center font-bold text-sm shadow-md">
              {formatTime(time.seconds)}
            </div>
            <span className="text-white font-bold self-center">:</span>
            <div className="bg-white text-sky-600 w-8 h-8 rounded flex items-center justify-center font-bold text-sm shadow-md">
              {formatTime(time.minutes)}
            </div>
            <span className="text-white font-bold self-center">:</span>
            <div className="bg-white text-sky-600 w-8 h-8 rounded flex items-center justify-center font-bold text-sm shadow-md">
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
          <div className="overflow-hidden h-full" ref={emblaRef}>
            <div className="flex h-full gap-2">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-[0_0_170px] sm:flex-[0_0_200px] bg-white first:rounded-r-xl last:rounded-l-xl"
                >
                  <Link href={`/product/${product.id}`} className="flex flex-col h-full p-4 hover:shadow-lg transition-shadow duration-200">
                    
                    {/* Image */}
                    <div className="relative w-full h-[140px] mb-4">
                      <Image 
                        src={product.image} 
                        alt={product.title} 
                        fill 
                        className="object-contain"
                      />
                    </div>

                    {/* Title */}
                    <h3 className="text-[13px] text-gray-800 font-normal leading-6 line-clamp-2 mb-auto h-[48px]">
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
                        <span className="text-gray-900 font-bold font-yekan text-[16px] sm:text-[18px]">
                          {product.price.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-gray-600 text-[12px]">تومان</span>
                      </div>
                    </div>
                    
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* --- Navigation Buttons --- */}
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
  );
};

export default AmazingOfferCarousel;