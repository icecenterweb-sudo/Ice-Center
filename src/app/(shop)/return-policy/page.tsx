import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

// NOTE (editorial, for the site owner — not shown to users):
// This 10-day return policy is PLACEHOLDER copy structured around the link text
// already used in the footer ("رویه بازگشت ۱۰ روزه کالا"). The exact windows,
// condition requirements and refund method must be reviewed and finalized by
// the business owner before production use.

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `رویه بازگشت ۱۰ روزه کالا | ${settings.siteTitle}`,
        description: `شرایط و روند بازگشت کالا تا ۱۰ روز پس از تحویل در ${settings.siteTitle}`,
    };
}

export default async function ReturnPolicyPage() {
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
                        <span className="text-white">رویه بازگشت ۱۰ روزه کالا</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">رویه بازگشت ۱۰ روزه کالا</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        شرایط بازگشت کالاهای خریداری‌شده از {settings.siteTitle} تا ۱۰ روز پس از تحویل
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-right">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۱. مهلت بازگشت</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            می‌توانید کالای خریداری‌شده را حداکثر تا ۱۰ روز پس از تاریخ تحویل، برای بازگشت ثبت کنید. مبنای محاسبه، تاریخ
                            تحویل درج‌شده در اطلاعات سفارش است.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۲. شرایط پذیرش کالای بازگشتی</h2>
                        <ul className="list-disc pr-6 space-y-2 text-sm leading-7 text-slate-600">
                            <li>دستگاه استفاده نشده باشد و علائم کارکرد (جرقه، خط و خش، بوی سوختگی) نداشته باشد</li>
                            <li>بسته‌بندی اصلی، متعلقات، دفترچه و گارانتی همراه کالا کامل برگردانده شود</li>
                            <li>شماره سفارش یا فاکتور خرید هنگام ثبت درخواست ارائه شود</li>
                            <li>کالاهای سفارشی‌سازی‌شده یا مصرف‌شده مشمول بازگشت نیستند</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۳. روند ثبت درخواست بازگشت</h2>
                        <ol className="list-decimal pr-6 space-y-2 text-sm leading-7 text-slate-600">
                            <li>از طریق فرم تماس با ما یا شماره پشتیبانی، موضوع «پیگیری سفارش» را انتخاب و درخواست بازگشت را با ذکر شماره سفارش ثبت کنید</li>
                            <li>کارشناسان ما وضعیت کالا را بررسی و هماهنگی‌های ارسال بازگشت را انجام می‌دهند</li>
                            <li>پس از دریافت و تأیید سلامت کالا، مبلغ پرداختی طبق توافق بازگردانده می‌شود</li>
                        </ol>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">۴. کالای معیوب یا آسیب‌دیده</h2>
                        <p className="text-sm leading-8 text-slate-600">
                            اگر کالای تحویلی معیوب یا آسیب‌دیده بود، حداکثر تا ۴۸ ساعت پس از تحویل از طریق
                            <Link href="/contact" className="text-ocean font-bold hover:underline mx-1">فرم تماس با ما</Link>
                            اطلاع دهید تا فرایند تعویض یا خدمات گارانتی برایتان آغاز شود.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
