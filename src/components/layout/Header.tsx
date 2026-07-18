'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Snowflake,
  ChevronDown,
  ChevronLeft,
  Menu,
  LayoutGrid,
  Percent
} from 'lucide-react';
import UserButton from '@/components/auth/UserButton';
import { useCart } from '@/context/CartContext';
import { toPersianDigits } from '@/lib/persian';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import MobileMenu from './MobileMenu';

const Header: React.FC = () => {
  const { itemCount, totalPrice, openCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  
  // Category states
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Measure the categories bar's natural height so we can animate to a fixed
  // pixel value instead of `height: "auto"`. Animating to "auto" forces Framer
  // to run a measure pass on every toggle, which is the source of the lag.
  const barContentRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState<number>();

  useEffect(() => {
    const el = barContentRef.current;
    if (!el) return;
    const update = () => setBarHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories, loadingCategories]);

  // Anchor-based scroll direction tracking. Instead of reacting to the tiny
  // per-frame delta (which flips sign on momentum/trackpad scrolling and makes
  // the bar flicker), we remember the scroll position where the direction last
  // changed and only toggle once the user has travelled a meaningful distance
  // in one consistent direction. This removes the need for any suppression timer.
  const lastYRef = useRef(0);
  const anchorRef = useRef(0);
  const directionRef = useRef<'up' | 'down' | null>(null);

  // How far (px) the user must scroll past the anchor before we react.
  const HIDE_AFTER = 72; // scroll down this far → hide
  const SHOW_AFTER = 48; // scroll up this far → show
  const REVEAL_ZONE = 120; // always visible within this many px of the top

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Keep the bar fully open while an overlay is active, and keep the anchor
    // pinned to the current position so it doesn't lurch when the overlay closes.
    if (isMenuOpen || isSearchOpen) {
      lastYRef.current = latest;
      anchorRef.current = latest;
      directionRef.current = null;
      if (hidden) setHidden(false);
      return;
    }

    const prevY = lastYRef.current;
    lastYRef.current = latest;

    // Near the top of the page the bar is always shown.
    if (latest < REVEAL_ZONE) {
      anchorRef.current = latest;
      directionRef.current = null;
      if (hidden) setHidden(false);
      return;
    }

    const dir: 'up' | 'down' = latest >= prevY ? 'down' : 'up';

    // On a direction change, reset the anchor so distance is measured from the
    // point the user changed their mind — this is what kills the flicker.
    if (dir !== directionRef.current) {
      directionRef.current = dir;
      anchorRef.current = latest;
      return;
    }

    const travelled = latest - anchorRef.current; // + when scrolling down

    if (dir === 'down' && travelled > HIDE_AFTER && !hidden) {
      setHidden(true);
    } else if (dir === 'up' && -travelled > SHOW_AFTER && hidden) {
      setHidden(false);
    }
  });

  // Fetch categories with subcategories from the database API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories?withSubs=true');
        const json = await res.json();
        if (json.success && json.data) {
          setCategories(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch header categories:', e);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <div className="w-full bg-white shadow-sm sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200 ease-out">
        
        {/* 1. Utility Bar at the very top */}
        {/* Desktop Utility Bar */}
        <div className="w-full bg-gray-50 border-b border-gray-100 py-1.5 px-4 hidden lg:block">
          <div className="max-w-[1600px] mx-auto flex justify-between items-center text-[11px] text-gray-500 font-medium">
            <div className="text-gray-400">تلفن پشتیبانی: ۰۲۱-۵۵۶۶۷۷۸۸ | ساعت پاسخگویی ۹ تا ۱۸</div>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-midnight transition-colors">صفحه اصلی</Link>
              <Link href="/blog" className="hover:text-midnight transition-colors">بلاگ تخصصی</Link>
              <Link href="/about" className="hover:text-midnight transition-colors">درباره ما</Link>
              <Link href="/contact" className="hover:text-midnight transition-colors">تماس با ما</Link>
            </div>
          </div>
        </div>

        {/* Mobile Compact Utility Bar (Top compact row on mobile) */}
        <div className="w-full bg-gray-50 border-b border-gray-100 py-2 px-4 lg:hidden flex justify-between items-center text-gray-600 select-none">
          {/* Hamburger icon right-aligned (leading in RTL) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-[background-color,color] duration-[150ms] ease-out active-press"
            aria-label="منو"
          >
            <Menu size={22} />
          </button>
          
          {/* Cart/Login icons left-aligned (trailing in RTL) */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            <button
              onClick={openCart}
              className="relative p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-[background-color,color] duration-[150ms] ease-out active-press"
              aria-label="سبد خرید"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {toPersianDigits(itemCount)}
                </span>
              )}
            </button>
            {/* Login Icon */}
            <UserButton />
          </div>
        </div>

        {/* 2. Main Header (Middle) */}
        {/* Desktop Main Header */}
        <header className="max-w-[1600px] mx-auto px-4 py-4 hidden lg:flex items-center justify-between gap-4">
          {/* Right side: Brand Logotype & Tagline */}
          <Link href="/" className="flex items-center gap-2 shrink-0 select-none group/logo">
            <div className="w-10 h-10 rounded-xl bg-midnight flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover/logo:scale-105">
              <Snowflake className="text-sky-breeze transition-transform duration-500 group-hover/logo:rotate-45" size={24} />
            </div>
            <div className="flex flex-col items-start text-right">
              <h1 className="text-lg font-bold text-midnight leading-none">آیس سنتر</h1>
              <span className="text-[10px] text-gray-400 mt-1">تجهیزات صنعتی و بازرگانی سرمایش</span>
            </div>
          </Link>

          {/* Center: Large Centered Search Bar */}
          <div className="flex-grow max-w-2xl mx-8">
            <SearchBar placeholder="نام دستگاه، برند یا دسته‌بندی را جستجو کنید..." />
          </div>

          {/* Left side: Login, Notification and Pill-shaped Cart Indicator */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserButton />

            {/* Pill-shaped Cart Indicator showing a live total in Toman */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-full transition-[background-color,border-color,transform,box-shadow] duration-[150ms] ease-out cursor-pointer shadow-sm text-gray-700 font-semibold text-sm group active-press"
              aria-label="سبد خرید"
            >
              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-midnight/5 text-midnight group-hover:bg-midnight group-hover:text-white transition-[background-color,color] duration-150 ease-out">
                <ShoppingCart size={15} />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                    {toPersianDigits(itemCount)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start leading-none text-right">
                <span className="text-[9px] text-gray-400 font-medium">مبلغ کل</span>
                <span className="text-xs text-midnight font-bold mt-0.5">
                  {itemCount > 0 ? `${toPersianDigits(totalPrice.toLocaleString())} تومان` : '۰ تومان'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Main Header (Two-row stack - hidden on desktop) */}
        <header className="lg:hidden flex flex-col px-4 py-3 gap-2.5 bg-white border-b border-gray-50 select-none">
          {/* Row 1: Logo leading, cart pill & login trailing */}
          <div className="flex justify-between items-center gap-3">
            {/* Logo leading */}
            <Link href="/" className="flex items-center gap-1.5 shrink-0 select-none group/logo">
              <div className="w-7 h-7 rounded-lg bg-midnight flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover/logo:scale-105">
                <Snowflake className="text-sky-breeze transition-transform duration-500 group-hover/logo:rotate-45" size={16} />
              </div>
              <h1 className="text-xs font-bold text-midnight leading-none">آیس سنتر</h1>
            </Link>

            {/* Cart pill & login trailing */}
            <div className="flex items-center gap-2">
              {/* Profile button */}
              <UserButton />
              
              {/* Pill-shaped cart indicator showing a live total in Toman */}
              <button
                onClick={openCart}
                className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 bg-white hover:bg-gray-50 rounded-full transition-[background-color,border-color,transform,box-shadow] duration-[150ms] ease-out cursor-pointer shadow-sm text-gray-700 font-semibold text-[10px] active-press"
                aria-label="سبد خرید"
              >
                <div className="relative flex items-center justify-center w-5.5 h-5.5 rounded-full bg-midnight/5 text-midnight">
                  <ShoppingCart size={11} />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] w-3 h-3 flex items-center justify-center rounded-full font-bold">
                      {toPersianDigits(itemCount)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-midnight font-bold">
                  {itemCount > 0 ? `${toPersianDigits(totalPrice.toLocaleString())} تومان` : '۰ تومان'}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Full-width search bar with leading search icon */}
          <div className="w-full">
            <SearchBar placeholder="جستجو در محصولات..." />
          </div>
        </header>

        {/* 3. Unified Categories Mega-Navigation Bar (Bottom - Desktop Only) */}
        <motion.div
          initial={false}
          animate={{
            height: hidden ? 0 : (barHeight ?? "auto"),
            opacity: hidden ? 0 : 1,
          }}
          transition={{
            height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: hidden ? 0.15 : 0.25, ease: "easeOut" },
          }}
          style={{ willChange: "height" }}
          className="hidden lg:block w-full bg-midnight border-t border-white/5 overflow-visible"
        >
          <div ref={barContentRef} className="max-w-[1600px] mx-auto px-4">
            <nav className="flex items-center justify-between py-2 text-white">
              <ul className="flex items-center gap-6 text-[13px] font-medium leading-loose">
                
                {/* Unified Category Dropdown */}
                <li className="relative group/megamenu">
                  <button className="flex items-center gap-2 hover:text-sky-breeze transition-colors py-1 cursor-pointer font-bold select-none">
                    <LayoutGrid size={16} className="text-sky-breeze" />
                    <span>دسته‌بندی محصولات</span>
                    <ChevronDown size={12} className="opacity-60 group-hover/megamenu:rotate-180 transition-transform duration-200" />
                  </button>

                  {/* Mega Dropdown Menu Popover */}
                  <div className="absolute top-full right-0 w-[960px] bg-white text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-150 rounded-b-2xl p-8 opacity-0 pointer-events-none origin-top-right scale-95 translate-y-1.5 group-hover/megamenu:opacity-100 group-hover/megamenu:pointer-events-auto group-hover/megamenu:scale-100 group-hover/megamenu:translate-y-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] z-50">
                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-12 text-gray-400 text-xs font-semibold">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full ml-2"></span>
                        در حال بارگذاری دسته‌بندی‌ها...
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-8 max-h-[480px] overflow-y-auto pr-1">
                        {categories.map((cat: any) => (
                          <div key={cat.id} className="flex flex-col text-right">
                            <Link 
                              href={`/categories/${cat.slug}`} 
                              className="text-xs font-bold text-midnight hover:text-orange-500 transition-colors mb-3 pb-1.5 border-b border-gray-100 flex items-center justify-between group/cat"
                            >
                              <span>{cat.name}</span>
                              <ChevronLeft size={12} className="text-gray-300 group-hover/cat:translate-x-[-4px] transition-transform" />
                            </Link>

                            {cat.subcategories && cat.subcategories.length > 0 ? (
                              <ul className="flex flex-col gap-2">
                                {cat.subcategories.map((sub: any) => (
                                  <li key={sub.id}>
                                    <Link 
                                      href={`/categories/${cat.slug}?subcategory=${sub.id}`}
                                      className="text-[11px] text-gray-500 hover:text-orange-500 transition-colors block pr-2 relative before:content-[''] before:absolute before:right-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-gray-300 hover:before:bg-orange-500"
                                    >
                                      {sub.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">بدون زیردسته‌بندی</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>

                {/* 2. Distinctly highlighted financing / cash-and-installment offers */}
                <li>
                  <Link 
                    href="/installment" 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1 rounded-full text-xs font-bold transition-[background-color,transform,box-shadow] duration-[150ms] ease-out shadow-[0_2px_8px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_12px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active-press flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>خرید اقساطی (بدون ضامن)</span>
                  </Link>
                </li>

                {/* 3. Seasonal discounts */}
                <li>
                  <Link 
                    href="/offers" 
                    className="text-sky-breeze hover:text-white font-bold flex items-center gap-1 border border-ocean/30 px-3 py-1 rounded-full bg-ocean/10 hover:bg-ocean/20 transition-[background-color,border-color,color] duration-[150ms] ease-out select-none text-xs active-press cursor-pointer"
                  >
                    <Percent size={12} className="text-sky-breeze" />
                    <span>جشنواره تخفیف‌های فصلی</span>
                  </Link>
                </li>

                {/* 4. Lightweight links for blog, about, contact */}
                <li>
                  <Link href="/blog" className="hover:text-sky-breeze text-gray-300 hover:text-white transition-colors py-1">
                    بلاگ تخصصی
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-sky-breeze text-gray-300 hover:text-white transition-colors py-1">
                    درباره ما
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-sky-breeze text-gray-300 hover:text-white transition-colors py-1">
                    تماس با ما
                  </Link>
                </li>
              </ul>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 select-none">
                <span>تجهیز تخصصی صنایع غذایی و بازرگانی</span>
              </div>
            </nav>
          </div>
        </motion.div>
      </div>

      {/* Mobile Drawer Menu (Passing dynamic categories down) */}
      <AnimatePresence>
        {isMenuOpen && (
          <MobileMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            categories={categories}
            loading={loadingCategories}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
