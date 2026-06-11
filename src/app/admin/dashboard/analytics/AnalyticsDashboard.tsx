'use client'

import { Activity, BarChart3, CalendarDays, Globe2, LogIn, Search, Share2, Smartphone, TrendingUp, Users } from 'lucide-react'
import { toPersianDigits } from '@/lib/numbers'

type TimePoint = {
    label: string
    visits: number
    logins: number
}

type NamedCount = {
    name: string
    count: number
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
    weekly: TimePoint[]
    monthly: TimePoint[]
    socialSources: NamedCount[]
    loginSources: NamedCount[]
    topPages: NamedCount[]
    devices: NamedCount[]
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
    weekly,
    monthly,
    socialSources,
    loginSources,
    topPages,
    devices,
    hasData,
}: AnalyticsDashboardProps) {
    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">تحلیل سئو و رفتار کاربران</h1>
                    <p className="text-sm text-gray-500 mt-1">گزارش بازدید، ورود کاربران، منابع اجتماعی و صفحات مهم فروشگاه</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 text-ocean" />
                    بازه‌ی اصلی: ۳۰ روز گذشته
                </div>
            </div>

            {!hasData && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    هنوز داده‌ای برای گزارش ثبت نشده است. بعد از چند بازدید و ورود کاربر، نمودارها به‌صورت خودکار پر می‌شوند.
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Activity} label="بازدید امروز" value={summary.visitsToday} tone="blue" />
                <MetricCard icon={TrendingUp} label="بازدید ۷ روز" value={summary.visits7Days} tone="green" />
                <MetricCard icon={Users} label="ورود کاربران ۳۰ روز" value={summary.userLogins30Days} tone="violet" />
                <MetricCard icon={Search} label="ورودی جستجو ۳۰ روز" value={summary.searchVisits30Days} tone="orange" />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-bold text-gray-900">روند روزانه</h2>
                            <p className="text-xs text-gray-500 mt-1">بازدید و ورود کاربر در ۳۰ روز گذشته</p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-ocean" />
                    </div>
                    <LineChart data={daily} />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-bold text-gray-900">کیفیت ورودی</h2>
                            <p className="text-xs text-gray-500 mt-1">شاخص‌های سریع برای تصمیم سئو</p>
                        </div>
                        <Globe2 className="h-5 w-5 text-ocean" />
                    </div>
                    <div className="space-y-4">
                        <QualityRow label="بازدید ۳۰ روز" value={summary.visits30Days} />
                        <QualityRow label="ورودی شبکه‌ها" value={summary.socialVisits30Days} />
                        <QualityRow label="ورودی جستجو" value={summary.searchVisits30Days} />
                        <QualityRow label="نرخ تبدیل ورود" value={`${toPersianDigits(summary.conversionRate.toFixed(1))}٪`} />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <ChartPanel title="گزارش هفتگی" description="۱۲ هفته‌ی اخیر">
                    <BarChart data={weekly} />
                </ChartPanel>
                <ChartPanel title="گزارش ماهانه" description="۶ ماه اخیر">
                    <BarChart data={monthly} />
                </ChartPanel>
            </section>

            <section className="grid gap-4 lg:grid-cols-4">
                <ListPanel icon={Share2} title="شبکه‌های اجتماعی" items={socialSources} labels={sourceLabels} empty="هنوز ورودی اجتماعی ثبت نشده" />
                <ListPanel icon={LogIn} title="ورود از منابع" items={loginSources} labels={sourceLabels} empty="هنوز ورود کاربر ثبت نشده" />
                <ListPanel icon={Smartphone} title="دستگاه‌ها" items={devices} labels={deviceLabels} empty="داده‌ای ثبت نشده" />
                <ListPanel icon={Search} title="صفحات مهم سئو" items={topPages} empty="هنوز صفحه‌ای ثبت نشده" monospace />
            </section>
        </div>
    )
}

function MetricCard({ icon: Icon, label, value, tone }: {
    icon: typeof Activity
    label: string
    value: number
    tone: 'blue' | 'green' | 'violet' | 'orange'
}) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
        orange: 'bg-orange-50 text-orange-600',
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className="mt-4 text-3xl font-bold text-gray-900">{toPersianDigits(value)}</div>
        </div>
    )
}

function QualityRow({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="font-bold text-gray-900">{typeof value === 'number' ? toPersianDigits(value) : value}</span>
        </div>
    )
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-5">
                <h2 className="font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
            {children}
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
                <path d={loginPath} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                {data.map((point, index) => (
                    <g key={`${point.label}-${index}`}>
                        <circle cx={x(index)} cy={y(point.visits)} r="3" fill="#0ea5e9" />
                        <circle cx={x(index)} cy={y(point.logins)} r="3" fill="#22c55e" />
                    </g>
                ))}
            </svg>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" />بازدید</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />ورود</span>
            </div>
        </div>
    )
}

function BarChart({ data }: { data: TimePoint[] }) {
    const max = Math.max(1, ...data.flatMap((point) => [point.visits, point.logins]))

    return (
        <div className="flex h-56 items-end gap-2 border-b border-gray-100 pb-2">
            {data.map((point) => (
                <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center gap-1">
                        <div className="w-3 rounded-t bg-sky-500" style={{ height: `${Math.max(4, (point.visits / max) * 100)}%` }} />
                        <div className="w-3 rounded-t bg-green-500" style={{ height: `${Math.max(4, (point.logins / max) * 100)}%` }} />
                    </div>
                    <span className="truncate text-[10px] text-gray-500">{point.label}</span>
                </div>
            ))}
        </div>
    )
}

function ListPanel({ icon: Icon, title, items, labels = {}, empty, monospace = false }: {
    icon: typeof Activity
    title: string
    items: NamedCount[]
    labels?: Record<string, string>
    empty: string
    monospace?: boolean
}) {
    const max = Math.max(1, ...items.map((item) => item.count))

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{title}</h2>
                <Icon className="h-5 w-5 text-ocean" />
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-gray-400">{empty}</p>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.name}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                <span className={`truncate text-gray-700 ${monospace ? 'font-mono text-xs dir-ltr text-left' : ''}`}>
                                    {labels[item.name] || item.name}
                                </span>
                                <span className="font-bold text-gray-900">{toPersianDigits(item.count)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div className="h-full rounded-full bg-ocean" style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
