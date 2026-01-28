'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BellOff, Bell, Package, Tag, TrendingDown, Box, Info, Loader2, Trash2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Notification {
    id: number;
    type: 'ORDER' | 'PROMO' | 'PRICE' | 'STOCK' | 'SYSTEM';
    title: string;
    message: string;
    link: string | null;
    readAt: string | null;
    createdAt: string;
}

const typeConfig = {
    ORDER: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', label: 'سفارش' },
    PROMO: { icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50', label: 'تخفیف' },
    PRICE: { icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50', label: 'قیمت' },
    STOCK: { icon: Box, color: 'text-orange-500', bg: 'bg-orange-50', label: 'موجودی' },
    SYSTEM: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50', label: 'سیستم' },
};

type FilterType = 'ALL' | 'ORDER' | 'PROMO' | 'PRICE' | 'STOCK' | 'SYSTEM';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('ALL');

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        try {
            const res = await fetch('/api/notifications?limit=50');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(id: number) {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await fetch('/api/notifications', { method: 'POST' });
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function deleteNotification(id: number) {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            const notif = notifications.find((n) => n.id === id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (notif && !notif.readAt) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function formatTime(dateString: string) {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: faIR });
        } catch {
            return '';
        }
    }

    const filteredNotifications = filter === 'ALL'
        ? notifications
        : notifications.filter((n) => n.type === filter);

    const filters: { key: FilterType; label: string }[] = [
        { key: 'ALL', label: 'همه' },
        { key: 'ORDER', label: 'سفارش' },
        { key: 'PROMO', label: 'تخفیف' },
        { key: 'PRICE', label: 'قیمت' },
        { key: 'STOCK', label: 'موجودی' },
    ];

    return (
        <div className="pb-20 lg:pb-0">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-sm font-bold text-gray-800">اعلان‌ها</h1>
                    {unreadCount > 0 && (
                        <span className="ml-auto text-xs text-gray-500">{unreadCount} خوانده نشده</span>
                    )}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex lg:items-center lg:justify-between bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">اعلان‌ها</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : 'پیام‌ها و اطلاع‌رسانی‌ها'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <CheckCheck className="w-4 h-4" />
                        خواندن همه
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f.key
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-ocean mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">در حال بارگذاری...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredNotifications.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BellOff className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800 mb-2">اعلانی وجود ندارد</h2>
                    <p className="text-xs text-gray-500">اعلان‌های جدید اینجا نمایش داده می‌شوند</p>
                </div>
            )}

            {/* Notifications List */}
            {!loading && filteredNotifications.length > 0 && (
                <div className="space-y-3">
                    {filteredNotifications.map((notif) => {
                        const config = typeConfig[notif.type] || typeConfig.SYSTEM;
                        const Icon = config.icon;
                        const isUnread = !notif.readAt;

                        return (
                            <div
                                key={notif.id}
                                className={`bg-white rounded-2xl p-4 shadow-sm ${isUnread ? 'ring-2 ring-blue-100' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-6 h-6 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{notif.title}</p>
                                                <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                                            </div>
                                            {isUnread && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs text-gray-400">{formatTime(notif.createdAt)}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>
                                            {notif.link && (
                                                <Link
                                                    href={notif.link}
                                                    onClick={() => isUnread && markAsRead(notif.id)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    مشاهده
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notif.id)}
                                                className="text-xs text-red-500 hover:text-red-600 mr-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
