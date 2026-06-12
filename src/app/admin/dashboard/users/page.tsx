import { Users, Search, Phone, Calendar, ShieldCheck, ShieldX, Eye } from 'lucide-react';
import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { Suspense } from 'react';
import Link from 'next/link';

async function getUsers() {
    await connection(); // Opt out of caching
    return prisma.user.findMany({
        include: {
            _count: {
                select: {
                    cartItems: true,
                    addresses: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function UsersContent() {
    const users = await getUsers();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string, isVerified: boolean) => {
        if (status === 'BLOCKED') {
            return { class: 'bg-red-100 text-red-800', label: 'مسدود' };
        }
        if (isVerified) {
            return { class: 'bg-green-100 text-green-800', label: 'تایید شده' };
        }
        return { class: 'bg-yellow-100 text-yellow-800', label: 'تایید نشده' };
    };

    return (
        <div className="space-y-6 p-6" dir="rtl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">مدیریت کاربران</h1>
                <p className="text-gray-600 mt-1">مشاهده لیست کاربران ثبت‌نام شده</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">{users.length}</div>
                            <div className="text-sm text-gray-500">کل کاربران</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {users.filter(u => u.isVerified).length}
                            </div>
                            <div className="text-sm text-gray-500">تایید شده</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <ShieldX className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {users.filter(u => !u.isVerified).length}
                            </div>
                            <div className="text-sm text-gray-500">تایید نشده</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <ShieldX className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                {users.filter(u => u.status === 'BLOCKED').length}
                            </div>
                            <div className="text-sm text-gray-500">مسدود شده</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجوی کاربر با شماره تلفن..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Users Table */}
            {users.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                        کاربر
                                    </th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                        شماره تلفن
                                    </th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                        وضعیت
                                    </th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                        آمار
                                    </th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                        تاریخ عضویت
                                    </th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                        عملیات
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const statusInfo = getStatusBadge(user.status, user.isVerified);
                                    return (
                                        <tr
                                            key={user.id}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-ocean/10 rounded-full flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-ocean" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">
                                                            {user.firstName && user.lastName
                                                                ? `${user.firstName} ${user.lastName}`
                                                                : 'بدون نام'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            شناسه: {user.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span dir="ltr">{user.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.class}`}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>{user._count.cartItems} سبد</span>
                                                    <span>{user._count.addresses} آدرس</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {formatDate(user.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/dashboard/users/${user.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    پرونده
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                        <Users className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">هنوز کاربری ثبت‌نام نکرده</h2>
                    <p className="text-gray-600">کاربران ثبت‌نام شده در این قسمت نمایش داده می‌شوند</p>
                </div>
            )}
        </div>
    );
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری کاربران...</div>}>
            <UsersContent />
        </Suspense>
    );
}
