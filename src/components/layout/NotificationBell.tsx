'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Package, Tag, TrendingDown, Box, Info, Loader2, Check, X } from 'lucide-react';
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
    ORDER: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    PROMO: { icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50' },
    PRICE: { icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50' },
    STOCK: { icon: Box, color: 'text-orange-500', bg: 'bg-orange-50' },
    SYSTEM: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch unread count on mount
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    async function fetchUnreadCount() {
        try {
            const res = await fetch('/api/notifications?limit=1&unreadOnly=true');
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            // User not logged in or error - ignore
        }
    }

    async function fetchNotifications() {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications?limit=5');
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
            console.error('Error marking as read:', error);
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
            console.error('Error marking all as read:', error);
        }
    }

    function formatTime(dateString: string) {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: faIR,
            });
        } catch {
            return '';
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                title="اعلان‌ها"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '۹+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm">اعلان‌ها</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                خواندن همه
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="py-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">اعلانی وجود ندارد</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notif) => {
                                    const config = typeConfig[notif.type] || typeConfig.SYSTEM;
                                    const Icon = config.icon;
                                    const isUnread = !notif.readAt;

                                    const content = (
                                        <div
                                            className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/50' : ''
                                                }`}
                                            onClick={() => isUnread && markAsRead(notif.id)}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center shrink-0`}
                                            >
                                                <Icon className={`w-4 h-4 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {formatTime(notif.createdAt)}
                                                </p>
                                            </div>
                                            {isUnread && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                            )}
                                        </div>
                                    );

                                    return notif.link ? (
                                        <Link key={notif.id} href={notif.link}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={notif.id}>{content}</div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100">
                        <Link
                            href="/profile/notifications"
                            className="block text-center py-3 text-sm text-blue-600 hover:bg-gray-50 font-medium"
                            onClick={() => setOpen(false)}
                        >
                            مشاهده همه اعلان‌ها
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
