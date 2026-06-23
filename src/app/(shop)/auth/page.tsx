'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Lock, Check, Edit2, Snowflake, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { toEnglishDigits } from '@/lib/persian'
import { getStoredAnalyticsSource } from '@/components/analytics/VisitTracker'

type AuthStep = 'phone' | 'otp'

const PHONE_STORAGE_KEY = 'ice_center_last_phone'
const REDIRECT_STORAGE_KEY = 'ice_center_auth_redirect'

export default function AuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [step, setStep] = useState<AuthStep>('phone')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const [otpExpiry, setOtpExpiry] = useState(120)

    const otpInputRef = useRef<HTMLInputElement>(null)

    // Load saved phone on mount
    useEffect(() => {
        const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY)
        if (savedPhone) {
            setPhone(savedPhone)
        }

        // Save redirect path if provided
        const redirectPath = searchParams.get('redirect')
        if (redirectPath) {
            localStorage.setItem(REDIRECT_STORAGE_KEY, redirectPath)
        }
    }, [searchParams])

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

    const getRedirectPath = () => {
        const paramRedirect = searchParams.get('redirect')
        const storedRedirect = localStorage.getItem(REDIRECT_STORAGE_KEY)
        return paramRedirect || storedRedirect || '/'
    }

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
                setError(data.error || 'مشکلی پیش آمد. دوباره امتحان کنید')
                if (data.waitSeconds) {
                    setCooldown(data.waitSeconds)
                }
                setLoading(false)
                return
            }

            // Save phone for future
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

            // Clear redirect storage
            localStorage.removeItem(REDIRECT_STORAGE_KEY)

            toast.success('خوش آمدید')

            // Redirect back to where user was
            const redirectPath = getRedirectPath()
            router.push(redirectPath)
            router.refresh()

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

    // Calculate cooldown progress (0 to 1)
    const cooldownProgress = cooldown > 0 ? cooldown / 60 : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-xl shadow-blue-500/20"
                    >
                        <Snowflake className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {step === 'phone' ? 'ورود به آیس سنتر' : 'کد تأیید را وارد کنید'}
                    </h1>
                    <p className="text-gray-500">
                        {step === 'phone'
                            ? 'شماره موبایل خود را وارد کنید'
                            : <span className="font-mono dir-ltr inline-block">{phone}</span>
                        }
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Phone Input */}
                        {step === 'phone' && (
                            <motion.form
                                key="phone"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={(e) => { e.preventDefault(); handleSendOtp() }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 mr-1 block">شماره موبایل</label>
                                    <div className="relative group">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                            placeholder="0912xxxxxxx"
                                            className={`w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-lg dir-ltr placeholder:text-gray-400 ${phone.length === 0 ? 'pl-14' : 'pl-4'}`}
                                            required
                                            maxLength={11}
                                        />
                                        {phone.length === 0 && (
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || cooldown > 0 || phone.length < 10}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : cooldown > 0 ? (
                                        <>
                                            {/* Cooldown Progress Ring */}
                                            <div className="relative w-6 h-6">
                                                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        className="text-white/30"
                                                    />
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        className="text-white"
                                                        strokeDasharray={62.83}
                                                        strokeDashoffset={62.83 * (1 - cooldownProgress)}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </div>
                                            <span>{cooldown} ثانیه</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>ارسال کد تأیید</span>
                                            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <motion.form
                                key="otp"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={(e) => { e.preventDefault(); handleVerifyOtp() }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-700">کد ۴ رقمی</label>
                                        <button
                                            type="button"
                                            onClick={handleEditPhone}
                                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            ویرایش شماره
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            ref={otpInputRef}
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 4))}
                                            placeholder="• • • •"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-3xl text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-gray-300"
                                            required
                                            maxLength={4}
                                        />
                                    </div>

                                    {/* OTP Expiry Timer */}
                                    <div className="flex justify-center mt-3">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${otpExpiry > 30
                                            ? 'bg-green-50 text-green-600'
                                            : otpExpiry > 0
                                                ? 'bg-amber-50 text-amber-600'
                                                : 'bg-red-50 text-red-600'
                                            }`}>
                                            <Lock className="w-3.5 h-3.5" />
                                            {otpExpiry > 0 ? (
                                                <span>اعتبار کد: {formatTime(otpExpiry)}</span>
                                            ) : (
                                                <span>کد منقضی شده</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading || otp.length !== 4}
                                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-800 font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {cooldown > 0 ? (
                                            <>
                                                <div className="relative w-5 h-5">
                                                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-300" />
                                                        <circle
                                                            cx="12" cy="12" r="10"
                                                            stroke="currentColor" strokeWidth="2" fill="none"
                                                            className="text-blue-500"
                                                            strokeDasharray={62.83}
                                                            strokeDashoffset={62.83 * (1 - cooldownProgress)}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                </div>
                                                <span>ارسال مجدد ({cooldown})</span>
                                            </>
                                        ) : (
                                            <span>ارسال مجدد کد</span>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mt-6">
                    {['phone', 'otp'].map((s, i) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${step === s
                                ? 'bg-blue-500 w-8'
                                : i < ['phone', 'otp'].indexOf(step)
                                    ? 'bg-blue-300 w-4'
                                    : 'bg-gray-200 w-4'
                                }`}
                        />
                    ))}
                </div>

                {/* Back to Shop Link */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                        بازگشت به فروشگاه
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
