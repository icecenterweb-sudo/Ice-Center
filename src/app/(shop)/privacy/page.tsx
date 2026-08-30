import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

// NOTE (editorial, for the site owner — not shown to users):
// This privacy policy is PLACEHOLDER copy generated for structure only. It must
// be reviewed and finalized by the business owner (and aligned with actual data
// handling, e.g. SMS OTP provider and hosting/log retention) before production.

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `حریم خصوصی خریداران | ${settings.siteTitle}`,
        description: `سیاست حفظ حریم خصوصی و نحوه استفاده از اطلاعات خریداران در ${settings.siteTitle}`,
    };
}

export default async function PrivacyPage() {
    const settings = await getSiteSettings();

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 select-none" dir="rtl">
            {/* Breadcrumb & Hero Header */}
            <div className="w-full bg-midnight text-white py-12 px-6 border-b border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ocean/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-breeze mb-4">
                        <Link href="/" className="hover:text-white transition-colors">خانه</Link>
                        <ChevronRight size={14} className="rotate-180 text-gray-400" />
                        <span className="text-white">حریم خصوصی خریداران</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">حریم خصوصی خریداران</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شما در {settings.siteTitle}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-right">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۱. اطلاعاتی که جمع‌آوری می‌کنیم</h2>
                        <ul className="list-disc pr-6 space-y-2 text-sm leading-7 text-slate-600">
                            <li>شماره تلفن همراه — برای ورود و ثبت‌نام با کد یک‌بارمصرف (پیامکی)</li>
                            <li>نام و نام خانوادگی — برای شخصی‌سازی حساب و ارسال سفارش</li>
                            <li>آدرس‌های پستی (شهر، استان، نشانی و کدپستی) — برای ارسال سفارش‌ها</li>
                            <li>تاریخچه سفارش‌ها و پیام‌های پشتیبانی — برای پیگیری و خدمات پس از فروش</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۲. نحوه استفاده از اطلاعات</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            اطلاعات شما فقط برای پردازش و ارسال سفارش‌ها، احراز هویت ورود به حساب، اطلاع‌رسانی وضعیت سفارش از طریق پیامک و
                            پاسخ به درخواست‌های پشتیبانی استفاده می‌شود. این اطلاعات در اختیار افراد غیرمجاز قرار نمی‌گیرد و به‌عنوان
                            اطلاعات حساب شما محفوظ است.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۳. فروش یا اشتراک‌گذاری اطلاعات</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            اطلاعات شخصی خریداران به هیچ شخص ثالثی فروخته یا اجاره داده نمی‌شود. تنها در موارد ضروری عملیاتی (مانند شرکت
                            حمل‌ونقل برای تحویل سفارش) حداقل اطلاعات لازم، فقط برای همان هدف، در اختیار طرف مقابل قرار می‌گیرد.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۴. امنیت اطلاعات</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            دسترسی به حساب کاربری شما از طریق شماره تلفن و کد یک‌بارمصرف پیامکی انجام می‌شود و کدهای ورود مدت محدودی اعتبار
                            دارند. از اطلاعات حساس شما بر اساس روش‌های متداول امنیتی نگهداری می‌شود.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۵. درخواست‌های مربوط به داده‌ها</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            برای مشاهده، اصلاح یا حذف اطلاعات حساب خود می‌توانید از طریق
                            <Link href="/contact" className="text-ocean font-bold hover:underline mx-1">فرم تماس با ما</Link>
                            یا شماره پشتیبانی ({settings.phoneFormatted || settings.phone}) درخواست دهید. درخواست‌های مربوط به داده‌های
                            شخصی در اولویت پاسخگویی قرار دارند.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
