'use client'

import { useState, useRef, useEffect } from 'react'
import { toPersianDigits } from '@/lib/persian'
import Link from 'next/link'
import { User, LogOut, Package, MapPin, ChevronDown, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface UserButtonProps {
    variant?: 'dark' | 'light';
    className?: string;
}

export default function UserButton({ variant = 'dark', className = '' }: UserButtonProps) {
    const { user, isLoading, isAuthenticated, logout, openAuthModal } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        setIsOpen(false)
        await logout()
        toast.success('با موفقیت خارج شدید')
    }

    const getInitial = () => {
        if (user?.firstName) return user.firstName[0]
        return user?.phone?.slice(-2) || '?'
    }

    const getDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        if (user?.firstName) return user.firstName
        return user?.phone || ''
    }

    // Loading state
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center w-9 h-9 border rounded-xl ${
                variant === 'dark' ? 'border-white/20' : 'border-gray-200'
            } ${className}`}>
                <div className="w-4 h-4 border-2 border-sky-breeze border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const isDark = variant === 'dark';

    // Not authenticated - show login button
    if (!isAuthenticated) {
        return (
            <button
                onClick={() => openAuthModal()}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 select-none ${
                    isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold backdrop-blur-md hover:border-white/50'
                        : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-semibold'
                } ${className}`}
            >
                <User size={16} className={isDark ? 'text-sky-breeze' : 'text-ocean'} />
                <span className="text-xs md:text-sm font-bold">ورود</span>
            </button>
        )
    }

    // Authenticated - show user dropdown
    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none ${
                    isDark
                        ? 'bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold backdrop-blur-md'
                        : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-semibold'
                } ${className}`}
            >
                {/* Avatar */}
                <div className="w-6 h-6 bg-royal text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                    {getInitial()}
                </div>
                <span className="text-xs font-bold truncate max-w-[110px]">
                    {getDisplayName()}
                </span>
                <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
                        isDark ? 'text-white/80' : 'text-gray-500'
                    }`}
                />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 text-gray-900"
                    >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                            <p className="text-sm font-bold text-midnight truncate">
                                {getDisplayName()}
                            </p>
                            <p className="text-xs text-gray-500 dir-ltr text-right mt-0.5">
                                {toPersianDigits(user?.phone || '')}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5">
                            {user?.isAdmin && (
                                <Link
                                    href="/admin/dashboard"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-100"
                                >
                                    <ShieldCheck size={16} className="text-amber-600" />
                                    <span>ورود به پنل مدیریت</span>
                                </Link>
                            )}
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-frost hover:text-royal transition-colors"
                            >
                                <User size={16} className="text-ocean" />
                                <span>حساب کاربری</span>
                            </Link>
                            <Link
                                href="/profile/orders"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-frost hover:text-royal transition-colors"
                            >
                                <Package size={16} className="text-ocean" />
                                <span>سفارش‌های من</span>
                            </Link>
                            <Link
                                href="/profile/addresses"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-frost hover:text-royal transition-colors"
                            >
                                <MapPin size={16} className="text-ocean" />
                                <span>آدرس‌های من</span>
                            </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors w-full cursor-pointer"
                            >
                                <LogOut size={16} />
                                <span>خروج از حساب</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
