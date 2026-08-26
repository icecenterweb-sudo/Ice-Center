'use client';

import StatsCard from '@/components/admin/StatsCard';
import { 
    Package, 
    Users, 
    ShoppingCart, 
    TrendingUp, 
    Clock, 
    AlertCircle, 
    FileText, 
    MessageCircle,
    Download,
    Search,
    X,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toPersianNumber, formatPersianNumber } from '@/lib/persian';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ORDER_STATUS_META } from '@/lib/order-status';
import type { OrderStatus } from '@prisma/client';

type AuditLog = {
    id: number
    action: string
    entity: string
    entityId: number
    details: string | null
    createdAt: string
    admin: {
        name: string | null
    }
}

interface SearchResults {
    products: Array<{ id: number; name: string; price: number; slug: string; thumbnail: string | null }>
    orders: Array<{ id: number; orderNumber: string; customerName: string; total: number; status: string }>
    users: Array<{ id: number; firstName: string | null; lastName: string | null; phone: string }>
    posts: Array<{ id: number; title: string; slug: string }>
    categories: Array<{ id: number; name: string; slug: string }>
}

interface DashboardViewProps {
    productCount: number
    userCount: number
    monthlySales: number
    newOrdersCount: number
    blogPostCount: number
    pendingComments: number
    recentAuditLogs: AuditLog[]
}

const auditActionLabels: Record<string, string> = {
    PRODUCT_CREATE: 'ثبت محصول جدید',
    PRODUCT_UPDATE: 'ویرایش مشخصات محصول',
    PRODUCT_DELETE: 'حذف محصول',
    PRODUCT_TOGGLE: 'تغییر وضعیت کالا',
    ORDER_STATUS_UPDATE: 'تغییر وضعیت سفارش',
    ORDER_NOTES_UPDATE: 'به‌روزرسانی یادداشت سفارش',
    ADMIN_UPDATE: 'تغییر نقش‌های مدیر',
}

export default function DashboardView({
    productCount,
    userCount,
    monthlySales,
    newOrdersCount,
    blogPostCount,
    pendingComments,
    recentAuditLogs,
}: DashboardViewProps) {
    const router = useRouter()

    // Search States
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)

    // Export States
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportingType, setExportingType] = useState<string | null>(null)

    // Handle Search query
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults(null)
            return
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`)
                if (res.ok) {
                    const data = await res.json()
                    setSearchResults(data)
                }
            } catch (error) {
                console.error('Search failed:', error)
            } finally {
                setIsSearching(false)
            }
        }, 400)

        return () => clearTimeout(delayDebounce)
    }, [searchQuery])

    // Ctrl+K keyboard shortcut to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setShowSearchModal(prev => !prev)
            }
            // ESC to close search
            if (e.key === 'Escape' && showSearchModal) {
                setShowSearchModal(false)
                setSearchQuery('')
                setSearchResults(null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showSearchModal])

    // Trigger report download
    const handleExport = async (type: string) => {
        setExportingType(type)
        try {
            toast.loading('در حال تولید فایل گزارش...', { id: 'export' })
            const response = await fetch(`/api/admin/analytics/export?type=${type}`)
            if (!response.ok) throw new Error()

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('گزارش با موفقیت دانلود شد', { id: 'export' })
        } catch {
            toast.error('خطا در تولید گزارش', { id: 'export' })
        } finally {
            setExportingType(null)
        }
    }

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'هم‌اکنون'
        if (mins < 60) return `${toPersianNumber(mins)} دقیقه پیش`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${toPersianNumber(hours)} ساعت پیش`
        return new Date(dateStr).toLocaleDateString('fa-IR')
    }

    return (
        <div className="space-y-8" dir="rtl">
            {/* Top Command Bar & Search trigger */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
                <button
                    onClick={() => setShowSearchModal(true)}
                    className="w-full md:max-w-md flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 rounded-2xl text-gray-400 text-sm font-medium transition-all group shadow-inner"
                >
                    <span className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        جستجوی سراسری پنل (کالا، سفارش، کاربر...)
                    </span>
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs bg-white border border-gray-200 text-gray-400 rounded-md font-mono">
                        Ctrl+K
                    </kbd>
                </button>

                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="bg-sky-50 text-sky-600 hover:bg-sky-100 px-5 py-3 rounded-2xl font-bold transition-all border border-sky-100 flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        خروجی گزارشات CSV
                    </button>
                    <button
                        onClick={() => router.push('/admin/dashboard/products/add')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2"
                    >
                        <Package className="w-5 h-5" />
                        ثبت محصول جدید
                    </button>
                </div>
            </div>

            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 p-8 text-white shadow-xl"
            >
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">خوش آمدید، مدیر گرامی 👋</h1>
                        <p className="text-sky-50/90 text-base max-w-xl">
                            خلاصه‌ی آمار امروز فروشگاه صنعتی آیس سنتر. می‌توانید مستقیماً از بخش بالای صفحه گزارشات را دانلود یا در میان داده‌ها جستجو کنید.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/dashboard/analytics')}
                        className="bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-2xl font-bold transition-all border border-white/10 shadow-lg backdrop-blur-md flex items-center gap-2"
                    >
                        <TrendingUp className="w-5 h-5" />
                        مشاهده آنالیز رفتار و فروش
                    </button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                <StatsCard
                    icon={Package}
                    title="محصولات فعال"
                    value={toPersianNumber(productCount)}
                    trend={productCount > 0 ? "در حال نمایش" : "بدون محصول"}
                    subtitle="کاتالوگ فروشگاه"
                    color="blue"
                    index={0}
                />
                <StatsCard
                    icon={Users}
                    title="کاربران ثبت‌نامی"
                    value={toPersianNumber(userCount)}
                    trend={userCount > 0 ? "فعال در سیستم" : "بدون کاربر"}
                    subtitle="کل کاربران"
                    color="purple"
                    index={1}
                />
                <StatsCard
                    icon={ShoppingCart}
                    title="سفارشات جدید"
                    value={toPersianNumber(newOrdersCount)}
                    trend={newOrdersCount > 0 ? "در انتظار بررسی" : "ثبت شده"}
                    subtitle="وضعیت سفارش‌ها"
                    color="cyan"
                    index={2}
                />
                <StatsCard
                    icon={TrendingUp}
                    title="فروش این ماه"
                    value={monthlySales > 0 ? formatPersianNumber(monthlySales) + " تومان" : "۰ تومان"}
                    trend={monthlySales > 0 ? "ثبت شده" : "به‌روزرسانی"}
                    subtitle="مجموع درآمد"
                    color="orange"
                    index={3}
                />
                <StatsCard
                    icon={FileText}
                    title="پست‌های بلاگ"
                    value={toPersianNumber(blogPostCount)}
                    trend={blogPostCount > 0 ? "منتشر شده" : "بدون مقاله"}
                    subtitle="مقالات تخصصی"
                    color="green"
                    index={4}
                />
                <StatsCard
                    icon={MessageCircle}
                    title="نظرات معلق"
                    value={toPersianNumber(pendingComments)}
                    trend={pendingComments > 0 ? "نیازمند بررسی" : "تماماً تأیید شده"}
                    subtitle="بازخورد کاربران"
                    color="yellow"
                    index={5}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity (Audit logs) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            تاریخچه تغییرات سیستم (فعالیت‌ها)
                        </h2>
                        <span className="text-xs text-gray-400 font-semibold">۵ مورد آخر</span>
                    </div>

                    <div className="space-y-4 my-auto">
                        {recentAuditLogs.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">هیچ فعالیتی ثبت نشده است.</p>
                        ) : (
                            recentAuditLogs.map((log) => {
                                const isOrder = log.action.startsWith('ORDER')
                                return (
                                    <div key={log.id} className="flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100/50">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                            isOrder ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                            {isOrder ? <ShoppingCart className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-800 font-bold text-sm truncate">{auditActionLabels[log.action] || log.action}</p>
                                            <p className="text-gray-500 text-xs mt-1 truncate">{log.details || `شناسه کالا: ${log.entityId}`}</p>
                                        </div>
                                        <div className="text-left shrink-0">
                                            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full font-medium shadow-sm">
                                                {formatTimeAgo(log.createdAt)}
                                            </span>
                                            <span className="block text-[10px] text-gray-400 mt-1 text-center font-bold">{log.admin.name || 'مدیر'}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </motion.div>

                {/* Technical Shortcuts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-6"
                >
                    {/* System status */}
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20" />

                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                            <AlertCircle className="w-5 h-5 text-sky-400" />
                            وضعیت پلتفرم
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">دیتابیس PostgreSQL</span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">سالم و متصل</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm text-slate-300">سرور لبه (Next.js Edge)</span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">سریع و فعال</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm text-slate-300">ماژول مانیتورینگ خطاها</span>
                                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">در حال پایش</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick navigation */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">دسترسی‌های سریع</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => router.push('/admin/dashboard/users')} className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold text-center">
                                مدیریت کاربران
                            </button>
                            <button onClick={() => router.push('/admin/dashboard/orders')} className="p-3 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-xs font-bold text-center">
                                پیگیری سفارشات
                            </button>
                            <button onClick={() => router.push('/admin/dashboard/blog')} className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-bold text-center">
                                مدیریت مجله محتوا
                            </button>
                            <button onClick={() => router.push('/admin/dashboard/appearance')} className="p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-xs font-bold text-center">
                                مدیریت ظاهر و بنرها
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* MODAL: REPORT EXPORT SELECTOR */}
            <AnimatePresence>
                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowExportModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">خروجی اکسل و گزارشات CSV</h3>
                                <button onClick={() => setShowExportModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                <ExportOption
                                    title="خروجی اطلاعات سفارشات"
                                    desc="شامل وضعیت خرید، مبالغ کل و جزئیات خریداران" 
                                    onClick={() => handleExport('orders')} 
                                    loading={exportingType === 'orders'}
                                />
                                <ExportOption
                                    title="خروجی اطلاعات مشتریان"
                                    desc="شامل تلفن، نام و زمان ثبت‌نام جهت کارزارهای پیامکی" 
                                    onClick={() => handleExport('customers')} 
                                    loading={exportingType === 'customers'}
                                />
                                <ExportOption
                                    title="خروجی اطلاعات انبار کالاها"
                                    desc="شامل کد کالا، برند، قیمت و موجودی فیزیکی انبار" 
                                    onClick={() => handleExport('products')} 
                                    loading={exportingType === 'products'}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: SPOTLIGHT SEARCH OVERLAY */}
            <AnimatePresence>
                {showSearchModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => {
                                setShowSearchModal(false)
                                setSearchQuery('')
                                setSearchResults(null)
                            }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ y: -20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: -20, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
                        >
                            {/* Search bar header */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="در کل فروشگاه جستجو کنید (کالا، کاربر، فاکتور...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                />
                                <button 
                                    onClick={() => {
                                        setShowSearchModal(false)
                                        setSearchQuery('')
                                        setSearchResults(null)
                                    }} 
                                    className="p-1 rounded-full hover:bg-gray-200 text-gray-400 shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Results */}
                            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                                {isSearching && (
                                    <div className="text-center py-6 text-gray-400 text-sm">در حال کاوش در دیتابیس...</div>
                                )}
                                
                                {!isSearching && !searchResults && searchQuery.trim().length >= 2 && (
                                    <div className="text-center py-6 text-gray-400 text-sm">موردی یافت نشد.</div>
                                )}

                                {!isSearching && !searchResults && searchQuery.trim().length < 2 && (
                                    <div className="text-center py-6 text-gray-400 text-xs">برای جستجو حداقل ۲ حرف بنویسید.</div>
                                )}

                                {searchResults && (
                                    <div className="space-y-5">
                                        {/* Products */}
                                        {searchResults.products.length > 0 && (
                                             <SearchCategorySection title="محصولات">
                                                {searchResults.products.map(p => (
                                                    <div key={p.id} className="flex justify-between items-center hover:bg-gray-50 p-2.5 rounded-xl border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => {
                                                        router.push(`/admin/dashboard/products`)
                                                        setShowSearchModal(false)
                                                    }}>
                                                        <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                                        <span className="text-xs bg-sky-50 text-sky-600 px-3 py-1 rounded-full font-bold">{toPersianNumber(p.price.toLocaleString('fa-IR'))} تومان</span>
                                                    </div>
                                                ))}
                                            </SearchCategorySection>
                                        )}

                                        {/* Orders */}
                                        {searchResults.orders.length > 0 && (
                                            <SearchCategorySection title="سفارشات و فاکتورها">
                                                {searchResults.orders.map(o => (
                                                    <div key={o.id} className="flex justify-between items-center hover:bg-gray-50 p-2.5 rounded-xl border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => {
                                                        router.push(`/admin/dashboard/orders/${o.id}`)
                                                        setShowSearchModal(false)
                                                    }}>
                                                        <span className="text-sm font-bold text-gray-800 font-mono">{o.orderNumber} ({o.customerName})</span>
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${o.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {ORDER_STATUS_META[o.status as OrderStatus]?.label || o.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </SearchCategorySection>
                                        )}

                                        {/* Users */}
                                        {searchResults.users.length > 0 && (
                                            <SearchCategorySection title="مشتریان">
                                                {searchResults.users.map(u => (
                                                    <div key={u.id} className="flex justify-between items-center hover:bg-gray-50 p-2.5 rounded-xl border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => {
                                                        router.push(`/admin/dashboard/users`)
                                                        setShowSearchModal(false)
                                                    }}>
                                                        <span className="text-sm font-bold text-gray-800">{u.firstName || ''} {u.lastName || ''}</span>
                                                        <span className="text-xs text-gray-400 font-mono">{toPersianNumber(u.phone)}</span>
                                                    </div>
                                                ))}
                                            </SearchCategorySection>
                                        )}

                                        {/* Posts */}
                                        {searchResults.posts.length > 0 && (
                                            <SearchCategorySection title="مطالب وبلاگ">
                                                {searchResults.posts.map(post => (
                                                    <div key={post.id} className="hover:bg-gray-50 p-2.5 rounded-xl border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => {
                                                        router.push(`/admin/dashboard/blog`)
                                                        setShowSearchModal(false)
                                                    }}>
                                                        <span className="text-sm font-bold text-gray-800">{post.title}</span>
                                                    </div>
                                                ))}
                                            </SearchCategorySection>
                                        )}

                                        {/* Categories */}
                                        {searchResults.categories.length > 0 && (
                                            <SearchCategorySection title="دسته‌بندی‌ها">
                                                {searchResults.categories.map(cat => (
                                                    <div key={cat.id} className="hover:bg-gray-50 p-2.5 rounded-xl border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => {
                                                        router.push(`/admin/dashboard/categories`)
                                                        setShowSearchModal(false)
                                                    }}>
                                                        <span className="text-sm font-bold text-gray-800">{cat.name}</span>
                                                    </div>
                                                ))}
                                            </SearchCategorySection>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function ExportOption({ title, desc, onClick, loading }: {
    title: string
    desc: string
    onClick: () => void
    loading: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-gray-200 transition-all text-right group disabled:opacity-50"
        >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                {loading ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </div>
        </button>
    )
}

function SearchCategorySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded uppercase tracking-wider">{title}</h4>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    )
}
