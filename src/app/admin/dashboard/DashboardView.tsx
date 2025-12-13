'use client';

import StatsCard from '@/components/admin/StatsCard';
import { Package, Users, FolderTree, ShoppingCart, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toPersianNumber, formatPersianNumber } from '@/utils/persian';

interface DashboardViewProps {
    productCount: number;
    userCount: number;
    monthlySales: number;
    newOrdersCount: number;
}

export default function DashboardView({ productCount, userCount, monthlySales, newOrdersCount }: DashboardViewProps) {
    const router = useRouter();

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-full h-full opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">خوش آمدید، مدیر سیستم 👋</h1>
                        <p className="text-sky-50/90 text-lg max-w-xl">
                            گزارش عملکرد امروز فروشگاه آیس سنتر ایران. وضعیت کلی سیستم پایدار است.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => alert('گزارش کامل در حال توسعه است')}
                            className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/20 shadow-lg"
                        >
                            گزارش کامل
                        </button>
                        <button
                            onClick={() => router.push('/admin/dashboard/products/add')}
                            className="bg-white text-sky-600 hover:bg-sky-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                        >
                            <Package className="w-5 h-5" />
                            محصول جدید
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    icon={Package}
                    title="محصولات فعال"
                    value={toPersianNumber(productCount)}
                    trend={productCount > 0 ? "فعال" : ""}
                    trendUp
                    color="blue"
                    index={0}
                />
                <StatsCard
                    icon={Users}
                    title="کاربران ثبت‌نامی"
                    value={toPersianNumber(userCount)}
                    trend={userCount > 0 ? "کاربر" : ""}
                    trendUp
                    color="purple"
                    index={1}
                />
                <StatsCard
                    icon={ShoppingCart}
                    title="سفارشات جدید"
                    value={toPersianNumber(newOrdersCount)}
                    trend={newOrdersCount > 0 ? "جدید" : ""}
                    trendUp={false}
                    color="cyan"
                    index={2}
                />
                <StatsCard
                    icon={TrendingUp}
                    title="فروش ماهانه"
                    value={monthlySales > 0 ? formatPersianNumber(monthlySales) + " تومان" : "۰ تومان"}
                    trend={monthlySales > 0 ? "این ماه" : ""}
                    trendUp
                    color="orange"
                    index={3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            فعالیت‌های اخیر
                        </h2>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">مشاهده همه</button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-800 font-bold text-sm">محصول جدید اضافه شد</p>
                                    <p className="text-gray-500 text-xs mt-1">دستگاه بستنی‌ساز قیفی مدل 2024</p>
                                </div>
                                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
                                    ۲ دقیقه پیش
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* System Status / Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-6"
                >
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20" />

                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                            وضعیت سیستم
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">فضای ذخیره‌سازی</span>
                                <span className="text-sm font-bold text-blue-400">45%</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm text-slate-400">پهنای باند</span>
                                <span className="text-sm font-bold text-cyan-400">70%</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">میانبرها</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-bold text-center">
                                مدیریت کاربران
                            </button>
                            <button className="p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-sm font-bold text-center">
                                تنظیمات سایت
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
