'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Banner {
  id: number;
  desktopImage: string;
  mobileImage: string;
  link: string;
  alt: string;
}

interface BannerSectionProps {
  banners: Banner[];
  heightClass?: string;
}

const BannerSection: React.FC<BannerSectionProps> = ({
  banners,
  heightClass = 'h-[200px] md:h-[300px] lg:h-[350px]',
}) => {

  if (banners.length === 0) return null;

  // تشخیص تعداد ستون
  const columns = banners.length;
  const gridClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
  }[Math.min(columns, 3)] || 'md:grid-cols-2';

  return (
    <section className="w-full bg-white py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto px-4">

        <div className={`grid grid-cols-1 ${gridClass} gap-4`}>
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.link}
              className="group block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* تصویر موبایل */}
              <div className={`md:hidden relative w-full ${heightClass}`}>
                <Image
                  src={banner.mobileImage}
                  alt={banner.alt}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                  sizes="100vw"
                />
              </div>

              {/* تصویر دسکتاپ/تبلت */}
              <div className={`hidden md:block relative w-full ${heightClass}`}>
                <Image
                  src={banner.desktopImage}
                  alt={banner.alt}
                  fill
                  className="object-fit group-hover:scale-105 transition-transform duration-500"
                  sizes="100vw"
                />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default BannerSection;