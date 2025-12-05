'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BlogPost = {
  id: number | string;
  title: string;
  image: string;
  excerpt?: string;
  date?: string;
  href?: string;
};

const FAKE_BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'راهنمای خرید دستگاه بستنی ساز صنعتی',
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764859446/banner_ArticleBanners_bOE8Hn_a141732b-5dda-4bc6-af7f-c69e9191fdd2_dzm93j.png',
    excerpt: 'نکات مهمی که قبل از خرید دستگاه بستنی ساز باید بدانید تا بهترین انتخاب را داشته باشید.',
    date: '۱۴۰۲/۰۹/۱۵',
  },
  {
    id: 2,
    title: 'تفاوت بستنی اسکوپی و جلاتو چیست؟',
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764859391/banner_ArticleBanners_RhF6Ia_e2b88ff7-f589-4739-97e0-6d700a81c208_eaemqj.png',
    excerpt: 'بررسی تفاوت‌های اصلی بین بستنی معمولی و جلاتو ایتالیایی از نظر مواد اولیه و بافت.',
    date: '۱۴۰۲/۰۹/۱۰',
  },
  {
    id: 3,
    title: 'بهترین برندهای دستگاه آبمیوه گیری صنعتی',
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764859446/banner_ArticleBanners_bOE8Hn_a141732b-5dda-4bc6-af7f-c69e9191fdd2_dzm93j.png',
    excerpt: 'معرفی و مقایسه برترین برندهای تولید کننده دستگاه‌های آبمیوه گیری برای کافی‌شاپ‌ها.',
    date: '۱۴۰۲/۰۹/۰۵',
  },
  {
    id: 4,
    title: 'نگهداری و سرویس دوره ای تجهیزات کافی شاپ',
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764859391/banner_ArticleBanners_RhF6Ia_e2b88ff7-f589-4739-97e0-6d700a81c208_eaemqj.png',
    excerpt: 'چگونه با سرویس به موقع، عمر مفید تجهیزات کافی شاپ خود را افزایش دهید؟',
    date: '۱۴۰۲/۰۸/۲۸',
  },
  {
    id: 5,
    title: 'طرز تهیه بستنی سنتی زعفرانی در خانه',
    image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764859383/banner_ArticleBanners_OX2jJx_ec1c80a0-b745-4a8b-b894-10404e58119d_qzmrou.png',
    excerpt: 'آموزش گام به گام تهیه بستنی سنتی ایرانی خوشمزه با ثعلب و زعفران.',
    date: '۱۴۰۲/۰۸/۲۰',
  },
];

type BlogCarouselProps = {
  title?: string;
  viewAllHref?: string;
  posts?: BlogPost[];
};

const BlogCarousel: React.FC<BlogCarouselProps> = ({
  title = 'آخرین مطالب وبلاگ',
  viewAllHref = '/blog',
  posts = FAKE_BLOG_POSTS,
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

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-8 mb-8 px-4 font-yekan" dir="rtl">
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
            مشاهده همه مطالب
            <ChevronLeft size={16} />
          </Link>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="
                    flex-[0_0_85%]
                    sm:flex-[0_0_45%]
                    md:flex-[0_0_32%]
                    lg:flex-[0_0_24%]
                    xl:flex-[0_0_19%]
                    min-w-0
                    relative
                  "
                >
                  {/* Vertical Divider */}
                  {index !== posts.length - 1 && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[75%] w-[1px] bg-gray-300 block z-10" />
                  )}

                  <Link
                    href={post.href || `/blog/${post.id}`}
                    className="flex flex-col h-full p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
                  >
                    <div className="relative h-40 w-full mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <h3 className="font-normal text-black text-sm mb-2 line-clamp-2 h-[40px]">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-3 flex-grow leading-5">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-auto pt-2 border-t border-gray-100">
                          <span>{post.date}</span>
                          <span className="flex items-center gap-1 text-sky-600 font-medium">
                              ادامه مطلب <ChevronLeft size={12} />
                          </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
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

export default BlogCarousel;
