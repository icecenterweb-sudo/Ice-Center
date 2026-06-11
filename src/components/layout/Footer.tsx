import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Instagram, Send } from 'lucide-react';

/**
 * Get current Jalali (Persian) year.
 * Simple conversion: Jalali year ≈ Gregorian year - 621
 */
function getJalaliYear(): number {
    const now = new Date();
    const gYear = now.getFullYear();
    const gMonth = now.getMonth() + 1;
    // Jalali new year is around March 20-21
    if (gMonth < 3 || (gMonth === 3 && now.getDate() < 21)) {
        return gYear - 622;
    }
    return gYear - 621;
}

const Footer: React.FC = () => {
  const jalaliYear = getJalaliYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-[1600px] mx-auto px-4 py-12">

        {/* بخش اصلی */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* درباره ما */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">آیس سنتر</h3>
            <p className="text-sm leading-7">
              فروشگاه تخصصی تجهیزات صنعتی بستنی، یخ‌سازی و سرمایش.
              ارائه دستگاه‌های با کیفیت با گارانتی معتبر.
            </p>
          </div>

          {/* دسترسی سریع */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">دسترسی سریع</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">درباره ما</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">تماس با ما</Link></li>
              <li><Link href="/warranty" className="hover:text-white transition">گارانتی و خدمات</Link></li>
              <li><Link href="/corporate" className="hover:text-white transition">خرید سازمانی</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">وبلاگ</Link></li>
            </ul>
          </div>

          {/* خدمات مشتریان */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">خدمات مشتریان</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-white transition">سوالات متداول</Link></li>
              <li><Link href="/return-policy" className="hover:text-white transition">رویه بازگشت کالا</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">حریم خصوصی</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">قوانین و مقررات</Link></li>
            </ul>
          </div>

          {/* تماس با ما */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">تماس با ما</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span dir="ltr">{process.env.NEXT_PUBLIC_PHONE || '021-12345678'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>{process.env.NEXT_PUBLIC_EMAIL || 'info@icecenter.ir'}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1" />
                <span>{process.env.NEXT_PUBLIC_ADDRESS || 'تهران، خیابان ولیعصر، پلاک 123'}</span>
              </li>
            </ul>

            {/* شبکه‌های اجتماعی */}
            <div className="flex gap-3 mt-4">
              <a href={process.env.NEXT_PUBLIC_INSTAGRAM || '#'} aria-label="اینستاگرام" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition">
                <Instagram size={18} aria-hidden="true" />
              </a>
              <a href={process.env.NEXT_PUBLIC_TELEGRAM || '#'} aria-label="تلگرام" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition">
                <Send size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

        </div>

        {/* خط جداکننده */}
        <div className="border-t border-gray-800 pt-6">
          <p className="text-center text-sm text-gray-500">
            © {jalaliYear} تمامی حقوق این سایت متعلق به <span className="text-white font-bold">آیس سنتر</span> می‌باشد.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;