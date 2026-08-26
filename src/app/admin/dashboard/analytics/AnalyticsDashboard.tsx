'use client'

import {
    Activity,
    BarChart3,
    CalendarDays,
    Globe2,
    Share2,
    Smartphone,
    TrendingUp,
    Users,
    ShoppingBag,
    Cpu,
    AlertTriangle,
    Zap,
    AlertCircle
} from 'lucide-react'
import { toPersianDigits } from '@/lib/persian'
import { useState } from 'react'

type FunnelData = {
    pageViews: number
    productViews: number
    cartAdds: number
    checkoutStarts: number
    orderSubmits: number
    paidOrders: number
}

type SocialMetric = {
    source: string
    visits: number
    cartAdds: number
    orders: number
    revenue: number
}

type ProductMetric = {
    id: number
    name: string
    slug: string
    price: number
    views: number
    sales: number
    ratio: number
}

type SearchQueryItem = {
    query: string
    count: number
    avgResults?: number
}

type RetentionData = {
    newUsers: number
    activeUsers: number
    returningUsers: number
    inactiveUsers: number
}

type PeakTrafficItem = {
    hour: number
    visits: number
    orders: number
}

type NamedMetric = {
    name: string
    visits: number
    orders: number
    conversionRate: number
}

type SpeedMetricItem = {
    path: string
    avgLoadTime: number
    avgImageSize: number
    errorCount: number
}

type TimePoint = {
    label: string
    visits: number
    logins: number
}

type AnalyticsDashboardProps = {
    summary: {
        visitsToday: number
        visits7Days: number
        visits30Days: number
        userLogins30Days: number
        socialVisits30Days: number
        searchVisits30Days: number
        conversionRate: number
    }
    daily: TimePoint[]
    funnel: FunnelData
    socialMetrics: SocialMetric[]
    highVisitNoSales: ProductMetric[]
    searchMetrics: {
        topQueries: SearchQueryItem[]
        zeroResultQueries: SearchQueryItem[]
    }
    retentionMetrics: RetentionData
    peakTraffic: PeakTrafficItem[]
    deviceBrowserMetrics: {
        devices: NamedMetric[]
        browsers: NamedMetric[]
    }
    speedMetrics: SpeedMetricItem[]
    hasData: boolean
}

const sourceLabels: Record<string, string> = {
    direct: 'مستقیم',
    google: 'گوگل',
    bing: 'بینگ',
    instagram: 'اینستاگرام',
    telegram: 'تلگرام',
    whatsapp: 'واتساپ',
    bale: 'بله',
    eitaa: 'ایتا',
    rubika: 'روبیکا',
    linkedin: 'لینکدین',
    youtube: 'یوتیوب',
    aparat: 'آپارات',
    facebook: 'فیس‌بوک',
    x: 'ایکس',
}

const deviceLabels: Record<string, string> = {
    desktop: 'دسکتاپ',
    mobile: 'موبایل',
    tablet: 'تبلت',
    unknown: 'نامشخص',
}

export default function AnalyticsDashboard({
    summary,
    daily,
    funnel,
    socialMetrics,
    highVisitNoSales,
    searchMetrics,
    retentionMetrics,
    peakTraffic,
    deviceBrowserMetrics,
    speedMetrics,
    hasData,
}: AnalyticsDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'traffic' | 'products' | 'speed'>('overview')

    if (!hasData || !summary) {
        return (
            <div className="space-y-6" dir="rtl">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">تحلیل و گزارش پیشرفته</h1>
                        <p className="text-sm text-gray-500 mt-1">گزارش بازدید، فروش و رفتار کاربران</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center text-amber-800 backdrop-blur-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                    <h3 className="text-lg font-bold">داده‌ای ثبت نشده است</h3>
                    <p className="mt-2 text-sm text-amber-700">بعد از اولین بازدیدها، خریدها و جستجوهای کاربران، اطلاعات تحلیلی به‌صورت زنده در این صفحه پردازش و نمایش داده می‌شوند.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">سیستم تحلیل و گزارش دهی آیس سنتر</h1>
                    <p className="text-sm text-gray-500 mt-1">مانیتورینگ قیف فروش، سرعت صفحات، سئو و بازدهی کانال‌های بازاریابی</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm">
                    <CalendarDays className="h-4 w-4 text-sky-500" />
                    بازه‌ی اصلی: ۳۰ روز گذشته
                </div>
            </div>

            {/* Premium Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="خلاصه آمار" icon={Activity} />
                <TabButton active={activeTab === 'funnel'} onClick={() => setActiveTab('funnel')} label="قیف فروش و ریزش" icon={ShoppingBag} />
                <TabButton active={activeTab === 'traffic'} onClick={() => setActiveTab('traffic')} label="منابع ورودی و سئو" icon={Globe2} />
                <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="عملکرد محصولات" icon={Zap} />
                <TabButton active={activeTab === 'speed'} onClick={() => setActiveTab('speed')} label="سرعت و خطای صفحات" icon={Cpu} />
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Quick Metric Cards */}
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard icon={Activity} label="بازدید امروز" value={summary.visitsToday} suffix="بازدید" tone="blue" />
                        <MetricCard icon={TrendingUp} label="بازدید ۷ روز گذشته" value={summary.visits7Days} suffix="بازدید" tone="green" />
                        <MetricCard icon={ShoppingBag} label="نرخ تبدیل خرید ۳0 روزه" value={summary.conversionRate.toFixed(2)} suffix="٪" tone="violet" />
                        <MetricCard icon={Users} label="کاربران فعال ۳۰ روزه" value={retentionMetrics.activeUsers} suffix="کاربر" tone="orange" />
                    </section>

                    {/* Trend & Quality row */}
                    <section className="grid gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="font-bold text-gray-900">نمودار زمانی فعالیت</h2>
                                    <p className="text-xs text-gray-500 mt-1">تعداد بازدیدهای روزانه در مقایسه با سفارش‌های ثبت‌شده</p>
                                </div>
                                <BarChart3 className="h-5 w-5 text-sky-500" />
                            </div>
                            <LineChart data={daily} />
                        </div>

                        {/* Customer Retention / Cohort */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900 mb-1">حفظ و وفاداری مشتریان</h2>
                                <p className="text-xs text-gray-500 mb-4">بررسی وضعیت تعامل کاربران در پایگاه داده</p>
                            </div>
                            <div className="space-y-4 my-auto">
                                <RetentionRow label="کاربران تازه ثبت‌نام‌شده" value={retentionMetrics.newUsers} color="bg-sky-500" percent={(retentionMetrics.newUsers / (retentionMetrics.activeUsers || 1)) * 100} />
                                <RetentionRow label="کاربران وفادار و بازگشتی" value={retentionMetrics.returningUsers} color="bg-emerald-500" percent={(retentionMetrics.returningUsers / (retentionMetrics.activeUsers || 1)) * 100} />
                                <RetentionRow label="کل کاربران غیرفعال" value={retentionMetrics.inactiveUsers} color="bg-gray-400" percent={(retentionMetrics.inactiveUsers / (retentionMetrics.newUsers + retentionMetrics.returningUsers + retentionMetrics.inactiveUsers || 1)) * 100} />
                            </div>
                            <div className="border-t border-gray-100 pt-3 mt-4 text-[11px] text-gray-400">
                                فعال به معنای داشتن حداقل یک رویداد در ۳۰ روز گذشته است.
                            </div>
                        </div>
                    </section>

                    {/* Devices & Hours row */}
                    <section className="grid gap-4 lg:grid-cols-3">
                        {/* Devices */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-1">تفکیک دستگاه‌ها</h3>
                            <p className="text-xs text-gray-500 mb-4">نرخ تبدیل خرید بر اساس موبایل و دسکتاپ</p>
                            <div className="space-y-4">
                                {deviceBrowserMetrics.devices.map(dev => (
                                    <div key={dev.name} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">{deviceLabels[dev.name] || dev.name}</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-gray-900">{toPersianDigits(dev.visits)} بازدید</div>
                                            <div className="text-xs text-emerald-600 font-semibold">نرخ تبدیل: {toPersianDigits(dev.conversionRate.toFixed(2))}٪</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Peak Hours */}
                        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-1">ساعت‌های اوج ترافیک و خرید</h3>
                            <p className="text-xs text-gray-500 mb-4">بررسی ۲۴ ساعته بازدیدها جهت بهینه‌سازی زمان کارزارهای فروش</p>
                            <HourlyChart data={peakTraffic} />
                        </div>
                    </section>
                </div>
            )}

            {/* TAB CONTENT: FUNNEL */}
            {activeTab === 'funnel' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900">قیف تبدیل بازاریابی و فروش (Funnel)</h2>
                            <p className="text-xs text-gray-500 mt-1">بررسی درصد ریزش مشتریان از ورود به سایت تا نهایی‌شدن پرداخت واقعی</p>
                        </div>
                        
                        {/* Funnel Graph Component */}
                        <div className="grid gap-6 md:grid-cols-2 items-center">
                            <div className="space-y-4">
                                <FunnelStep index={1} label="۱. کل صفحات مشاهده شده (PageView)" value={funnel.pageViews} max={funnel.pageViews} color="bg-blue-500" />
                                <FunnelStep index={2} label="۲. بازدید صفحات محصولات (ProductView)" value={funnel.productViews} max={funnel.pageViews} color="bg-sky-500" />
                                <FunnelStep index={3} label="۳. افزودن به سبد خرید (AddToCart)" value={funnel.cartAdds} max={funnel.pageViews} color="bg-indigo-500" />
                                <FunnelStep index={4} label="۴. شروع فرآیند تسویه حساب (CheckoutStart)" value={funnel.checkoutStarts} max={funnel.pageViews} color="bg-violet-500" />
                                <FunnelStep index={5} label="۵. کل سفارش‌های ثبت شده (OrderSubmit)" value={funnel.orderSubmits} max={funnel.pageViews} color="bg-purple-500" />
                                <FunnelStep index={6} label="۶. تراکنش‌های موفق و پرداخت‌شده (PaymentSuccess)" value={funnel.paidOrders} max={funnel.pageViews} color="bg-emerald-500" />
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200/50 space-y-4">
                                <h4 className="font-bold text-gray-800 text-sm">شاخص‌های کلیدی قیف فروش</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FunnelStatRow label="علاقه‌مندی به خرید" desc="محصولات / کل بازدیدها" value={funnel.pageViews > 0 ? (funnel.productViews / funnel.pageViews * 100).toFixed(1) + '٪' : '0٪'} />
                                    <FunnelStatRow label="افزودن به سبد" desc="افزودن / کل محصولات" value={funnel.productViews > 0 ? (funnel.cartAdds / funnel.productViews * 100).toFixed(1) + '٪' : '0٪'} />
                                    <FunnelStatRow label="تکمیل تا فاکتور" desc="تسویه / سبد خرید" value={funnel.cartAdds > 0 ? (funnel.checkoutStarts / funnel.cartAdds * 100).toFixed(1) + '٪' : '0٪'} />
                                    <FunnelStatRow label="تکمیل سفارش" desc="ثبت سفارش / شروع تسویه" value={funnel.checkoutStarts > 0 ? (funnel.orderSubmits / funnel.checkoutStarts * 100).toFixed(1) + '٪' : '0٪'} />
                                    <FunnelStatRow label="پرداخت موفق" desc="پرداخت موفق / سفارش‌ها" value={funnel.orderSubmits > 0 ? (funnel.paidOrders / funnel.orderSubmits * 100).toFixed(1) + '٪' : '0٪'} />
                                    <FunnelStatRow label="نرخ تبدیل نهایی" desc="پرداخت موفق / کل ورودی" value={funnel.pageViews > 0 ? (funnel.paidOrders / funnel.pageViews * 100).toFixed(2) + '٪' : '0٪'} />
                                </div>
                                <div className="mt-4 text-xs text-gray-500 leading-relaxed border-t border-gray-200/60 pt-3">
                                    <AlertTriangle className="h-4 w-4 inline-block text-amber-500 ml-1.5" />
                                    بیشترین نرخ ریزش معمولا بین <strong>افزودن به سبد</strong> تا <strong>شروع تسویه حساب</strong> رخ می‌دهد. بهبود هزینه‌های ارسال و فرآیند تسویه حساب می‌تواند مستقیما نرخ تبدیل نهایی را بالا ببرد.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TRAFFIC */}
            {activeTab === 'traffic' && (
                <div className="space-y-6 animate-fadeIn">
                    <section className="grid gap-4 lg:grid-cols-2">
                        {/* Traffic to Revenue */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-1">کانال‌های ورودی تا خرید و فروش</h3>
                            <p className="text-xs text-gray-500 mb-4">میزان سود و سفارش دریافتی بر اساس مبدأ ورود مشتریان</p>
                            {socialMetrics.length === 0 ? (
                                <p className="text-sm text-gray-400 py-6 text-center">داده‌ای ثبت نشده است.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right text-gray-500">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 rounded-lg">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-gray-600">منبع ورودی</th>
                                                <th className="px-4 py-3 font-semibold text-gray-600">بازدیدها</th>
                                                <th className="px-4 py-3 font-semibold text-gray-600">سفارش‌ها</th>
                                                <th className="px-4 py-3 font-semibold text-gray-600">ارزش فروش (تومان)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {socialMetrics.map(item => (
                                                <tr key={item.source} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                                        <Share2 className="h-4 w-4 text-sky-500" />
                                                        {sourceLabels[item.source] || item.source}
                                                    </td>
                                                    <td className="px-4 py-3">{toPersianDigits(item.visits)}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-800">{toPersianDigits(item.orders)}</td>
                                                    <td className="px-4 py-3 text-emerald-600 font-bold">{toPersianDigits(item.revenue.toLocaleString('fa-IR'))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Search Queries */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">جستجوهای کاربران در سایت</h3>
                                <p className="text-xs text-gray-500">پایش عبارات جستجو شده برای شناخت نیاز بازار</p>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">عبارات پرجستجو</h4>
                                    {searchMetrics.topQueries.length === 0 ? (
                                        <p className="text-xs text-gray-400">هنوز عبارتی جستجو نشده است.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {searchMetrics.topQueries.map(q => (
                                                <div key={q.query} className="flex justify-between items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                    <span className="text-sm font-semibold text-gray-700">{q.query}</span>
                                                    <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{toPersianDigits(q.count)} بار</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-red-500/80 mb-3 uppercase tracking-wider">جستجوهای بی نتیجه (۰ کالا)</h4>
                                    {searchMetrics.zeroResultQueries.length === 0 ? (
                                        <p className="text-xs text-gray-400">جستجوی بدون نتیجه‌ای یافت نشد.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {searchMetrics.zeroResultQueries.map(q => (
                                                <div key={q.query} className="flex justify-between items-center bg-red-50/50 rounded-lg p-2 border border-red-100/50">
                                                    <span className="text-sm font-semibold text-red-700">{q.query}</span>
                                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{toPersianDigits(q.count)} بار</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Browser Metrics */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-1">تفکیک مرورگرهای کاربران</h3>
                        <p className="text-xs text-gray-500 mb-4">آمار استفاده و نرخ تبدیل خرید بر اساس مرورگرها</p>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {deviceBrowserMetrics.browsers.map(b => (
                                <div key={b.name} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">مرورگر</span>
                                        <span className="text-sm font-bold text-gray-800">{b.name}</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-extrabold text-gray-900">{toPersianDigits(b.visits)} بازدید</div>
                                        <div className="text-xs text-emerald-600 font-bold">تبدیل: {toPersianDigits(b.conversionRate.toFixed(1))}٪</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-sky-500" />
                                محصولات پربازدید بدون فروش (پتانسیل‌های از دست رفته)
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">محصولاتی که ترافیک بالایی دریافت می‌کنند اما میزان سفارش ثبت‌شده آن‌ها پایین است. این امر نشان‌دهنده نیاز به بازنگری قیمت، عکس‌ها یا مشخصات فنی است.</p>
                        </div>

                        {highVisitNoSales.length === 0 ? (
                            <p className="text-sm text-gray-400 py-6 text-center">داده‌ی ترافیکی برای محصولات ثبت نشده است.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right text-gray-500">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 rounded-lg">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-600">نام کالا</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600">قیمت (تومان)</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">تعداد بازدید (۳۰ روزه)</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">تعداد فروش رفته (۳۰ روزه)</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">نرخ تبدیل خرید</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600">وضعیت بررسی</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {highVisitNoSales.map(p => {
                                            const isAlert = p.views > 10 && p.sales === 0
                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 hover:underline">
                                                            {p.name}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-gray-800">{toPersianDigits(p.price.toLocaleString('fa-IR'))}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{toPersianDigits(p.views)}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{toPersianDigits(p.sales)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            p.ratio > 2 ? 'bg-green-50 text-green-700' : p.ratio > 0.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                                        }`}>
                                                            {toPersianDigits(p.ratio.toFixed(1))}٪
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isAlert ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-bold bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                نیازمند بررسی و آفر تخفیف
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">عادی</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SPEED */}
            {activeTab === 'speed' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-sky-500" />
                                پایش سرعت بارگذاری صفحات و خطاهای کاربر
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">تضمین تجربه کاربری عالی. زمان بارگذاری طولانی و حجم تصاویر سنگین عامل اصلی ریزش در سبد خرید هستند.</p>
                        </div>

                        {speedMetrics.length === 0 ? (
                            <p className="text-sm text-gray-400 py-6 text-center">داده‌ی پایش سرعت ثبت نشده است.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right text-gray-500">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 rounded-lg">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-600">آدرس صفحه (Path)</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">میانگین زمان بارگذاری (میلی ثانیه)</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">میانگین حجم تصاویر (KB)</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">تعداد خطاهای JS</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600">وضعیت سلامت فنی</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {speedMetrics.map((item, index) => {
                                            const isSlow = item.avgLoadTime > 2500
                                            const isHeavy = item.avgImageSize > 1500
                                            const hasErrors = item.errorCount > 0

                                            return (
                                                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs text-left dir-ltr truncate max-w-xs">{item.path}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{toPersianDigits(item.avgLoadTime)} ms</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{toPersianDigits(item.avgImageSize)} KB</td>
                                                    <td className="px-4 py-3 text-center font-bold text-red-600">{toPersianDigits(item.errorCount)} خط</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {isSlow && (
                                                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-100">کند</span>
                                                            )}
                                                            {isHeavy && (
                                                                <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold border border-purple-100">حجم بالا</span>
                                                            )}
                                                            {hasErrors && (
                                                                <span className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-bold border border-red-100">دارای خطا</span>
                                                            )}
                                                            {!isSlow && !isHeavy && !hasErrors && (
                                                                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold border border-green-100">سالم</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// Subcomponents

function TabButton({ 
    active, 
    onClick, 
    label, 
    icon: Icon 
}: { 
    active: boolean
    onClick: () => void
    label: string
    icon: typeof Activity 
}) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all rounded-t-xl border-b-2
                ${active
                    ? 'border-sky-500 text-sky-600 bg-sky-50/50 shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
            `}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    )
}

function MetricCard({ icon: Icon, label, value, suffix = '', tone }: {
    icon: typeof Activity
    label: string
    value: number | string
    suffix?: string
    tone: 'blue' | 'green' | 'violet' | 'orange'
}) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
    }

    const valueStr = typeof value === 'number' ? toPersianDigits(value) : toPersianDigits(value)

    return (
        <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
            <div className="flex items-center justify-between">
                <div className={`rounded-xl p-2.5 border ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-gray-500">{label}</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{valueStr}</span>
                {suffix && <span className="text-xs text-gray-400 font-semibold">{suffix}</span>}
            </div>
        </div>
    )
}

function RetentionRow({ label, value, color, percent }: { label: string; value: number; color: string; percent: number }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                <span>{label}</span>
                <span className="font-extrabold text-gray-900">{toPersianDigits(value)} ({toPersianDigits(percent.toFixed(1))}٪)</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}

function FunnelStep({ label, value, max, color }: { index: number; label: string; value: number; max: number; color: string }) {
    const percent = max > 0 ? (value / max) * 100 : 0
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>{label}</span>
                <span>{toPersianDigits(value)} ({toPersianDigits(percent.toFixed(1))}٪)</span>
            </div>
            <div className="h-4 rounded-xl bg-gray-100 overflow-hidden flex relative">
                <div className={`h-full ${color} rounded-l`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}

function FunnelStatRow({ label, desc, value }: { label: string; desc: string; value: string }) {
    return (
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <span className="text-base font-extrabold text-gray-800 my-1">{toPersianDigits(value)}</span>
            <span className="text-[10px] text-gray-400 italic">{desc}</span>
        </div>
    )
}

function LineChart({ data }: { data: TimePoint[] }) {
    const max = Math.max(1, ...data.flatMap((point) => [point.visits, point.logins]))
    const width = 640
    const height = 220
    const padding = 24
    const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0
    const y = (value: number) => height - padding - (value / max) * (height - padding * 2)
    const x = (index: number) => padding + index * step
    const visitPath = data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.visits)}`).join(' ')
    const loginPath = data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.logins)}`).join(' ')

    return (
        <div className="overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
                <path d={visitPath} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
                <path d={loginPath} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                {data.map((point, index) => (
                    <g key={`${point.label}-${index}`}>
                        <circle cx={x(index)} cy={y(point.visits)} r="3.5" fill="#0ea5e9" />
                        <circle cx={x(index)} cy={y(point.logins)} r="3.5" fill="#a855f7" />
                    </g>
                ))}
            </svg>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500 mt-2">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" />بازدید عمومی</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-500" />سفارشات ثبت شده</span>
            </div>
        </div>
    )
}

function HourlyChart({ data }: { data: PeakTrafficItem[] }) {
    const max = Math.max(1, ...data.flatMap((point) => [point.visits, point.orders]))

    return (
        <div className="flex h-56 items-end gap-1.5 border-b border-gray-100 pb-2">
            {data.map((point) => (
                <div key={point.hour} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <div className="flex w-full items-end justify-center gap-0.5 h-40">
                        <div className="w-1.5 rounded-t bg-sky-500" style={{ height: `${Math.max(4, (point.visits / max) * 100)}%` }} title={`${point.visits} بازدید در ساعت ${point.hour}`} />
                        <div className="w-1.5 rounded-t bg-purple-500" style={{ height: `${Math.max(4, (point.orders / max) * 100)}%` }} title={`${point.orders} خرید در ساعت ${point.hour}`} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{toPersianDigits(point.hour)}</span>
                </div>
            ))}
        </div>
    )
}
