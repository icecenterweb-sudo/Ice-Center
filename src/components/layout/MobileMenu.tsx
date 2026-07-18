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
  ChevronLeft
} from 'lucide-react';

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
  loading: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, categories, loading }) => {
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (id: number) => {
    setExpandedCatId(expandedCatId === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="lg:hidden fixed inset-0 bg-black/50 z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white w-4/5 max-w-sm h-full flex flex-col absolute right-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-midnight">منوی ناوبری</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-midnight cursor-pointer rounded-full hover:bg-gray-50 transition"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items Content */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          
          {/* Section: Categories Accordion */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-2 px-2 text-right">دسته‌بندی محصولات</h4>
            
            {loading ? (
              <div className="py-4 text-center text-xs text-gray-400">در حال بارگذاری دسته‌بندی‌ها...</div>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                {categories.map((cat) => {
                  const isExpanded = expandedCatId === cat.id;
                  const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                  
                  return (
                    <li key={cat.id} className="flex flex-col">
                      {/* Touch target 48px */}
                      <div 
                        onClick={() => hasSubs ? toggleCategory(cat.id) : onClose()}
                        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-right cursor-pointer select-none text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex-grow text-right">{cat.name}</span>
                        {hasSubs ? (
                          <ChevronDown 
                            size={16} 
                            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-midnight' : ''}`} 
                          />
                        ) : (
                          <Link href={`/categories/${cat.slug}`} onClick={onClose}>
                            <ChevronLeft size={16} className="text-gray-400" />
                          </Link>
                        )}
                      </div>

                      {/* Expandable subcategories accordion */}
                      {hasSubs && isExpanded && (
                        <div className="bg-gray-50/50 border-t border-gray-50 px-4 py-2 flex flex-col text-right">
                          <Link 
                            href={`/categories/${cat.slug}`}
                            onClick={onClose}
                            className="min-h-[44px] flex items-center text-[11px] font-bold text-sky-breeze hover:text-ocean py-2 border-b border-dashed border-gray-100"
                          >
                            <span>مشاهده همه محصولات {cat.name}</span>
                          </Link>
                          <ul className="divide-y divide-gray-50">
                            {cat.subcategories!.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={`/categories/${cat.slug}?subcategory=${sub.id}`}
                                  onClick={onClose}
                                  className="min-h-[48px] flex items-center text-[11px] text-gray-500 hover:text-midnight py-2.5 pr-2"
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
    </motion.div>
  );
};

export default MobileMenu;
