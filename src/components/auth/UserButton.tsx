'use client'

import { useState, useRef, useEffect } from 'react'
import { toPersianDigits } from '@/lib/persian'
import Link from 'next/link'
import { User, LogOut, Package, MapPin, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function UserButton() {
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
            <div className="flex items-center justify-center w-11 h-11 border border-gray-200 rounded-lg">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }

    // Not authenticated - show login button
    if (!isAuthenticated) {
        return (
            <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
                <User size={18} />
                <span className="text-sm font-medium">ورود</span>
            </button>
        )
    }

    // Authenticated - show user dropdown
    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
                {/* Avatar */}
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {getInitial()}
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                        className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {getDisplayName()}
                            </p>
                            <p className="text-xs text-gray-500 dir-ltr text-right">
                                {toPersianDigits(user?.phone || '')}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User size={18} className="text-gray-400" />
                                <span>حساب کاربری</span>
                            </Link>
                            <Link
                                href="/profile/orders"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Package size={18} className="text-gray-400" />
                                <span>سفارش‌های من</span>
                            </Link>
                            <Link
                                href="/profile/addresses"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <MapPin size={18} className="text-gray-400" />
                                <span>آدرس‌های من</span>
                            </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                            >
                                <LogOut size={18} />
                                <span>خروج از حساب</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
