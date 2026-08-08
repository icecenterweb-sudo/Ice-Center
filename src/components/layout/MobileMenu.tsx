'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  X,
  Home,
  BookOpen,
  Info,
  Phone,
  User,
  ChevronDown,
  ChevronLeft,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Subcategory {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories?: Subcategory[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  loading?: boolean;
  onOpenInstallment?: () => void;
}

export default function MobileMenu({ isOpen, onClose, categories, onOpenInstallment }: MobileMenuProps) {
  const { user } = useAuth();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (categoryId: number) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-midnight text-white">
          <div className="flex items-center gap-2">
            <User size={18} className="text-sky-breeze" />
            <span className="text-sm font-bold">منوی دسترسی</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section: Categories */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-2 px-2 text-right">دسته‌بندی محصولات</h4>
            {!categories || categories.length === 0 ? (
              <p className="text-xs text-gray-400 px-2">در حال بارگذاری...</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                {categories.map((cat) => {
                  const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                  const isExpanded = expandedCategory === cat.id;

                  return (
                    <li key={cat.id} className="bg-white">
                      <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
                        <Link
                          href={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="text-xs font-bold text-gray-800 hover:text-ocean flex-1 text-right"
                        >
                          {cat.name}
                        </Link>
                        {hasSubs && (
                          <button
                            onClick={() => toggleCategory(cat.id)}
                            className="p-1 text-gray-400 hover:text-midnight transition-colors cursor-pointer"
                            aria-label="نمایش زیردسته‌ها"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Accordion Subcategories */}
                      {hasSubs && isExpanded && (
                        <div className="bg-gray-50/70 px-4 py-2 border-t border-gray-100">
                          <ul className="divide-y divide-gray-50">
                            {cat.subcategories!.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={`/categories/${cat.slug}?subcategory=${sub.id}`}
                                  onClick={onClose}
                                  className="block py-2 text-[11px] text-gray-600 hover:text-midnight"
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Section: Secondary Utility Links */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 mb-2 px-2 text-right">لینک‌های عمومی</h4>
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              {user?.isAdmin && (
                <li>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center justify-between min-h-[48px] px-4 py-3 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                    onClick={onClose}
                  >
                    <span className="font-bold">پنل مدیریت</span>
                    <ShieldCheck size={16} className="text-amber-600" />
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={() => {
                    onClose();
                    onOpenInstallment?.();
                  }}
                  className="w-full flex items-center justify-between min-h-[48px] px-4 py-3 text-xs bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>خرید اقساطی</span>
                  </div>
                  <Sparkles size={16} />
                </button>
              </li>
              <li>
                <Link
                  href="/"
                  className="flex items-center justify-between min-h-[48px] px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  <span className="font-bold">صفحه اصلی</span>
                  <Home size={16} className="text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="flex items-center justify-between min-h-[48px] px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  <span className="font-bold">بلاگ تخصصی</span>
                  <BookOpen size={16} className="text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="flex items-center justify-between min-h-[48px] px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  <span className="font-bold">درباره ما</span>
                  <Info size={16} className="text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center justify-between min-h-[48px] px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  <span className="font-bold">تماس با ما</span>
                  <Phone size={16} className="text-gray-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* User login at the bottom */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center justify-center gap-2 min-h-[48px] bg-midnight hover:bg-ocean text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <User size={18} />
            <span>حساب کاربری من</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
