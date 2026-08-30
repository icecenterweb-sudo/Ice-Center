import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

// NOTE (editorial, for the site owner — not shown to users):
// These terms of use are PLACEHOLDER copy generated for structure only. Legal
// review (and alignment with the actual sales/refund practices and the return
// policy page) is required by the business owner before production use.

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `شرایط و قوانین استفاده | ${settings.siteTitle}`,
        description: `شرایط و قوانین استفاده از فروشگاه اینترنتی ${settings.siteTitle}`,
    };
}

export default async function TermsPage() {
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
                        <span className="text-white">شرایط و قوانین استفاده</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">شرایط و قوانین استفاده</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        قواعد استفاده از فروشگاه اینترنتی {settings.siteTitle}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-right">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۱. پذیرش قوانین</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            استفاده از فروشگاه اینترنتی {settings.siteTitle} به معنای پذیرش شرایط مندرج در این صفحه است. این قوانین بر
                            مبنای مقتضیات فروشگاه به‌روزرسانی می‌شوند و نسخه منتشرشده در همین صفحه، ملاک عمل خواهد بود.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۲. حساب کاربری</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            ورود و ثبت‌نام در سایت با شماره تلفن همراه و کد یک‌بارمصرف پیامکی انجام می‌شود. مسئولیت حفظ امنیت شماره تماس و
                            صحت اطلاعات واردشده (نام و آدرس) با کاربر است. سفارش‌هایی که با اطلاعات نادرست ثبت شوند ممکن است در فرایند ارسال
                            دچار مشکل شوند.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۳. قیمت‌ها و موجودی</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            قیمت‌ها و موجودی محصولات در سایت ممکن است بدون اطلاع قبلی به‌روزرسانی شود. در صورت ناموجود شدن کالا یا تغییر
                            چشمگیر قیمت پس از ثبت سفارش، کارشناسان پیش از پردازش سفارش با شما هماهنگ می‌کنند. تصاویر و مشخصات فنی محصولات
                            از سمت برندهای تولیدکننده تهیه شده و ممکن است جزئیات جزئی تفاوت داشته باشد.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۴. ثبت و لغو سفارش</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            سفارش پس از ثبت و تأیید کارشناس فروش وارد فرایند آماده‌سازی می‌شود. برای لغو سفارش پیش از ارسال، از طریق
                            <Link href="/contact" className="text-ocean font-bold hover:underline mx-1">فرم تماس با ما</Link>
                            یا شماره پشتیبانی اقدام کنید. شرایط بازگشت کالا پس از تحویل مطابق صفحه «رویه بازگشت ۱۰ روزه کالا» است.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۵. مالکیت محتوا</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            تمامی محتوای متنی، تصویری و گرافیکی این سایت متعلق به {settings.siteTitle} است و بازنشر تجاری آن بدون اجازه
                            کتبی مجاز نیست. استفاده از مشخصات فنی محصولات با ذکر منبع بلامانع است.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۶. ارتباط با ما</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            هرگونه سوال درباره این قوانین از طریق فرم تماس با ما یا شماره پشتیبانی ({settings.phoneFormatted ||
                            settings.phone}) قابل پیگیری است.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
