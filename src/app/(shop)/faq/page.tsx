import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `سوالات متداول | ${settings.siteTitle}`,
        description: `پاسخ پرسش‌های پرتکرار درباره خرید، ارسال، گارانتی و بازگشت کالا در ${settings.siteTitle}`,
    };
}

const FAQS = [
    {
        question: 'سفارش من چطور ارسال می‌شود و هزینه ارسال چقدر است؟',
        answer:
            'سفارش‌ها به سراسر کشور ارسال می‌شوند. هزینه ارسال بر اساس مقصد، وزن و ابعاد کالا در مرحله تسویه حساب محاسبه و پیش از ثبت نهایی سفارش به شما نمایش داده می‌شود. برای دستگاه‌های سنگین و حساس، ارسال با هماهنگی کارشناس فروش انجام می‌شود.',
    },
    {
        question: 'آیا برای خرید عمده محدودیت حداقل سفارش وجود دارد؟',
        answer:
            'برای خرید تکی هیچ حداقل مبلغی نداریم؛ اما برای خرید عمده و سازمانی، تعرفه‌های ویژه همکاران بر اساس تعداد دستگاه محاسبه می‌شود. کافی است فهرست تجهیزات مورد نظر خود را از طریق فرم تماس با موضوع «استعلام قیمت عمده و سازمانی» ارسال کنید.',
    },
    {
        question: 'پرداخت هزینه سفارش چگونه انجام می‌شود؟',
        answer:
            'در حال حاضر درگاه پرداخت آنلاین در سایت فعال نیست؛ مبلغ سفارش پس از ثبت و تأیید سفارش توسط کارشناس فروش، به‌صورت هماهنگ‌شده تسویه می‌شود. جزئیات دقیق پرداخت در تماس تلفنی پس از ثبت سفارش اعلام می‌گردد.',
    },
    {
        question: 'گارانتی دستگاه‌ها به چه شکل است؟',
        answer:
            'دستگاه‌ها از تاریخ تحویل مشمول گارانتی سازنده هستند و مدت دقیق گارانتی روی صفحه هر محصول درج شده است. برای ثبت درخواست خدمات پس از فروش، شماره سفارش خود را از طریق فرم تماس با موضوع «خدمات پس از فروش و گارانتی» ارسال کنید. جزئیات کامل در صفحه شرایط گارانتی آمده است.',
    },
    {
        question: 'اگر از خرید منصرف شوم، امکان بازگشت کالا وجود دارد؟',
        answer:
            'بله؛ کالاهای بازنگشته و سالم تا ۱۰ روز پس از تحویل قابل بازگشت هستند. شرایط دقیق و روند ثبت درخواست بازگشت در صفحه «رویه بازگشت ۱۰ روزه کالا» توضیح داده شده است.',
    },
    {
        question: 'برای راه‌اندازی کسب‌وکار، مشاوره رایگان دارید؟',
        answer:
            'بله؛ کارشناسان ما پیش از خرید، متناسب با ظرفیت تولید، فضای محل و برق مصرفی شما، مشاوره رایگان انتخاب دستگاه ارائه می‌دهند. برای دریافت مشاوره از فرم تماس با ما یا شماره پشتیبانی استفاده کنید.',
    },
];

export default async function FaqPage() {
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
                        <span className="text-white">سوالات متداول</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">سوالات متداول</h1>
                    <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                        پاسخ پرتکرارترین پرسش‌های خریداران تجهیزات در {settings.siteTitle}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-6 text-right">
                    {FAQS.map((faq, index) => (
                        <div key={faq.question} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                            <h2 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                {formatFaqIndex(index)} {faq.question}
                            </h2>
                            <p className="text-sm leading-7 text-slate-600">{faq.answer}</p>
                        </div>
                    ))}

                    <p className="text-xs text-slate-400 pt-2">
                        پاسخ سوال خود را پیدا نکردید؟ از طریق
                        <Link href="/contact" className="text-ocean font-bold hover:underline mx-1">صفحه تماس با ما</Link>
                        بپرسید.
                    </p>
                </div>
            </div>
        </div>
    );
}

function formatFaqIndex(index: number): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return `${index + 1}`.replace(/\d/g, (d) => persianDigits[Number(d)]) + '.';
}
