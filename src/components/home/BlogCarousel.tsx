'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

// Default fallback image
const FALLBACK_IMAGE = '/uploads/blog-covers/banner_ArticleBanners_bOE8Hn_a141732b-5dda-4bc6-af.png';

// Blog post type
interface BlogPost {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    coverImage: string | null;
}

// Mobile/Tablet Card - Light gray footer with black text
const MobileCard = ({ blog }: { blog: BlogPost }) => (
    <Link
        href={`/blog/${blog.slug}`}
        className="block bg-white rounded-b-2xl overflow-hidden group"
    >
        {/* Image */}
        <div className="relative w-full h-40 overflow-hidden rounded-t-sm">
            <Image
                src={blog.thumbnail || blog.coverImage || FALLBACK_IMAGE}
                alt={blog.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>

        {/* Title footer - light gray bg */}
        <div className="p-3 md:p-4 bg-[#f0f0f0] min-h-[75px] md:min-h-[85px]">
            <h3 className="text-[11px] md:text-[13px] font-normal text-black leading-6 line-clamp-2 text-right">
                {blog.title}
            </h3>
        </div>
    </Link>
);

// Desktop Card - Dark footer with white text
const DesktopCard = ({ blog, showDivider }: { blog: BlogPost; showDivider: boolean }) => (
    <div className="relative flex-shrink-0 min-w-0 flex-[0_0_33.33%] xl:flex-[0_0_25%] 2xl:flex-[0_0_20%]">
        <div className="p-4">
            {/* Vertical divider */}
            {showDivider && (
                <div className="absolute top-[10%] left-0 w-[1px] h-[70%] bg-gray-300" />
            )}

            <div className="hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full rounded-xl bg-white">
                <Link href={`/blog/${blog.slug}`} className="block">
                    {/* Image */}
                    <div className="relative w-full h-35 overflow-hidden rounded-t-sm">
                        <Image
                            src={blog.thumbnail || blog.coverImage || FALLBACK_IMAGE}
                            alt={blog.title}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    {/* Title footer - dark bg */}
                    <div className="h-[75px] bg-midnight text-white text-xs text-center p-2 px-3 rounded-b-xl leading-5 text-right line-clamp-3">
                        <span className="font-medium">{blog.title}</span>
                    </div>
                </Link>
            </div>
        </div>
    </div>
);

interface BlogCarouselProps {
    posts: BlogPost[];
}

const BlogCarousel = ({ posts }: BlogCarouselProps) => {
    // Embla Carousel for desktop
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        direction: 'rtl',
        slidesToScroll: 1,
        containScroll: 'trimSnaps',
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

    // Don't render if no posts
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <section className="font-yekan" dir="rtl">
            {/* Desktop: Carousel in bordered box */}
            <div className="hidden lg:block py-6 px-4 md:px-8 lg:px-12 rounded-2xl lg:mx-8 border border-gray-400">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black">جدیدترین بلاگ ها</h2>
                    <Link
                        href="/blog"
                        className="text-sm text-ocean hover:text-royal flex items-center shrink-0"
                    >
                        <span>نمایش همه</span>
                        <ChevronLeft className="w-[18px] h-[18px] mr-1" />
                    </Link>
                </div>

                {/* Carousel */}
                <div className="relative">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex gap-0">
                            {posts.map((blog, index) => (
                                <DesktopCard key={blog.id} blog={blog} showDivider={index > 0} />
                            ))}
                        </div>
                    </div>

                    {/* Nav buttons */}
                    <button
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 lg:w-9 lg:h-9 bg-white rounded-full shadow-md items-center justify-center hidden lg:flex hover:bg-gray-100 transition-all z-10 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="پست بعدی"
                    >
                        <ChevronLeft className="w-[22px] h-[22px] lg:w-6 lg:h-6 text-gray-600" />
                    </button>
                    <button
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 lg:w-9 lg:h-9 bg-white rounded-full shadow-md items-center justify-center hidden lg:flex hover:bg-gray-100 transition-all z-10 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="پست قبلی"
                    >
                        <ChevronRight className="w-[22px] h-[22px] lg:w-6 lg:h-6 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Mobile/Tablet: Simple grid layout */}
            <div className="lg:hidden border-t border-gray-300 pt-6 pb-2 border-b">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 px-4 md:px-8">
                    <h2 className="text-base md:text-lg font-normal text-black">از وبلاگ آیس سنتر</h2>
                    <Link
                        href="/blog"
                        className="text-xs md:text-sm text-ocean flex items-center shrink-0"
                    >
                        <span>مشاهده همه</span>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                    </Link>
                </div>

                {/* Grid: 1 col mobile, 2 cols tablet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-8 w-[90%] md:w-full mx-auto">
                    {posts.slice(0, 6).map((blog) => (
                        <MobileCard key={blog.id} blog={blog} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogCarousel;
