'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Phone, ShoppingBag, Heart, ShoppingCart, MessageSquare,
    BarChart3, Calendar, MapPin, Package, Tag, ArrowRight, Clock,
    Monitor, Smartphone, Circle
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Order {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string | Date;
    items: { productName: string; quantity: number; unitPrice: number }[];
}

interface CartItem {
    id: number;
    quantity: number;
    product: { id: number; name: string; price: number; thumbnail: string | null };
}

interface WishlistItem {
    id: number;
    product: { id: number; name: string; price: number; thumbnail: string | null; slug: string };
}

interface SupportRoom {
    id: number;
    status: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    _count: { messages: number };
    messages: { text: string; sender: string; createdAt: string | Date }[];
}

interface AnalyticsEvent {
    id: number;
    type: string;
    path: string | null;
    source: string;
    device: string | null;
    createdAt: string | Date;
}

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    readAt: string | Date | null;
    createdAt: string | Date;
}

interface CustomerData {
    user: {
        id: number;
        phone: string;
        firstName: string | null;
        lastName: string | null;
        isVerified: boolean;
        status: string;
        createdAt: string | Date;
        addresses: { city: string; province: string | null; address: string }[];
    };
    orders: Order[];
    cartItems: CartItem[];
    wishlistItems: WishlistItem[];
    supportRooms: SupportRoom[];
    analyticsEvents: AnalyticsEvent[];
    notifications: Notification[];
    stats: {
        totalOrders: number;
        totalSpent: number;
        wishlistCount: number;
        cartCount: number;
    };
}

type TabKey = 'orders' | 'cart' | 'wishlist' | 'support' | 'analytics' | 'notifications';

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'در انتظار پرداخت', color: 'bg-yellow-100 text-yellow-700' },
    PAID: { label: 'پرداخت شده', color: 'bg-blue-100 text-blue-700' },
    PROCESSING: { label: 'در حال پردازش', color: 'bg-purple-100 text-purple-700' },
    SHIPPED: { label: 'ارسال شده', color: 'bg-cyan-100 text-cyan-700' },
    DELIVERED: { label: 'تحویل داده شده', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'لغو شده', color: 'bg-red-100 text-red-700' },
};

function formatTime(dateInput: string | Date) {
    try {
        return formatDistanceToNow(new Date(dateInput), { addSuffix: true, locale: faIR });
    } catch {
        return '';
    }
}

function formatDate(dateInput: string | Date) {
    return new Date(dateInput).toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

export default function CustomerProfileView({ data }: { data: CustomerData }) {
    const [activeTab, setActiveTab] = useState<TabKey>('orders');
    const { user, orders, cartItems, wishlistItems, supportRooms, analyticsEvents, notifications, stats } = data;

    const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || 'بدون نام';

    const tabs: { key: TabKey; label: string; icon: React.ElementType; count?: number }[] = [
        { key: 'orders', label: 'سفارشات', icon: ShoppingBag, count: stats.totalOrders },
        { key: 'cart', label: 'سبد خرید', icon: ShoppingCart, count: stats.cartCount },
        { key: 'wishlist', label: 'علاقه‌مندی‌ها', icon: Heart, count: stats.wishlistCount },
        { key: 'support', label: 'پشتیبانی', icon: MessageSquare, count: supportRooms.length },
        { key: 'notifications', label: 'اعلان‌ها', icon: Tag, count: notifications.length },
        { key: 'analytics', label: 'رفتار', icon: BarChart3, count: analyticsEvents.length },
    ];

    return (
        <div className="space-y-6" dir="rtl">
            {/* Back */}
            <Link
                href="/admin/dashboard/users"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
                <ArrowRight className="w-4 h-4" />
                بازگشت به لیست کاربران
            </Link>

            {/* Profile Header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #081F37, #2E79BA)' }}>
                        {displayName.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-sm text-gray-500" dir="ltr">
                                <Phone className="w-3.5 h-3.5" /> {user.phone}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="w-3.5 h-3.5" /> عضویت: {formatDate(user.createdAt)}
                            </span>
                            {user.addresses[0] && (
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                    <MapPin className="w-3.5 h-3.5" /> {user.addresses[0].city}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {user.isVerified ? 'تأیید شده' : 'تأیید نشده'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {user.status === 'ACTIVE' ? 'فعال' : 'مسدود'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{stats.totalOrders}</div>
                        <div className="text-xs text-blue-500 mt-0.5">سفارش</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">
                            {stats.totalSpent.toLocaleString('fa-IR')}
                        </div>
                        <div className="text-xs text-green-500 mt-0.5">تومان خرید</div>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-pink-700">{stats.wishlistCount}</div>
                        <div className="text-xs text-pink-500 mt-0.5">علاقه‌مندی</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-orange-700">{stats.cartCount}</div>
                        <div className="text-xs text-orange-500 mt-0.5">کالا در سبد</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Tab Bar */}
                <div className="flex overflow-x-auto border-b border-gray-100">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4">
                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="space-y-3">
                            {orders.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">هیچ سفارشی یافت نشد</p>}
                            {orders.map((order) => {
                                const statusInfo = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
                                return (
                                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <Package className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{order.orderNumber}</p>
                                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1 text-left">
                                                {order.total.toLocaleString('fa-IR')} تومان
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Cart Tab */}
                    {activeTab === 'cart' && (
                        <div className="space-y-3">
                            {cartItems.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">سبد خرید خالی است</p>}
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    {item.product.thumbnail ? (
                                        <div className="relative w-12 h-12 overflow-hidden rounded-lg">
                                            <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                                        <p className="text-xs text-gray-500">{item.quantity} عدد × {item.product.price.toLocaleString('fa-IR')} تومان</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Wishlist Tab */}
                    {activeTab === 'wishlist' && (
                        <div className="space-y-3">
                            {wishlistItems.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">لیست علاقه‌مندی خالی است</p>}
                            {wishlistItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    {item.product.thumbnail ? (
                                        <div className="relative w-12 h-12 overflow-hidden rounded-lg">
                                            <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <Heart className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Link href={`/products/${item.product.slug}`} target="_blank"
                                            className="text-sm font-medium text-blue-600 hover:underline">
                                            {item.product.name}
                                        </Link>
                                        <p className="text-xs text-gray-500">{item.product.price.toLocaleString('fa-IR')} تومان</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Support Tab */}
                    {activeTab === 'support' && (
                        <div className="space-y-3">
                            {supportRooms.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">هیچ گفتگوی پشتیبانی یافت نشد</p>}
                            {supportRooms.map((room) => {
                                const lastMsg = room.messages[0];
                                return (
                                    <div key={room.id} className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Circle className={`w-2.5 h-2.5 fill-current ${room.status === 'OPEN' ? 'text-green-500' : 'text-gray-300'}`} />
                                                <span className="text-xs text-gray-500">{formatDate(room.createdAt)}</span>
                                                <span className="text-xs text-gray-400">({room._count.messages} پیام)</span>
                                            </div>
                                            <Link href="/admin/dashboard/support" className="text-xs text-blue-500 hover:underline">
                                                مشاهده
                                            </Link>
                                        </div>
                                        {lastMsg && (
                                            <p className="text-sm text-gray-700 truncate">
                                                {lastMsg.sender === 'ADMIN' ? '↩ پشتیبان: ' : '→ مشتری: '}
                                                {lastMsg.text}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-3">
                            {notifications.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">هیچ اعلانی یافت نشد</p>}
                            {notifications.map((notif) => (
                                <div key={notif.id} className={`p-4 rounded-xl border ${notif.readAt ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                        </div>
                                        {!notif.readAt && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">{formatTime(notif.createdAt)}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-2">
                            {analyticsEvents.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">هیچ رویداد تحلیلی یافت نشد</p>}
                            {analyticsEvents.map((event) => (
                                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {event.device?.toLowerCase().includes('mobile')
                                            ? <Smartphone className="w-4 h-4 text-blue-500" />
                                            : <Monitor className="w-4 h-4 text-blue-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-700 truncate">
                                            {event.path || '/'} — <span className="text-gray-400">{event.source}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400">{event.type}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(event.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
