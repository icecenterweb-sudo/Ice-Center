'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Search,
  User,
  ShoppingCart,
  Menu,
  Phone,
  Snowflake,
  IceCream,
  Refrigerator,
  HeartHandshake,
  Award,
  X
} from 'lucide-react';
import UserButton from '@/components/auth/UserButton';
import { useCart } from '@/context/CartContext';
import { toPersianDigits } from '@/lib/numbers';
import SearchBar from './SearchBar';

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
                className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Search size={20} aria-hidden="true" />
              </button>

              {/* دکمه سبد خرید */}
              <button
                onClick={openCart}
                aria-label="سبد خرید"
                className="relative flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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

            {/* دسکتاپ: ورود و سبد خرید */}
            <div className="hidden lg:flex items-center gap-4">
              {/* دکمه ورود / حساب کاربری */}
              <UserButton />

              {/* دکمه سبد خرید */}
              <button
                onClick={openCart}
                aria-label="سبد خرید"
                className="relative flex items-center justify-center w-11 h-11 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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

          {/* بخش پایین: منوی ناوبری - فقط دسکتاپ - این قسمت پنهان/نمایش می‌شود */}
          <motion.div
            variants={{
              visible: { height: "auto", opacity: 1 },
              hidden: { height: 0, opacity: 0 },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden lg:flex justify-between items-center overflow-hidden"
          >

            {/* منوی اصلی */}
            <nav>
              <ul className="flex items-center gap-6 text-sm text-gray-700 font-medium">

                {/* دسته‌بندی محصولات */}
                <li
                  className="flex items-center cursor-pointer hover:text-blue-600 group transition"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu size={18} className="ml-2 text-gray-500 group-hover:text-blue-600" />
                  <span className="font-bold">دسته‌بندی محصولات</span>
                </li>

                {/* دستگاه بستنی‌ساز */}
                <li>
                  <Link href="/category/ice-cream" className="flex items-center cursor-pointer hover:text-blue-600 group transition">
                    <IceCream size={18} className="ml-2 text-gray-500 group-hover:text-blue-600" />
                    <span>بستنی‌ساز</span>
                  </Link>
                </li>

                {/* دستگاه یخ‌ساز */}
                <li>
                  <Link href="/category/ice-maker" className="flex items-center cursor-pointer hover:text-blue-600 group transition">
                    <Snowflake size={18} className="ml-2 text-gray-500 group-hover:text-blue-600" />
                    <span>یخ‌ساز</span>
                  </Link>
                </li>

                {/* فریزر و یخچال */}
                <li>
                  <Link href="/category/freezer" className="flex items-center cursor-pointer hover:text-blue-600 group transition">
                    <Refrigerator size={18} className="ml-2 text-gray-500 group-hover:text-blue-600" />
                    <span>فریزر و یخچال</span>
                  </Link>
                </li>

                {/* خرید سازمانی */}
                <li>
                  <Link href="/corporate" className="flex items-center cursor-pointer hover:text-blue-600 group transition">
                    <HeartHandshake size={18} className="ml-2 text-gray-500 group-hover:text-blue-600" />
                    <span>خرید سازمانی</span>
                  </Link>
                </li>

                {/* گارانتی */}
                <li>
                  <Link href="/warranty" className="flex items-center cursor-pointer hover:text-blue-600 group transition">
                    <Award size={18} className="ml-2 text-gray-500 group-hover:text-blue-600" />
                    <span>گارانتی و خدمات</span>
                  </Link>
                </li>

              </ul>
            </nav>

            {/* تماس با ما */}
            <Link
              href="/contact"
              className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-blue-600 cursor-pointer transition"
            >
              <Phone size={18} />
              <span>تماس با ما</span>
            </Link>

          </motion.div>

          {/* Removed: دسته‌بندی button - now in MobileBottomNav */}

        </header>
      </div>

      {/* منوی کشویی موبایل */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60]"
          onClick={() => setIsMenuOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white w-4/5 max-w-sm h-full p-6 overflow-y-auto absolute right-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر منو */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">منوی اصلی</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            {/* آیتم‌های منو */}
            <nav>
              <ul className="space-y-4">

                <li>
                  <Link
                    href="/category/ice-cream"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IceCream size={20} />
                    <span>دستگاه بستنی‌ساز</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/category/ice-maker"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Snowflake size={20} />
                    <span>دستگاه یخ‌ساز</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/category/freezer"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Refrigerator size={20} />
                    <span>فریزر و یخچال</span>
                  </Link>
                </li>

                <li className="border-t pt-4">
                  <Link
                    href="/corporate"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <HeartHandshake size={20} />
                    <span>خرید سازمانی</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/warranty"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Award size={20} />
                    <span>گارانتی و خدمات</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Phone size={20} />
                    <span>تماس با ما</span>
                  </Link>
                </li>

                <li className="border-t pt-4">
                  <Link
                    href="/auth"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>ورود / ثبت‌نام</span>
                  </Link>
                </li>

              </ul>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Header;
