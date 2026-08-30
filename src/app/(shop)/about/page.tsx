import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `درباره ما | ${settings.siteTitle}`,
        description: `آشنایی با ${settings.siteTitle}؛ فروشگاه تخصصی تجهیزات برودتی، بستنی‌ساز و کافی‌شاپ با پشتیبانی B2B و فروش عمده`,
    };
}

export default async function AboutPage() {
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
                        <span className="text-white">درباره ما</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">درباره {settings.siteTitle}</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        تامین‌کننده تخصصی تجهیزات برودتی، بستنی‌ساز و کافی‌شاپ برای کسب‌وکارهای غذایی در سراسر کشور
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-6 text-right">
                    <p className="text-sm md:text-base leading-8 text-slate-600">
                        {settings.siteTitle} با تمرکز بر فروش عمده و پشتیبانی B2B، تجهیزات مورد نیاز کارگاه‌ها و کسب‌وکارهای صنعت غذا را
                        تامین می‌کند؛ از دستگاه‌های بستنی قیفی و بارسفت‌های حرفه‌ای گرفته تا یخ‌سازها، آبمیوه‌گیری‌های صنعتی، یخچال‌ها و
                        فریزرهای برودتی. ما محصولات برندهای معتبر داخلی را با قیمت‌گذاری ویژه همکاران و مشاوره تخصصی پیش از خرید ارائه
                        می‌دهیم تا سرمایه شما جایی که واقعاً لازم است هزینه شود.
                    </p>
                    <p className="text-sm md:text-base leading-8 text-slate-600">
                        مخاطبان اصلی ما مالکان و راه‌اندازان بستنی‌فروشی‌ها، کافی‌شاپ‌ها، رستوران‌ها، قنادی‌ها و کارگاه‌های تولید بستنی و
                        محصولات برودتی هستند. تیم ما از مرحله انتخاب دستگاه متناسب با ظرفیت تولید و برق مصرفی محل شما، تا ارسال، نصب و
                        خدمات پس از فروش همراهتان است. اگر قصد راه‌اندازی یا توسعه کسب‌وکار خود را دارید، کارشناسان {settings.siteTitle}
                        مشاوره اولیه را به‌صورت رایگان انجام می‌دهند.
                    </p>
                    <div className="pt-2">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-royal hover:bg-ocean text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
                        >
                            تماس با کارشناسان ما
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
