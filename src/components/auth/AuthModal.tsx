'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Lock, Check, Edit2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { toPersianDigits, toEnglishDigits } from '@/lib/persian'
import OTPInputField from '@/components/ui/OTPInput'
import { getStoredAnalyticsSource } from '@/components/analytics/VisitTracker'

type AuthStep = 'phone' | 'otp'

const PHONE_STORAGE_KEY = 'ice_center_last_phone'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const { refreshUser } = useAuth()
    const [step, setStep] = useState<AuthStep>('phone')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const [otpExpiry, setOtpExpiry] = useState(120)

    const otpInputRef = useRef<HTMLInputElement>(null)
    const phoneInputRef = useRef<HTMLInputElement>(null)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY)
            if (savedPhone) {
                setPhone(savedPhone)
            }
            setStep('phone')
            setOtp('')
            setError('')
            setCooldown(0)

            // Focus phone input
            setTimeout(() => phoneInputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    // OTP expiry timer
    useEffect(() => {
        if (step === 'otp' && otpExpiry > 0) {
            const timer = setTimeout(() => setOtpExpiry(otpExpiry - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [step, otpExpiry])

    // Focus OTP input when step changes
    useEffect(() => {
        if (step === 'otp' && otpInputRef.current) {
            otpInputRef.current.focus()
        }
    }, [step])

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    const handleSendOtp = useCallback(async () => {
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'مشکلی پیش آمد')
                if (data.waitSeconds) {
                    setCooldown(data.waitSeconds)
                }
                setLoading(false)
                return
            }

            localStorage.setItem(PHONE_STORAGE_KEY, phone)
            toast.success('کد تأیید ارسال شد')
            setStep('otp')
            setOtpExpiry(120)
            setCooldown(60)
            setOtp('')

        } catch {
            setError('اتصال به سرور برقرار نشد')
        } finally {
            setLoading(false)
        }
    }, [phone])

    const handleVerifyOtp = async () => {
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: otp, source: getStoredAnalyticsSource() }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'کد اشتباه است')
                setLoading(false)
                return
            }

            toast.success('خوش آمدید')
            await refreshUser()
            onClose()
            onSuccess?.()

        } catch {
            setError('اتصال به سرور برقرار نشد')
        } finally {
            setLoading(false)
        }
    }

    const handleEditPhone = () => {
        setStep('phone')
        setOtp('')
        setError('')
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const cooldownProgress = cooldown > 0 ? cooldown / 60 : 0

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">
                                {step === 'phone' ? 'ورود به حساب' : 'تأیید کد'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {/* Phone Step */}
                                {step === 'phone' && (
                                    <motion.form
                                        key="phone"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={(e) => { e.preventDefault(); handleSendOtp() }}
                                        className="space-y-4"
                                    >
                                        <p className="text-gray-500 text-sm text-center mb-4">
                                            برای ادامه، شماره موبایل خود را وارد کنید
                                        </p>

                                        <div className="relative">
                                            <input
                                                ref={phoneInputRef}
                                                type="tel"
                                                dir="ltr"
                                                value={toPersianDigits(phone)}
                                                onChange={(e) => setPhone(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ''))}
                                                placeholder="۰۹۱۲xxxxxxx"
                                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-lg dir-ltr text-left placeholder:text-gray-400"
                                                style={{ paddingLeft: phone.length === 0 ? '4rem' : '1rem' }}
                                                required
                                                maxLength={11}
                                            />
                                            {phone.length === 0 && (
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            )}
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm"
                                            >
                                                {error}
                                            </motion.div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading || cooldown > 0 || phone.length < 10}
                                            className="w-full bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : cooldown > 0 ? (
                                                <>
                                                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="text-white/30" />
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="text-white" strokeDasharray={62.83} strokeDashoffset={62.83 * (1 - cooldownProgress)} strokeLinecap="round" />
                                                    </svg>
                                                    <span>{cooldown} ثانیه</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>ارسال کد تأیید</span>
                                                    <ArrowLeft className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </motion.form>
                                )}

                                {/* OTP Step */}
                                {step === 'otp' && (
                                    <motion.form
                                        key="otp"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={(e) => { e.preventDefault(); handleVerifyOtp() }}
                                        className="space-y-4"
                                    >
                                        <div className="text-center mb-4">
                                            <p className="text-gray-500 text-sm">کد ارسال شده به</p>
                                            <p className="font-bold text-gray-800 dir-ltr">{toPersianDigits(phone)}</p>
                                            <button
                                                type="button"
                                                onClick={handleEditPhone}
                                                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mx-auto mt-1"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                ویرایش
                                            </button>
                                        </div>

                                        <OTPInputField
                                            value={otp}
                                            onChange={(value) => setOtp(toEnglishDigits(value).replace(/[^0-9]/g, '').slice(0, 4))}
                                            maxLength={4}
                                            disabled={loading}
                                        />

                                        <div className="flex justify-center">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${otpExpiry > 30 ? 'bg-green-50 text-green-600' : otpExpiry > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                <Lock className="w-3 h-3" />
                                                {otpExpiry > 0 ? formatTime(otpExpiry) : 'منقضی شده'}
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm"
                                            >
                                                {error}
                                            </motion.div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading || otp.length !== 4}
                                            className="w-full bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>تأیید و ورود</span>
                                                    <Check className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={loading || cooldown > 0}
                                            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors disabled:opacity-50"
                                        >
                                            {cooldown > 0 ? `ارسال مجدد (${cooldown})` : 'ارسال مجدد کد'}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
