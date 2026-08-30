import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

// NOTE (editorial, for the site owner — not shown to users):
// The warranty periods and conditions below are PLACEHOLDER copy generated for
// structure only. Real coverage windows, exclusions and claim terms must be
// reviewed and finalized by the business owner (and aligned with the actual
// manufacturer warranties, e.g. brand-specific guarantees stored on products)
// before this page can be considered production-final.

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `شرایط گارانتی و خدمات پس از فروش | ${settings.siteTitle}`,
        description: `شرایط گارانتی و خدمات پس از فروش تجهیزات برودتی و بستنی‌ساز خریداری‌شده از ${settings.siteTitle}`,
    };
}

export default async function WarrantyPage() {
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
                        <span className="text-white">شرایط گارانتی و خدمات پس از فروش</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">شرایط گارانتی و خدمات پس از فروش</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        چارچوب گارانتی و پشتیبانی دستگاه‌های خریداری‌شده از {settings.siteTitle}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-right">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۱. دوره اعتبار گارانتی</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            دستگاه‌های فروخته‌شده از {settings.siteTitle} از تاریخ تحویل، مشمول گارانتی سازنده هستند. مدت دقیق گارانتی برای
                            هر دسته محصول (مثلاً بستنی‌ساز، یخ‌ساز، آبمیوه‌گیری صنعتی) متفاوت است و روی صفحه محصول و فاکتور خرید درج می‌شود.
                            برای اطلاع از مدت دقیق گارانتی کالای خود، پیش از خرید با کارشناسان ما تماس بگیرید.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۲. موارد مشمول گارانتی</h2>
                        <ul className="list-disc pr-6 space-y-2 text-sm leading-7 text-slate-600">
                            <li>عیوب عملکردی قطعات اصلی دستگاه نظیر کمپرسور، موتور همزن و برد الکترونیکی در دوره گارانتی</li>
                            <li>ایرادات فنی ناشی از نقص ساخت یا قطعات یدکی اصلی</li>
                            <li>تامین قطعات یدکی اورجینال برند مربوطه پس از پایان دوره گارانتی</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۳. موارد خارج از شمول گارانتی</h2>
                        <ul className="list-disc pr-6 space-y-2 text-sm leading-7 text-slate-600">
                            <li>استفاده نادرست، عدم رعایت دستورالعمل راه‌اندازی یا اتصال به برق نامناسب (تکفاز/سه‌فاز ناهمخوان با مشخصات دستگاه)</li>
                            <li>آسیب‌های حمل‌ونقل پس از تحویل، ضربه، نفوذ مایعات یا دستکاری توسط اشخاص غیرمجاز</li>
                            <li>قطعات مصرفی و فرسودگی طبیعی ناشی از کارکرد روزانه (اورینگ، تیغه، واشر و موارد مشابه)</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۴. نحوه ثبت درخواست خدمات</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            برای ثبت درخواست گارانتی یا خدمات پس از فروش، شماره سفارش خود را آماده کنید و از طریق
                            <Link href="/contact" className="text-ocean font-bold hover:underline mx-1">فرم تماس با ما</Link>
                            یا شماره تلفن پشتیبانی ({settings.phoneFormatted || settings.phone}) موضوع «خدمات پس از فروش و گارانتی» را انتخاب
                            نمایید. کارشناسان ما حداکثر ظرف دو روز کاری پاسخ می‌دهند و در صورت نیاز، اعزام تکنسین یا ارسال قطعه هماهنگ می‌شود.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
