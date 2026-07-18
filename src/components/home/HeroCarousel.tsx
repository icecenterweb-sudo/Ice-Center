'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowUpLeft } from 'lucide-react';

interface BannerItem {
  bg: string;
  accent: string;
  title: string;
  badge: string;
  image: string;
  link: string;
  isDouble?: boolean;
}

interface HeroCarouselProps {
  banners: BannerItem[];
}

function CategoryBannerCard({ banner }: { banner: BannerItem }) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine sizing based on whether it is a double-width card
  const cardClasses = banner.isDouble
    ? 'lg:col-span-2 md:col-span-2 h-[340px] lg:h-[380px]'
    : 'lg:col-span-1 md:col-span-1 h-[340px] lg:h-[380px]';

  const imageClasses = banner.isDouble
    ? 'w-[160px] h-[160px] lg:w-[240px] lg:h-[240px] left-4 bottom-4'
    : 'w-[130px] h-[130px] lg:w-[170px] lg:h-[170px] left-3 bottom-3';

  return (
    <Link 
      href={banner.link} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-[28px] ${banner.bg} overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-[transform,box-shadow] duration-200 ease-out active-press flex flex-col justify-between p-6 select-none w-full ${cardClasses}`}
    >
      {/* Background Decorative Element */}
      <div className="absolute -top-16 -left-16 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none"></div>

      {/* Top Text Content */}
      <div className="relative z-10 text-right">
        <span className="text-[10px] lg:text-xs text-sky-breeze font-extrabold block mb-1.5">
          {banner.accent}
        </span>
        <h3 className={`font-black leading-snug tracking-tight mb-2.5 text-white ${
          banner.isDouble ? 'text-lg lg:text-2xl max-w-[65%]' : 'text-base lg:text-lg max-w-[85%]'
        }`}>
          {banner.title}
        </h3>
        
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-[9px] lg:text-[10px] font-extrabold px-3 py-1 rounded-full mt-1.5 shadow-[0_2px_8px_rgba(249,115,22,0.3)]">
          <Sparkles size={9} />
          {banner.badge}
        </span>
      </div>

      {/* Product Image Anchored to Left/Bottom */}
      <div className={`absolute pointer-events-none z-10 flex items-center justify-center ${imageClasses}`}>
        <Image
          src={banner.image}
          alt={banner.title}
          width={banner.isDouble ? 240 : 170}
          height={banner.isDouble ? 240 : 170}
          className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)] group-hover:scale-108 group-hover:-translate-y-1 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        />
      </div>

      {/* Action link indicator at the bottom right */}
      <div className="absolute bottom-6 right-6 z-10 bg-white/10 group-hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-md transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
        <ArrowUpLeft size={16} className="transform -rotate-45" />
      </div>
    </Link>
  );
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  return (
    <div className="w-full mb-12">
      {/* 3-Box Premium Grid (Fully responsive columns structure) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {banners.map((banner, index) => (
          <CategoryBannerCard key={index} banner={banner} />
        ))}
      </div>
    </div>
  );
}
