'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Send, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { fieldClass } from '@/lib/form-classes';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'مشاوره خرید تجهیزات',
    message: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newFieldErrors.name = 'نام و نام خانوادگی الزامی است';
    }
    if (!formData.phone.trim()) {
      newFieldErrors.phone = 'شماره تماس الزامی است';
    } else if (!/^(\+98|0)?9\d{9}$/.test(formData.phone.trim())) {
      newFieldErrors.phone = 'شماره موبایل نامعتبر است';
    }
    if (!formData.message.trim()) {
      newFieldErrors.message = 'متن پیام الزامی است';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      toast.error('لطفاً خطاهای فرم را برطرف نمایید.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('پیام شما با موفقیت ثبت شد. کارشناسان آیس سنتر به زودی با شما تماس خواهند گرفت.');
      setFormData({ name: '', phone: '', subject: 'مشاوره خرید تجهیزات', message: '' });
      setFieldErrors({});
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 select-none" dir="rtl">
      {/* Breadcrumb & Hero Header */}
      <div className="w-full bg-midnight text-white py-12 px-6 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ocean/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-breeze mb-4">
            <Link href="/" className="hover:text-white transition-colors">خانه</Link>
            <ChevronRight size={14} className="rotate-180 text-gray-400" />
            <span className="text-white">تماس با ما</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">تماس با آیس سنتر</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
            مشاوران تخصصی تجهیزات برودتی و بستنی‌سازهای آیس سنتر، آماده پاسخگویی به سوالات و ارائه مشاوره رایگان راه‌اندازی کسب‌وکار شما هستند.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Phone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">تلفن مستقیم مشاوره و فروش</h3>
              <p className="text-xs text-slate-500 mb-4">جهت استعلام قیمت، مشاوره تخصصی و ثبت سفارش تلفنی</p>
            </div>
            
            <a
              href="tel:09122248917"
              dir="ltr"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-colors text-center cursor-pointer"
            >
              <span>۰۹۱۲-۲۲۴-۸۹۱۷</span>
              <Phone size={18} />
            </a>
          </motion.div>

          {/* Card 2: Email */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">پست الکترونیکی (ایمیل)</h3>
              <p className="text-xs text-slate-500 mb-4">ارسال پیشنهادات، استعلام‌های رسمی و همکاری‌های سازمانی</p>
            </div>

            <a
              href="mailto:icecenter.web@gmail.com"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-colors text-center font-sans dir-ltr cursor-pointer"
            >
              <Mail size={18} />
              <span>icecenter.web@gmail.com</span>
            </a>
          </motion.div>

          {/* Card 3: Address & Working Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">آدرس نمایشگاه و دفتر مرکزی</h3>
              <p className="text-sm font-extrabold text-slate-700 leading-relaxed mb-4">
                تهران، چهاردانگه، ماهر ۲۱
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Clock size={16} className="text-emerald-600 shrink-0" />
              <span>ساعات کاری: شنبه تا چهارشنبه ۹ الی ۱۸ | پنجشنبه ۹ الی ۱۴</span>
            </div>
          </motion.div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 max-w-4xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">ارسال پیام به کارشناسان</h2>
            <p className="text-slate-500 text-xs md:text-sm">
              اگر سوالی درباره محصولات، نحوه ارسال یا گارانتی دارید، فرم زیر را تکمیل کنید تا کارشناسان ما در سریع‌ترین زمان پاسخ دهند.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">نام و نام خانوادگی <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: علی محمدی"
                  value={formData.name}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    clearFieldError('name');
                  }}
                  className={fieldClass(
                    "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-royal focus:bg-white transition-all",
                    !!fieldErrors.name
                  )}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="text-xs font-medium text-red-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">شماره تماس (جهت پیگیری) <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  placeholder="مثال: ۰۹۱۲۲۲۴۸۹۱۷"
                  value={formData.phone}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    clearFieldError('phone');
                  }}
                  className={fieldClass(
                    "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-royal focus:bg-white transition-all text-right",
                    !!fieldErrors.phone
                  )}
                />
                {fieldErrors.phone && (
                  <p id="phone-error" className="text-xs font-medium text-red-600 mt-1">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">موضوع پیام</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-royal focus:bg-white transition-all"
              >
                <option value="مشاوره خرید تجهیزات">مشاوره خرید تجهیزات برودتی و بستنی ساز</option>
                <option value="پیگیری سفارش">پیگیری سفارش خرید</option>
                <option value="استعلام قیمت عمده">استعلام قیمت عمده و سازمانی</option>
                <option value="خدمات پس از فروش">خدمات پس از فروش و گارانتی</option>
                <option value="سایر موضوعات">سایر موضوعات</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">متن پیام شما <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                placeholder="پیام خود را به طور کامل بنویسید..."
                value={formData.message}
                aria-invalid={!!fieldErrors.message}
                aria-describedby={fieldErrors.message ? 'message-error' : undefined}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  clearFieldError('message');
                }}
                className={fieldClass(
                  "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-royal focus:bg-white transition-all resize-none",
                  !!fieldErrors.message
                )}
              />
              {fieldErrors.message && (
                <p id="message-error" className="text-xs font-medium text-red-600 mt-1">{fieldErrors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-royal hover:bg-ocean text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>در حال ثبت...</span>
              ) : (
                <>
                  <Send size={18} className="rotate-180" />
                  <span>ارسال پیام پشتیبانی</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
