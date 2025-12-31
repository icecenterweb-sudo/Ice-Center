'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    direction: 'rtl',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
    dragFree: true,
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

  return (
    <section className="w-full bg-white py-4 md:py-8 lg:py-12" dir="rtl">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        {/* Category Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-1 md:gap-3 lg:gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="
                    flex-shrink-0 min-w-0
                    flex-[0_0_28.5%]
                    xs:flex-[0_0_20%]
                    sm:flex-[0_0_15%]
                    md:flex-[0_0_16.666%]
                    lg:flex-[0_0_14.28%]
                  "
                >
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group flex flex-col items-center py-2"
                  >
                    {/* Circle with border */}
                    <div className="relative mb-2 md:mb-3">
                      {/* Outer border ring */}
                      <div className="relative w-[76px] h-[76px] md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-30 xl:h-30 2xl:w-34 2xl:h-34 rounded-full border-2 md:border-3 border-ocean group-hover:border-royal transition-all duration-300 bg-white">
                        {/* Inner border */}
                        <div className="absolute inset-1 bg-frost rounded-full border border-gray-200 transition-all duration-300 overflow-hidden">
                          {/* Image */}
                          <Image
                            src={category.image || fallbackImage}
                            alt={category.name}
                            fill
                            draggable="false"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>

                      {/* Badge for product count */}
                      {category.productCount > 0 && (
                        <div className="absolute -top-1 -right-1 z-10 transform scale-0 group-hover:scale-100 transition-transform duration-300 origin-bottom-left">
                          <span className="flex h-5 md:h-6 min-w-[20px] md:min-w-[24px] items-center justify-center rounded-full bg-gradient-to-r from-sky-breeze to-ocean px-1 text-[10px] md:text-[11px] font-bold text-white shadow-lg ring-2 ring-white">
                            {category.productCount > 99 ? '۹۹+' : toPersianNumber(category.productCount)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Category name */}
                    <span className="text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 text-center group-hover:text-ocean transition-colors duration-300 line-clamp-2 px-1 leading-tight">
                      {category.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation buttons */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute top-1/2 -translate-y-1/2 left-1 lg:hidden bg-white/90 rounded-full shadow-md p-1 hover:bg-gray-100 transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="دسته بعدی"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-ocean" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute top-1/2 -translate-y-1/2 right-1 lg:hidden bg-white/90 rounded-full shadow-md p-1 hover:bg-gray-100 transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="دسته قبلی"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-ocean" />
          </button>

          {/* Desktop Navigation buttons */}
          {categories.length > 7 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center hidden lg:flex hover:bg-blue-50 transition-all z-20 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                aria-label="دسته بعدی"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="absolute top-1/2 -translate-y-1/2 -right-4 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center hidden lg:flex hover:bg-blue-50 transition-all z-20 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                aria-label="دسته قبلی"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;