'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Instagram, Send, ShieldCheck, Award, CheckCircle2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/**
 * Jalali year — computed once at module load time, not inside render.
 * Fixes Next.js 15 prerender-current-time warning.
 */
function computeJalaliYear(): number {
    const now = new Date();
    const gYear = now.getFullYear();
    const gMonth = now.getMonth() + 1;
    if (gMonth < 3 || (gMonth === 3 && now.getDate() < 21)) {
        return gYear - 622;
    }
    return gYear - 621;
}

// Evaluated once at startup — safe for static rendering
const JALALI_YEAR = computeJalaliYear();

const Footer: React.FC = () => {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-[#0A1424] noise-overlay text-gray-300 mt-20 border-t border-slate-800 select-none relative">
      <div className="max-w-[1600px] mx-auto px-6 py-12 md:py-16 relative z-10">

        {/* main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

          {/* 1. Contact Info Column (Rightmost in RTL) */}
          <div className="text-right flex flex-col items-start order-1">
            <h3 className="text-white font-extrabold text-base mb-5 pb-2 border-b-2 border-ocean/40 w-24">تماس با ما</h3>
            <ul className="space-y-4 text-xs font-semibold">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 shrink-0">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400">تلفن پشتیبانی و فروش</span>
                  <a href={`tel:${settings.phone}`} dir="ltr" className="text-white mt-0.5 text-xs font-bold hover:text-sky-breeze transition-colors">
                    {settings.phoneFormatted || settings.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-breeze shrink-0">
                  <Mail size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400">پست الکترونیکی</span>
                  <a href={`mailto:${settings.email}`} className="text-white mt-0.5 text-xs font-bold font-sans hover:text-sky-breeze transition-colors">
                    {settings.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-breeze shrink-0 mt-0.5">
                  <MapPin size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400">دفتر مرکزی و نمایشگاه</span>
                  <span className="text-white mt-0.5 leading-relaxed">{settings.address}</span>
                </div>
              </li>
            </ul>
          </div>

          {/* 2. Customer Services Column */}
          <div className="text-right flex flex-col items-start order-2">
            <h3 className="text-white font-extrabold text-base mb-5 pb-2 border-b-2 border-ocean/40 w-28">خدمات مشتریان</h3>
            <ul className="space-y-3 text-xs font-bold">
              <li><Link href="/faq" className="hover:text-white hover:translate-x-[-4px] transition-all block">سوالات متداول راه‌اندازی</Link></li>
              <li><Link href="/return-policy" className="hover:text-white hover:translate-x-[-4px] transition-all block">رویه بازگشت ۱۰ روزه کالا</Link></li>
              <li><Link href="/privacy" className="hover:text-white hover:translate-x-[-4px] transition-all block">حریم خصوصی خریداران</Link></li>
              <li><Link href="/terms" className="hover:text-white hover:translate-x-[-4px] transition-all block">شرایط و قوانین استفاده</Link></li>
              <li><Link href="/complaints" className="hover:text-white hover:translate-x-[-4px] transition-all block">ثبت شکایات و پیشنهادات</Link></li>
            </ul>
          </div>

          {/* 3. Quick Links Column */}
          <div className="text-right flex flex-col items-start order-3">
            <h3 className="text-white font-extrabold text-base mb-5 pb-2 border-b-2 border-ocean/40 w-24">دسترسی سریع</h3>
            <ul className="space-y-3 text-xs font-bold">
              <li><Link href="/about" className="hover:text-white hover:translate-x-[-4px] transition-all block">درباره {settings.siteTitle}</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:translate-x-[-4px] transition-all block">تماس با ما</Link></li>
              <li><Link href="/warranty" className="hover:text-white hover:translate-x-[-4px] transition-all block">شرایط گارانتی و خدمات پس از فروش</Link></li>
              <li><Link href="/corporate" className="hover:text-white hover:translate-x-[-4px] transition-all block">طرح ویژه خرید سازمانی و عمده</Link></li>
              <li><Link href="/blog" className="hover:text-white hover:translate-x-[-4px] transition-all block">بلاگ تخصصی صنایع غذایی</Link></li>
            </ul>
          </div>

          {/* 4. Brand Summary Column (Leftmost in RTL) */}
          <div className="text-right flex flex-col items-start order-4">
            <h3 className="text-white font-extrabold text-base mb-5 pb-2 border-b-2 border-ocean/40 w-28">درباره {settings.siteTitle}</h3>
            <p className="text-xs leading-6 text-gray-400 font-medium mb-5">
              {settings.aboutText}
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-3">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام" className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all hover:scale-105">
                  <Instagram size={16} />
                </a>
              )}
              {settings.telegramUrl && (
                <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="تلگرام" className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-ocean hover:text-white transition-all hover:scale-105">
                  <Send size={16} />
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Genuine Service & Trust Commitments Row */}
        <div className="border-t border-slate-800/80 py-8 flex flex-col md:flex-row justify-center items-center gap-6 select-none">
          {/* Commitment 1: Originality */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 w-64 shadow-inner transition-colors hover:border-slate-700">
            <div className="w-11 h-11 rounded-xl bg-ocean/10 text-sky-breeze flex items-center justify-center shrink-0 border border-ocean/20">
              <ShieldCheck size={22} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-gray-400">تضمین کیفیت و برند</span>
              <span className="text-xs font-bold text-white mt-1">اصالت ۱۰۰٪ کالاها</span>
              <span className="text-[9px] text-sky-breeze font-bold mt-0.5">تجهیزات اورجینال</span>
            </div>
          </div>

          {/* Commitment 2: Warranty */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 w-64 shadow-inner transition-colors hover:border-slate-700">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
              <Award size={22} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-gray-400">خدمات پس از فروش</span>
              <span className="text-xs font-bold text-white mt-1">گارانتی معتبر شرکتی</span>
              <span className="text-[9px] text-orange-400 font-bold mt-0.5">پشتیبانی قطعات</span>
            </div>
          </div>

          {/* Commitment 3: Support */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 w-64 shadow-inner transition-colors hover:border-slate-700">
            <div className="w-11 h-11 rounded-xl bg-ocean/10 text-sky-breeze flex items-center justify-center shrink-0 border border-ocean/20">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-gray-400">مشاوره تخصصی خرید</span>
              <span className="text-xs font-bold text-white mt-1">راهنمایی فنی پروژه</span>
              <span className="text-[9px] text-sky-breeze font-bold mt-0.5">مشاوره رایگان</span>
            </div>
          </div>
        </div>

        {/* copyright */}
        <div className="border-t border-slate-850 pt-6">
          <p className="text-center text-xs text-gray-500 font-medium">
            حقوق مادی و معنوی این سایت متعلق به هلدینگ بازرگانی و فروشگاه آنلاین <span className="text-white font-bold">آیس سنتر</span> می‌باشد. © {JALALI_YEAR}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;