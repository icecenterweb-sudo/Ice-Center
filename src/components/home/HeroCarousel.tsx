'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface BannerItem {
  bg?: string;
  accent?: string;
  title?: string;
  badge?: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  link: string;
  alt?: string;
  isDouble?: boolean;
}

interface HeroCarouselProps {
  banners: BannerItem[];
}

function CategoryBannerCard({ banner }: { banner: BannerItem }) {
  // Determine grid span based on whether it is a double-width card
  const cardClasses = banner.isDouble
    ? 'lg:col-span-2 md:col-span-2'
    : 'lg:col-span-1 md:col-span-1';

  const imageSrc = banner.desktopImage || banner.image;
  const mobileSrc = banner.mobileImage || imageSrc;

  return (
    <Link 
      href={banner.link || '#'} 
      className={`group relative rounded-2xl md:rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 select-none w-full h-[280px] lg:h-[340px] block ${cardClasses}`}
    >
      {banner.mobileImage && banner.desktopImage ? (
        <>
          {/* Mobile Image */}
          <div className="md:hidden relative w-full h-full">
            <Image
              src={mobileSrc}
              alt={banner.alt || banner.title || 'بنر تبلیغاتی'}
              fill
              sizes="100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              priority
            />
          </div>
          {/* Desktop Image */}
          <div className="hidden md:block relative w-full h-full">
            <Image
              src={imageSrc}
              alt={banner.alt || banner.title || 'بنر تبلیغاتی'}
              fill
              sizes="(max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              priority
            />
          </div>
        </>
      ) : (
        <Image
          src={imageSrc}
          alt={banner.alt || banner.title || 'بنر تبلیغاتی'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          priority
        />
      )}
    </Link>
  );
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const mainBanner = banners[0];
  const sideBanners = banners.slice(1, 3);

  return (
    <div className="w-full mb-6 md:mb-12">
      {/* ============================================================ */}
      {/* DESKTOP LAYOUT (Unchanged — 4 Column Grid: 2 + 1 + 1) */}
      {/* ============================================================ */}
      <div className="hidden lg:grid grid-cols-4 gap-6">
        {banners.map((banner, index) => (
          <CategoryBannerCard key={index} banner={banner} />
        ))}
      </div>

      {/* ============================================================ */}
      {/* TABLET / MID LAYOUT (2 Column Grid) */}
      {/* ============================================================ */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
        {banners.map((banner, index) => (
          <CategoryBannerCard key={index} banner={banner} />
        ))}
      </div>

      {/* ============================================================ */}
      {/* MOBILE LAYOUT (Barfin Style: Standard Hero Banner + 2 Side-by-Side Banners) */}
      {/* ============================================================ */}
      <div className="flex md:hidden flex-col gap-3">
        {/* 1st Main Banner: Standard Mobile Hero Banner */}
        {mainBanner && (
          <Link
            href={mainBanner.link || '#'}
            className="group relative w-full h-[420px] sm:h-[460px] rounded-[24px] overflow-hidden shadow-sm active-press block"
          >
            <Image
              src={mainBanner.mobileImage || mainBanner.desktopImage || mainBanner.image}
              alt={mainBanner.alt || mainBanner.title || 'بنر اصلی صفحه'}
              fill
              sizes="100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              priority
            />
          </Link>
        )}

        {/* 2nd & 3rd Banners: Side by Side 2-Column Grid */}
        {sideBanners.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {sideBanners.map((banner, idx) => (
              <Link
                key={idx}
                href={banner.link || '#'}
                className="group relative w-full h-[220px] sm:h-[260px] rounded-[20px] overflow-hidden shadow-sm active-press block"
              >
                <Image
                  src={banner.mobileImage || banner.desktopImage || banner.image}
                  alt={banner.alt || banner.title || 'بنر تبلیغاتی'}
                  fill
                  sizes="50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
