'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Menu,
  IceCream,
  Snowflake,
  Refrigerator,
  HeartHandshake,
  Award,
  Phone
} from 'lucide-react';

interface DesktopNavProps {
  hidden: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ hidden, onToggleMenu }) => {
  return (
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
            className="flex items-center cursor-pointer hover:text-ocean group transition"
            onClick={onToggleMenu}
          >
            <Menu size={18} className="ml-2 text-gray-500 group-hover:text-ocean" />
            <span className="font-bold">دسته‌بندی محصولات</span>
          </li>

          {/* دستگاه بستنی‌ساز */}
          <li>
            <Link href="/category/ice-cream" className="flex items-center cursor-pointer hover:text-ocean group transition">
              <IceCream size={18} className="ml-2 text-gray-500 group-hover:text-ocean" />
              <span>بستنی‌ساز</span>
            </Link>
          </li>

          {/* دستگاه یخ‌ساز */}
          <li>
            <Link href="/category/ice-maker" className="flex items-center cursor-pointer hover:text-ocean group transition">
              <Snowflake size={18} className="ml-2 text-gray-500 group-hover:text-ocean" />
              <span>یخ‌ساز</span>
            </Link>
          </li>

          {/* فریزر و یخچال */}
          <li>
            <Link href="/category/freezer" className="flex items-center cursor-pointer hover:text-ocean group transition">
              <Refrigerator size={18} className="ml-2 text-gray-500 group-hover:text-ocean" />
              <span>فریزر و یخچال</span>
            </Link>
          </li>

          {/* خرید سازمانی */}
          <li>
            <Link href="/corporate" className="flex items-center cursor-pointer hover:text-ocean group transition">
              <HeartHandshake size={18} className="ml-2 text-gray-500 group-hover:text-ocean" />
              <span>خرید سازمانی</span>
            </Link>
          </li>

          {/* گارانتی */}
          <li>
            <Link href="/warranty" className="flex items-center cursor-pointer hover:text-ocean group transition">
              <Award size={18} className="ml-2 text-gray-500 group-hover:text-ocean" />
              <span>گارانتی و خدمات</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* تماس با ما */}
      <Link
        href="/contact"
        className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-ocean cursor-pointer transition"
      >
        <Phone size={18} />
        <span>تماس با ما</span>
      </Link>
    </motion.div>
  );
};

export default DesktopNav;
