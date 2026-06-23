'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Snowflake,
} from 'lucide-react';
import UserButton from '@/components/auth/UserButton';
import { useCart } from '@/context/CartContext';
import { toPersianDigits } from '@/lib/persian';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import DesktopNav from './DesktopNav';
import MobileMenu from './MobileMenu';

const Header: React.FC = () => {
  const { itemCount, openCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const suppressRef = useRef(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const delta = latest - previous;

    // Don't hide if menu/search is open
    if (isMenuOpen || isSearchOpen) {
      setHidden(false);
      return;
    }

    // Skip tiny jitters and while we let the animation settle
    if (suppressRef.current) return;
    if (Math.abs(delta) < 3) return;

    // Always show near the top
    if (latest < 80) {
      if (hidden) setHidden(false);
      return;
    }

    // Hide on scroll down with a small buffer, show on scroll up with hysteresis
    if (delta > 6 && !hidden) {
      setHidden(true);
      suppressRef.current = true;
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => { suppressRef.current = false; }, 180);
    } else if (delta < -4 && hidden) {
      setHidden(false);
      suppressRef.current = true;
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => { suppressRef.current = false; }, 180);
    }
  });

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <div className="w-full bg-white shadow-sm sticky top-0 z-50">
        <header className="max-w-[1600px] mx-auto px-4 py-4">

          {/* بخش بالا: لوگو، سرچ، اکشن‌ها - همیشه نمایش داده می‌شود */}
          <div className="flex justify-between items-center mb-0 lg:mb-5">

            {/* موبایل/تبلت: لوگو سمت راست */}
            <div className="flex items-center lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <Snowflake className="text-blue-600" size={28} />
                <div>
                  <h1 className="text-base font-bold text-gray-800">آیس سنتر</h1>
                </div>
              </Link>
            </div>

            {/* دسکتاپ: لوگو و سرچ */}
            <div className="hidden lg:flex items-center flex-grow max-w-4xl">
              {/* لوگو */}
              <Link href="/" className="ml-6 shrink-0">
                <div className="flex items-center gap-2">
                  <Snowflake className="text-blue-600" size={32} />
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">آیس سنتر</h1>
                    <p className="text-[10px] text-gray-500">تجهیزات صنعتی سرمایش</p>
                  </div>
                </div>
              </Link>

              {/* جستجو */}
              <SearchBar className="w-full max-w-[600px]" />
            </div>

            {/* موبایل/تبلت: دکمه جستجو و سبد خرید */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* دکمه جستجو */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="جستجو"
                className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Search size={20} aria-hidden="true" />
              </button>

              {/* دکمه سبد خرید */}
              <button
                onClick={openCart}
                aria-label="سبد خرید"
                className="relative flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold"
                  >
                    {toPersianDigits(itemCount > 99 ? 99 : itemCount)}
                  </motion.span>
                )}
              </button>
            </div>

            {/* دسکتاپ: ورود، اعلان و سبد خرید */}
            <div className="hidden lg:flex items-center gap-4">
              {/* دکمه ورود / حساب کاربری */}
              <UserButton />

              {/* دکمه اعلان‌ها */}
              <NotificationBell />

              {/* دکمه سبد خرید */}
              <button
                onClick={openCart}
                aria-label="سبد خرید"
                className="relative flex items-center justify-center w-11 h-11 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold"
                  >
                    {toPersianDigits(itemCount > 99 ? 99 : itemCount)}
                  </motion.span>
                )}
              </button>
            </div>
          </div>

          {/* باکس جستجو موبایل (وقتی باز میشه) */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-3 pb-3"
              >
                <SearchBar
                  className="w-full"
                  placeholder="جستجو در محصولات..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* بخش پایین: منوی ناوبری دسکتاپ */}
          <DesktopNav
            hidden={hidden}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
          />

        </header>
      </div>

      {/* منوی کشویی موبایل */}
      <AnimatePresence>
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </AnimatePresence>
    </>
  );
};

export default Header;
