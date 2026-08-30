import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MessageSquareWarning, Phone, Mail, Headset } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `ثبت شکایات و پیشنهادات | ${settings.siteTitle}`,
        description: `راه‌های ثبت شکایت، انتقاد و پیشنهاد در ${settings.siteTitle}`,
    };
}

export default async function ComplaintsPage() {
    const settings = await getSiteSettings();

    const channels = [
        {
            icon: MessageSquareWarning,
            title: 'فرم تماس با ما (روش پیشنهادی)',
            description:
                'سریع‌ترین راه ثبت شکایت یا پیشنهاد، ارسال پیام از طریق فرم تماس است. موضوع پیام را روی «پیگیری سفارش» یا «خدمات پس از فروش و گارانتی» تنظیم کنید و در صورت مرتبط بودن، شماره سفارش خود را در متن پیام بنویسید تا پیگیری سریع‌تر انجام شود.',
            href: '/contact',
            cta: 'ورود به فرم تماس با ما',
        },
        {
            icon: Phone,
            title: 'تماس تلفنی',
            description:
                'برای موضوعات فوری می‌توانید در ساعات کاری با شماره پشتیبانی تماس بگیرید و مستقیماً با کارشناس مربوطه صحبت کنید.',
            href: `tel:${settings.phone}`,
            cta: settings.phoneFormatted || settings.phone,
        },
        {
            icon: Mail,
            title: 'پیام به پست الکترونیکی',
            description:
                'اگر ترجیح می‌دهید موضوع خود را مکتوب و مستند ارسال کنید، از ایمیل پشتیبانی استفاده کنید؛ پاسخ شما از همین مسیر ارسال می‌شود.',
            href: `mailto:${settings.email}`,
            cta: settings.email,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 select-none" dir="rtl">
            {/* Breadcrumb & Hero Header */}
            <div className="w-full bg-midnight text-white py-12 px-6 border-b border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ocean/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-breeze mb-4">
                        <Link href="/" className="hover:text-white transition-colors">خانه</Link>
                        <ChevronRight size={14} className="rotate-180 text-gray-400" />
                        <span className="text-white">ثبت شکایات و پیشنهادات</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">ثبت شکایات و پیشنهادات</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        نظر شما — چه انتقاد باشد چه پیشنهاد — برای بهبود خدمات {settings.siteTitle} ارزشمند است
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-right">
                    <div className="flex items-start gap-4 rounded-2xl border border-ocean/20 bg-ocean/5 p-5">
                        <div className="w-11 h-11 rounded-xl bg-ocean/10 text-ocean flex items-center justify-center shrink-0">
                            <Headset size={22} />
                        </div>
                        <p className="text-sm leading-7 text-slate-600">
                            تمامی شکایات و پیشنهادات ثبت‌شده توسط تیم پشتیبانی بررسی می‌شود و در صورت نیاز برای پیگیری با شما تماس گرفته
                            خواهد شد. برای اینکه موضوعتان سریع‌تر رسیدگی شود، در پیام خود شماره سفارش، تاریخ خرید و شرح کوتاهی از اتفاق را
                            ذکر کنید.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {channels.map((channel) => (
                            <div key={channel.title} className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                                <div className="w-11 h-11 rounded-xl bg-midnight text-sky-breeze flex items-center justify-center mb-4">
                                    <channel.icon size={22} />
                                </div>
                                <h2 className="font-bold text-slate-800 text-sm mb-2">{channel.title}</h2>
                                <p className="text-xs leading-6 text-slate-500 mb-4 flex-1">{channel.description}</p>
                                <Link
                                    href={channel.href}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-royal hover:bg-ocean text-white font-bold text-xs rounded-xl transition-all"
                                >
                                    {channel.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
