'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  X,
  IceCream,
  Snowflake,
  Refrigerator,
  HeartHandshake,
  Award,
  Phone,
  User
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60]"
      onClick={onClose}
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
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 cursor-pointer"
            aria-label="بستن منو"
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
                onClick={onClose}
              >
                <IceCream size={20} />
                <span>دستگاه بستنی‌ساز</span>
              </Link>
            </li>

            <li>
              <Link
                href="/category/ice-maker"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                onClick={onClose}
              >
                <Snowflake size={20} />
                <span>دستگاه یخ‌ساز</span>
              </Link>
            </li>

            <li>
              <Link
                href="/category/freezer"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                onClick={onClose}
              >
                <Refrigerator size={20} />
                <span>فریزر و یخچال</span>
              </Link>
            </li>

            <li className="border-t pt-4">
              <Link
                href="/corporate"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                onClick={onClose}
              >
                <HeartHandshake size={20} />
                <span>خرید سازمانی</span>
              </Link>
            </li>

            <li>
              <Link
                href="/warranty"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                onClick={onClose}
              >
                <Award size={20} />
                <span>گارانتی و خدمات</span>
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                onClick={onClose}
              >
                <Phone size={20} />
                <span>تماس با ما</span>
              </Link>
            </li>

            <li className="border-t pt-4">
              <Link
                href="/auth"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition py-2"
                onClick={onClose}
              >
                <User size={20} />
                <span>ورود / ثبت‌نام</span>
              </Link>
            </li>
          </ul>
        </nav>
      </motion.div>
    </motion.div>
  );
};

export default MobileMenu;
