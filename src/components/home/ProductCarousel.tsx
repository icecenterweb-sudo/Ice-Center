'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import DiscountBadge from '../ui/DiscountBadge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Product = {
  id: number | string;
  title: string;
  image: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  href?: string;
  timeLabel?: string;
};

const FAKE_PRODUCTS: Product[] = [
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

type ProductCarouselProps = {
  title: string;
  viewAllHref?: string;
  products?: Product[];
};

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  viewAllHref = '#',
  products = FAKE_PRODUCTS,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    direction: 'rtl',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [countdown, setCountdown] = useState('۰۰:۰۰:۰۰');

  // Calculate time until midnight Iran time (UTC+3:30)
  useEffect(() => {
    const calculateTimeToMidnight = () => {
      const now = new Date();
      // Iran is UTC+3:30
      const iranOffset = 3.5 * 60; // minutes
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const iranTime = new Date(utcTime + (iranOffset * 60000));

      // Calculate midnight in Iran
      const midnight = new Date(iranTime);
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - iranTime.getTime();

      if (diff <= 0) return '۰۰:۰۰:۰۰';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Convert to Persian numerals
      const toPersian = (n: number) => n.toString().padStart(2, '0')
        .replace(/0/g, '۰').replace(/1/g, '۱').replace(/2/g, '۲')
        .replace(/3/g, '۳').replace(/4/g, '۴').replace(/5/g, '۵')
        .replace(/6/g, '۶').replace(/7/g, '۷').replace(/8/g, '۸').replace(/9/g, '۹');

      return `${toPersian(hours)}:${toPersian(minutes)}:${toPersian(seconds)}`;
    };

    setCountdown(calculateTimeToMidnight());
    const interval = setInterval(() => {
      setCountdown(calculateTimeToMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const getDiscount = (p: Product) => {
    if (typeof p.discount === 'number') return p.discount;
    if (p.oldPrice && p.oldPrice > p.price) {
      return Math.round((1 - p.price / p.oldPrice) * 100);
    }
    return null;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto my-1 md:my-2 lg:my-12 select-none font-yekan" dir="rtl">
      <div className="border-y lg:border border-gray-400 lg:border-gray-300 lg:rounded-2xl lg:mx-8 py-4 lg:py-0">
        {/* Header */}
        <div className="px-4 md:px-8 lg:px-12 lg:py-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 md:my-3 lg:my-4 mb-2 md:mb-4 lg:mb-6 mt-2 md:mt-3 lg:mt-4 md:flex md:justify-between">
            <h2 className="text-[13px] md:text-xs lg:text-lg font-semibold text-black order-1">
              {title}
            </h2>
            <div className="bg-gray-200 w-full md:hidden" />
            <Link
              href={viewAllHref}
              className="text-[11px] md:text-xs lg:text-[14px] text-ocean hover:text-royal flex items-center order-2 font-semibold"
            >
              <span>نمایش همه</span>
              <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 mr-1" />
            </Link>
          </div>

        {/* Carousel */}
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y">
                {products.map((product, index) => {
                  const discount = getDiscount(product);

                  return (
                    <div
                      key={product.id}
                      className="
                      relative flex-shrink-0 min-w-0
                      flex-[0_0_46%]
                      md:flex-[0_0_28.57%]
                      lg:flex-[0_0_25%]
                      xl:flex-[0_0_20%]
                      2xl:flex-[0_0_16.666%]
                    "
                    >
                      {/* Vertical Divider */}
                      {index !== products.length - 1 && (
                        <div className="absolute top-8 left-0 w-[0.75px] h-[88%] bg-gray-300 ml-[1px]" />
                      )}
                      <Link
                        href={product.href || '#'}
                        className="block group h-full">
                        <div className="relative p-2 md:p-3 lg:p-4 flex flex-col h-full hover:shadow-lg transition-shadow">
                          {/* Top strip: Reserved space for time + label (consistent height) */}
                          <div className="h-[24px] md:h-[32px] lg:h-[36px] mb-0.5 md:mb-1">
                            {discount !== null && discount > 0 ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] md:text-xs lg:text-sm text-ocean font-bold">
                                    تک‌تخفیف
                                  </span>
                                  <span className="text-[11px] md:text-xs lg:text-sm text-ocean font-bold">
                                    {product.timeLabel || countdown}
                                  </span>
                                </div>
                                <div className="h-[3px] md:h-[2px] w-full bg-ocean" />
                              </>
                            ) : (
                              /* Empty placeholder to maintain consistent height */
                              <div className="h-full" />
                            )}
                          </div>
                          {/* Image */}
                          <div className="relative w-full aspect-square mb-2 md:mb-2.5 lg:mb-3">
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
                          <h3 className="text-[12px] md:text-xs lg:text-sm my-1 md:my-2 lg:my-0 leading-4 md:leading-5 lg:leading-7 text-right font-semibold text-black h-8 md:h-10 lg:h-14 line-clamp-2">
                            {product.title}
                          </h3>
                          {/* Price section */}
                          <div className="w-full mt-2 md:mt-4 lg:mt-5 mb-0.5 md:mb-1 text-left">
                            {product.oldPrice && (
                              <div className="flex items-center justify-end gap-2 mb-1">
                                {discount !== null && (
                                  <DiscountBadge discount={discount} />
                                )}
                                <del className="text-gray-400 text-xs">
                                  {product.oldPrice.toLocaleString('fa-IR')}
                                </del>
                              </div>
                            )}
                            <p className="text-sm md:text-base lg:text-lg font-bold text-black flex items-center justify-end">
                              <span>{product.price.toLocaleString('fa-IR')}</span>
                              <span className="text-[10px] md:text-xs font-medium mr-1">تومان</span>
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Navigation buttons */}
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute top-1/2 -translate-y-1/2 left-2 lg:hidden bg-white rounded-full shadow-md p-1.5 hover:bg-gray-100 transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="محصول بعدی"
            >
              <ChevronLeft className="w-[18px] h-[18px] md:w-5 md:h-5 text-ocean" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute top-1/2 -translate-y-1/2 right-2 lg:hidden bg-white rounded-full shadow-md p-1.5 hover:bg-gray-100 transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="محصول قبلی"
            >
              <ChevronRight className="w-[18px] h-[18px] md:w-5 md:h-5 text-ocean" />
            </button>

            {/* Desktop Navigation buttons */}
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 lg:w-9 lg:h-9 bg-white rounded-full shadow-md items-center justify-center hidden lg:flex hover:bg-gray-100 transition-all z-20 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="محصول بعدی"
            >
              <ChevronLeft className="w-[22px] h-[22px] lg:w-6 lg:h-6 text-ocean" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 lg:w-9 lg:h-9 bg-white rounded-full shadow-md items-center justify-center hidden lg:flex hover:bg-gray-100 transition-all z-20 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="محصول قبلی"
            >
              <ChevronRight className="w-[22px] h-[22px] lg:w-6 lg:h-6 text-ocean" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;
