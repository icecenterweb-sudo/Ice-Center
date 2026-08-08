'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Snowflake,
  ChevronDown,
  Menu,
  Percent,
  ShieldCheck,
  Megaphone
} from 'lucide-react';
import UserButton from '@/components/auth/UserButton';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toPersianDigits } from '@/lib/persian';
import SearchBar from './SearchBar';
import MobileMenu from './MobileMenu';
import MobileSearchOverlay from './MobileSearchOverlay';
import InstallmentModal from '@/components/modals/InstallmentModal';

interface HeaderSubcategory {
  id: number;
  name: string;
  slug: string;
}

interface HeaderCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: HeaderSubcategory[];
}

const Header: React.FC = () => {
  const { itemCount, totalPrice, openCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  
  // Category states
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  const lastYRef = useRef(0);
  const anchorRef = useRef(0);
  const directionRef = useRef<'up' | 'down' | null>(null);

  const HIDE_AFTER = 72;
  const SHOW_AFTER = 48;
  const REVEAL_ZONE = 120;

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isMenuOpen || isSearchOpen) {
      lastYRef.current = latest;
      anchorRef.current = latest;
      directionRef.current = null;
      if (hidden) setHidden(false);
      return;
    }

    const prevY = lastYRef.current;
    lastYRef.current = latest;

    if (latest < REVEAL_ZONE) {
      anchorRef.current = latest;
      directionRef.current = null;
      if (hidden) setHidden(false);
      return;
    }

    const dir: 'up' | 'down' = latest >= prevY ? 'down' : 'up';

    if (dir !== directionRef.current) {
      directionRef.current = dir;
      anchorRef.current = latest;
      return;
    }

    const travelled = latest - anchorRef.current;

    if (dir === 'down' && travelled > HIDE_AFTER && !hidden) {
      setHidden(true);
    } else if (dir === 'up' && -travelled > SHOW_AFTER && hidden) {
      setHidden(false);
    }
  });

  // Fetch categories from API
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
        {/* Top Announcement Bar */}
        {settings?.announcementText && (
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white text-xs font-extrabold py-2 px-4 text-center flex items-center justify-center gap-2 select-none shadow-sm">
            <Megaphone size={14} className="animate-pulse text-amber-300" />
            <span>{settings.announcementText}</span>
          </div>
        )}
        
        {/* ============================================================ */}
        {/* DESKTOP HEADER (Barfin-Style 3-Tier Desktop Header) */}
        {/* ============================================================ */}
        <header className="hidden lg:flex flex-col w-full select-none">
          {/* Tier 1: Top Dark Navy Utility Bar (Midnight/Steel Theme) */}
          <div className="w-full bg-steel py-2 px-6 border-b border-white/10 text-white">
            <div className="max-w-[1600px] mx-auto flex justify-between items-center text-xs font-medium">
              {/* Right side (RTL start): Nav Links */}
              <div className="flex items-center gap-1.5 text-gray-200">
                <Link href="/" className="hover:text-sky-breeze transition-colors">خانه</Link>
                <span className="text-white/20 px-1">|</span>
                <Link href="/products" className="hover:text-sky-breeze transition-colors">محصولات</Link>
                <span className="text-white/20 px-1">|</span>
                <Link href="/contact" className="hover:text-sky-breeze transition-colors">تماس با ما</Link>
                <span className="text-white/20 px-1">|</span>
                <Link href="/about" className="hover:text-sky-breeze transition-colors">درباره ما</Link>
                <span className="text-white/20 px-1">|</span>
                <Link href="/blog" className="hover:text-sky-breeze transition-colors">بلاگ</Link>
                {user?.isAdmin && (
                  <>
                    <span className="text-white/20 px-1">|</span>
                    <Link
                      href="/admin/dashboard"
                      className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-md font-bold text-xs transition-colors"
                    >
                      <ShieldCheck size={13} className="text-amber-400" />
                      <span>پنل مدیریت</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Left side (RTL end): User Account Button */}
              <div className="flex items-center gap-4">
                <UserButton variant="dark" />
              </div>
            </div>
          </div>

          {/* Tier 2: Middle Main Header (Logo Right, Wide Search Middle, Cart Left) */}
          <div className="w-full bg-white py-3.5 px-6 border-b border-gray-100 shadow-sm">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
              {/* Right: Brand Logo & Tagline */}
              <Link href="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-10 h-10 rounded-2xl bg-midnight flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                  {settings?.siteLogo ? (
                    <Image
                      src={settings.siteLogo}
                      alt={settings.siteTitle || 'logo'}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Snowflake className="text-sky-breeze" size={22} />
                  )}
                </div>
                <div className="flex flex-col text-right">
                  <h1 className="text-xl font-black text-midnight tracking-tight leading-none">{settings?.siteTitle || 'آیس سنتر'}</h1>
                  <span className="text-[11px] font-bold text-ocean mt-1">{settings?.siteSlogan || 'با آیس سنتر، همیشه تخصصی بخر'}</span>
                </div>
              </Link>

              {/* Center: Wide Search Bar */}
              <div className="flex-1 max-w-2xl mx-auto">
                <SearchBar placeholder="جستجوی محصولات..." />
              </div>

              {/* Left: Cart Button Pill */}
              <button
                onClick={openCart}
                className="bg-royal hover:bg-ocean text-white font-bold rounded-full px-5 py-2 flex items-center gap-3 shadow-md hover:shadow-lg transition-all active-press shrink-0 cursor-pointer"
                aria-label="سبد خرید"
              >
                <span className="text-sm font-bold tracking-tight">
                  {totalPrice === 0 ? '۰ تومان' : `${toPersianDigits(totalPrice.toLocaleString())} تومان`}
                </span>
                <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ShoppingCart size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-royal shadow-sm">
                      {toPersianDigits(itemCount)}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Tier 3: Category Mega-Navigation Bar (Solid Royal Blue `bg-royal`) */}
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
            className="w-full bg-royal text-white overflow-visible shadow-md"
          >
            <div ref={barContentRef} className="max-w-[1600px] mx-auto px-6">
              <nav className="flex items-center justify-between py-2.5">
                <ul className="flex items-center gap-6 text-xs md:text-[13px] font-bold">
                  {categories.map((cat) => (
                    <li key={cat.id} className="relative group/catitem">
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="flex items-center gap-1.5 hover:text-sky-breeze transition-colors py-1 select-none"
                      >
                        <span>{cat.name}</span>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <ChevronDown size={14} className="opacity-70 group-hover/catitem:rotate-180 transition-transform duration-200" />
                        )}
                      </Link>

                      {/* Subcategories Dropdown */}
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="absolute top-full right-0 pt-1.5 w-56 opacity-0 pointer-events-none origin-top-right scale-95 group-hover/catitem:opacity-100 group-hover/catitem:pointer-events-auto group-hover/catitem:scale-100 transition-all duration-200 z-50">
                          {/* Invisible hover bridge to prevent dropdown from hiding during mouse movement */}
                          <div className="before:content-[''] before:absolute before:-top-3 before:inset-x-0 before:h-4" />
                          <div className="bg-white text-gray-800 shadow-2xl rounded-2xl p-3 border border-gray-100">
                            <ul className="flex flex-col gap-1 text-right">
                              {cat.subcategories.map((sub) => (
                                <li key={sub.id}>
                                  <Link
                                    href={`/categories/${cat.slug}?subcategory=${sub.id}`}
                                    className="px-3 py-2 text-xs font-semibold text-gray-700 hover:text-royal hover:bg-frost rounded-xl block transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Left side special offer badges */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsInstallmentOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>خرید اقساطی</span>
                  </button>
                  <Link
                    href="/offers"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Percent size={12} className="text-sky-breeze" />
                    <span>پیشنهادات ویژه</span>
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div>
        </header>

        {/* ============================================================ */}
        {/* MOBILE HEADER (Barfin-Style Mobile Header - hidden on desktop) */}
        {/* ============================================================ */}
        <header className="lg:hidden flex flex-col select-none border-b border-gray-100">
          {/* Row 1 (White): Hamburger menu right, Centered Logo with Slogan, User Profile left */}
          <div className="w-full bg-white px-4 py-2.5 flex items-center justify-between">
            {/* Right: Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors active-press"
              aria-label="منو"
            >
              <Menu size={24} />
            </button>

            {/* Center: Brand Logo + Slogan */}
            <Link href="/" className="flex flex-col items-center select-none group/logo">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-midnight flex items-center justify-center text-white shadow-sm">
                  <Snowflake className="text-sky-breeze text-cyan-400" size={14} />
                </div>
                <h1 className="text-sm font-extrabold text-midnight leading-none">آیس سنتر</h1>
              </div>
              <span className="text-[9px] font-semibold text-ocean mt-0.5 tracking-tight">با آیس سنتر، همیشه تخصصی بخر</span>
            </Link>

            {/* Left: User Profile Button */}
            <UserButton variant="light" />
          </div>

          {/* Row 2 (Vibrant Midnight Strip): Pill Search Input right, Circular Blue Cart button left */}
          <div className="w-full bg-midnight px-4 py-2.5 flex items-center gap-3">
            {/* Pill-shaped Search Bar / Trigger button (flex-grow) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-grow h-10 bg-white rounded-full px-3 flex items-center justify-between text-gray-400 text-xs shadow-inner cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-[11px] font-medium pr-1">جستجوی محصولات...</span>
              <div className="w-7 h-7 rounded-full bg-royal text-white flex items-center justify-center shrink-0">
                <Search size={14} />
              </div>
            </button>

            {/* Circular Blue Cart Button with Badge */}
            <button
              onClick={openCart}
              className="relative w-10 h-10 rounded-full bg-royal hover:bg-ocean text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer active-press transition-colors"
              aria-label="سبد خرید"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-midnight">
                  {toPersianDigits(itemCount)}
                </span>
              )}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Drawer Menu & Search Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <MobileMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            categories={categories}
            loading={loadingCategories}
            onOpenInstallment={() => setIsInstallmentOpen(true)}
          />
        )}
      </AnimatePresence>
      <MobileSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Installment Modal Popup */}
      <InstallmentModal
        isOpen={isInstallmentOpen}
        onClose={() => setIsInstallmentOpen(false)}
      />
    </>
  );
};

export default Header;
