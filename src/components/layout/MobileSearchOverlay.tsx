'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SearchBar from './SearchBar';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-white flex flex-col p-4 select-none"
      >
        {/* Top Header Row with Back Button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            aria-label="بازگشت"
          >
            <ArrowRight size={22} />
          </button>
          <span className="text-sm font-bold text-midnight">جستجوی محصولات آیس سنتر</span>
        </div>

        {/* Search Bar Container */}
        <div className="w-full">
          <SearchBar placeholder="نام دستگاه، برند یا دسته‌بندی..." />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
