import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Building2, Percent, Headset, Truck } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `طرح ویژه خرید سازمانی و عمده | ${settings.siteTitle}`,
        description: `خرید عمده و سازمانی تجهیزات برودتی، بستنی‌ساز و کافی‌شاپ با قیمت ویژه همکاران از ${settings.siteTitle}`,
    };
}

const BENEFITS = [
    {
        icon: Percent,
        title: 'قیمت‌گذاری ویژه همکاران',
        description: 'خرید عمده و سازمانی مشمول تعرفه‌های همکاری است که بر اساس تعداد و نوع دستگاه محاسبه می‌شود.',
    },
    {
        icon: Headset,
        title: 'مشاور اختصاصی',
        description: 'یک کارشناس از ابتدای استعلام تا نصب و راه‌اندازی، پاسخگوی پروژه شماست.',
    },
    {
        icon: Truck,
        title: 'هماهنگی ارسال و نصب',
        description: 'ارسال به سراسر کشور با هماهنگی زمان تحویل و راهنمایی نصب و راه‌اندازی اولیه.',
    },
    {
        icon: Building2,
        title: 'مناسب پروژه‌های راه‌اندازی',
        description: 'از یک دستگاه تا تجهیز کامل یک بستنی‌فروشی، کافی‌شاپ یا کارگاه تولیدی؛ بسته‌بندی متناسب با پروژه.',
    },
];

export default async function CorporatePage() {
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
                        <span className="text-white">طرح ویژه خرید سازمانی و عمده</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">طرح ویژه خرید سازمانی و عمده</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        اگر به تجهیزات برودتی و بستنی‌ساز به‌صورت عمده نیاز دارید، طرح همکاری سازمانی {settings.siteTitle} برای شماست
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-right">
                    <p className="text-sm md:text-base leading-8 text-slate-600">
                        رستوران‌ها، زنجیره‌های کافی‌شاپ، قنادی‌ها، کارگاه‌های تولید بستنی و فعالان حوزه تجهیز کسب‌وکارهای غذایی معمولاً به
                        بیش از یک دستگاه نیاز دارند. در طرح خرید سازمانی و عمده {settings.siteTitle}، فهرست تجهیزات مورد نیاز خود را ارسال
                        کنید تا استعلام قیمت همکاران — همراه با پیشنهاد جایگزین برای کاهش هزینه‌ها در صورت نیاز — برایتان آماده شود.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {BENEFITS.map((benefit) => (
                            <div key={benefit.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                                <div className="w-11 h-11 rounded-xl bg-ocean/10 text-ocean flex items-center justify-center shrink-0">
                                    <benefit.icon size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm mb-1">{benefit.title}</h3>
                                    <p className="text-xs leading-6 text-slate-500">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl bg-midnight text-white p-6 md:p-8 space-y-4">
                        <h2 className="text-lg font-bold">درخواست استعلام قیمت عمده</h2>
                        <p className="text-sm leading-7 text-slate-300">
                            از طریق فرم تماس با ما، موضوع پیام را روی «استعلام قیمت عمده و سازمانی» تنظیم کنید و فهرست تجهیزات مورد نظرتان
                            را بنویسید. کارشناسان ما در سریع‌ترین زمان با شما تماس می‌گیرند.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-breeze hover:bg-ocean text-midnight hover:text-white font-extrabold text-sm rounded-2xl transition-all"
                        >
                            ثبت درخواست استعلام عمده
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
