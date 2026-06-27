'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Lock, Send, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            setError('شماره موبایل معتبر وارد کنید');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'خطا در ارسال کد');
                setLoading(false);
                return;
            }

            // Move to OTP step
            setStep('otp');
            setCountdown(120); // 2 minutes
            setLoading(false);
        } catch {
            setError('خطای شبکه. لطفا دوباره تلاش کنید.');
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'ورود ناموفق');
                setLoading(false);
                return;
            }

            router.push('/admin/dashboard');
            router.refresh();
        } catch {
            setError('خطای شبکه. لطفا دوباره تلاش کنید.');
            setLoading(false);
        }
    };

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ocean/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-ocean to-sky-breeze rounded-2xl mb-6 shadow-2xl shadow-ocean/30"
                    >
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">پنل مدیریت آیس سنتر</h1>
                    <p className="text-blue-200/60">
                        {step === 'phone' ? 'شماره موبایل خود را وارد کنید' : 'کد ارسال شده را وارد کنید'}
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={step === 'otp' ? handleLogin : (e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-6">

                        {/* Phone Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-blue-100/80 mr-1 block">شماره موبایل</label>
                            <div className="relative group">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0912xxxxxxx"
                                    disabled={step === 'otp'}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3.5 pl-10 focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean transition-all font-mono dir-ltr placeholder:text-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                />
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                        </div>

                        {/* OTP Input - Only shown in step 2 */}
                        {step === 'otp' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-blue-100/80 mr-1 block">کد تأیید</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="----"
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3.5 pl-10 focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean transition-all font-mono text-center tracking-[1em] placeholder:tracking-normal placeholder:text-slate-600"
                                        required
                                        maxLength={4}
                                        autoFocus
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                </div>

                                {/* Resend / Countdown */}
                                <div className="flex justify-between items-center text-xs">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        تغییر شماره
                                    </button>
                                    {countdown > 0 ? (
                                        <span className="text-slate-400">
                                            ارسال مجدد: <span className="font-mono text-blue-400">{formatCountdown(countdown)}</span>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            ارسال مجدد کد
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-200 text-sm flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-ocean/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : step === 'phone' ? (
                                <>
                                    <span>ارسال کد تأیید</span>
                                    <Send className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
                                </>
                            ) : (
                                <>
                                    <span>ورود به سیستم</span>
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8 font-mono">
                    Protected by Ice Center Security
                </p>
            </motion.div>
        </div>
    );
}
