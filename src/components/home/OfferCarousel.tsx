'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Percent } from 'lucide-react';
import DiscountBadge from '../ui/DiscountBadge';
import { toPersianDigits } from '@/lib/persian';

// Product type for carousel display
interface OfferProduct {
  id: number;
  title: string;
  slug?: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string | null;
  inStock?: boolean;
}

// Offer item from API
interface OfferItem {
  id: number;
  name: string;
  endDate: Date | string;
  badgeText?: string | null;
  product: {
    id: number;
    title: string;
    slug: string;
    image: string | null;
    price: number;
    oldPrice: number;
    discount: number;
    inStock: boolean;
  };
}

interface AmazingOfferCarouselProps {
  offers?: OfferItem[];
}

// Isolated countdown leaf — only this component re-renders every second (#33)
function OfferCountdown({ endDate, variant = 'compact' }: { endDate: Date; variant?: 'compact' | 'large' }) {
    const calc = React.useCallback(() => {
        const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        return {
            hours: totalHours % 24,
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
        };
    }, [endDate]);
    const [time, setTime] = React.useState(calc);
    React.useEffect(() => {
        const t = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(t);
    }, [calc]);
    const fmt = (n: number) => n.toString().padStart(2, '0');
    const isLarge = variant === 'large';
    return (
        <div className={isLarge ? 'flex gap-1.5' : 'flex items-center gap-1'} dir="ltr">
            <div className={isLarge ? 'bg-white text-ocean w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-md' : 'bg-white text-ocean w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm'}>
                {toPersianDigits(fmt(time.hours))}
            </div>
            <span className={isLarge ? 'text-white font-bold self-center text-lg' : 'text-white font-bold'}>:</span>
            <div className={isLarge ? 'bg-white text-ocean w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-md' : 'bg-white text-ocean w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm'}>
                {toPersianDigits(fmt(time.minutes))}
            </div>
            <span className={isLarge ? 'text-white font-bold self-center text-lg' : 'text-white font-bold'}>:</span>
            <div className={isLarge ? 'bg-white text-ocean w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-md' : 'bg-white text-ocean w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm'}>
                {toPersianDigits(fmt(time.seconds))}
            </div>
        </div>
    );
}

const AmazingOfferCarousel = ({ offers }: AmazingOfferCarouselProps) => {
  // Transform offers to product format
  const products: OfferProduct[] = useMemo(() => {
    if (!offers || offers.length === 0) return [];
    return offers.map(offer => ({
      id: offer.product.id,
      title: offer.product.title,
      slug: offer.product.slug,
      price: offer.product.price,
      oldPrice: offer.product.oldPrice,
      discount: offer.product.discount,
      image: offer.product.image,
      inStock: offer.product.inStock,
    }));
  }, [offers]);

  // Get earliest end date for timer
  const earliestEndDate = useMemo(() => {
    if (offers && offers.length > 0) {
      const dates = offers.map(o => new Date(o.endDate).getTime());
      return new Date(Math.min(...dates));
    }
    // Default: 24 hours from now
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }, [offers]);



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

  // Don't render the section if there are no offers
  if (products.length === 0) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto my-1 md:my-2 lg:my-12 select-none font-yekan" dir="rtl">

      {/* Mobile/Tablet: Vertical layout - Timer on top, carousel below */}
      <div className="lg:hidden border-y border-gray-200 bg-gradient-to-l from-ocean to-royal">
        {/* Header with title and timer */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-white font-extrabold" />
            <span className="text-base md:text-lg font-extrabold text-white">شگفت‌انگیز</span>
          </div>

          {/* Timer — isolated leaf */}
          <OfferCountdown endDate={earliestEndDate} variant="compact" />

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
                  className={[
                    'relative flex-shrink-0 min-w-0 flex-[0_0_46%] md:flex-[0_0_28.57%] bg-white',
                    index === 0 ? 'rounded-r-xl' : '',
                    index === products.length - 1 ? 'rounded-l-xl' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Vertical Divider */}
                  {index !== products.length - 1 && (
                    <div className="absolute top-8 left-0 w-[0.75px] h-[88%] bg-gray-200 ml-[1px]" />
                  )}

                  <Link href={`/products/${product.slug || product.id}`} className="block group h-full">
                    <div className="relative p-2 md:p-3 flex flex-col h-full hover:shadow-lg transition-shadow">
                      {/* Image */}
                      <div className="relative w-full aspect-square mb-2">
                        <Image
                          src={product.image || '/images/placeholder-product.png'}
                          alt={product.title}
                          fill
                          draggable="false"
                          loading="lazy"
                          className="object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 33vw"
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

            {/* Timer — isolated leaf */}
            <div className="mb-4">
                <OfferCountdown endDate={earliestEndDate} variant="large" />
            </div>

            {/* Icon */}
            <div className="mb-4">
              <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center">
                <Image
                  src="/uploads/banners/pngtree-snowflake-on-blue-ice-icon-vector-png-imag.png"
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
              <div className="flex h-full gap-2">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={[
                      'relative flex-shrink-0 min-w-0 flex-[0_0_25%] xl:flex-[0_0_20%] 2xl:flex-[0_0_16.666%] bg-white',
                      index === 0 ? 'rounded-r-2xl' : '',
                      index === products.length - 1 ? 'rounded-l-2xl' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <Link href={`/products/${product.slug || product.id}`} className="flex flex-col h-full p-4 hover:shadow-lg transition-shadow duration-200 group">

                      {/* Image */}
                      <div className="relative w-full h-[140px] mb-3">
                        <Image
                          src={product.image || '/images/placeholder-product.png'}
                          alt={product.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
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