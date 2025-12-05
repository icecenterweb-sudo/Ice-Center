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
    <div className="w-full max-w-[1600px] mx-auto mt-4 px-4 font-yekan" dir="rtl">
      <div className="border border-gray-300 rounded-3xl p-4 sm:p-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">
            {title}
          </h2>

          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-[13px] text-sky-600 hover:text-sky-700"
          >
            نمایش همه
            <ChevronLeft size={16} />
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
                      flex-[0_0_50%]
                      min-w-0
                      sm:flex-[0_0_33.333%]
                      md:flex-[0_0_25%]
                      lg:flex-[0_0_20%]
                      xl:flex-[0_0_16.666667%]
                      relative
                      overflow-visible
                    "
                  >
                    {/* Vertical Divider */}
                    {index !== products.length - 1 && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[75%] w-[1px] bg-gray-300 block z-10" />
                    )}

                    <Link
                      href={product.href || '#'}
                      className="flex flex-col h-full p-3 sm:p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Top strip: time + label */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-red-500 font-bold">
                          تک‌تخفیف
                        </span>
                        <span className="text-[11px] text-red-500 font-bold">
                          {product.timeLabel || '۰۰:۲۳:۴۹'}
                        </span>
                      </div>
                      <div className="h-[2px] w-full bg-red-500 mb-2" />

                      {/* Image */}
                      <div className="relative w-full h-[150px] sm:h-[170px] mb-3">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-contain"
                        />
                      </div>

                      {/* Title */}
                      <h3 className="text-[13px] sm:text-[14px] text-gray-800 font-normal leading-6 line-clamp-2 mb-auto min-h-[44px]">
                        {product.title}
                      </h3>

                      {/* Price section */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          {discount !== null && (
                            <DiscountBadge discount={discount} />
                          )}
                          {product.oldPrice && (
                            <del className="text-gray-400 text-xs">
                              {product.oldPrice.toLocaleString('fa-IR')}
                            </del>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-900 font-bold font-yekan text-[16px] sm:text-[18px]">
                            {product.price.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-gray-600 text-[12px]">
                            تومان
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="
              hidden sm:flex
              absolute left-2 top-1/2 -translate-y-1/2 z-20
              w-9 h-9 bg-white border border-gray-200 rounded-full
              items-center justify-center shadow-md text-gray-500
              hover:text-gray-900 hover:bg-gray-50
              disabled:opacity-0 disabled:cursor-default
              transition-all
            "
            aria-label="قبلی"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="
              hidden sm:flex
              absolute right-2 top-1/2 -translate-y-1/2 z-20
              w-9 h-9 bg-white border border-gray-200 rounded-full
              items-center justify-center shadow-md text-gray-500
              hover:text-gray-900 hover:bg-gray-50
              disabled:opacity-0 disabled:cursor-default
              transition-all
            "
            aria-label="بعدی"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;
