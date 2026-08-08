'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, CheckCircle2, Phone, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface InstallmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstallmentModal({ isOpen, onClose }: InstallmentModalProps) {
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            toast.error('لطفاً شماره همراه معتبر وارد کنید');
            return;
        }
        setSubmitted(true);
        toast.success('شماره شما با موفقیت جهت اطلاع‌رسانی خرید اقساطی ثبت شد');
    };

    const handleClose = () => {
        setSubmitted(false);
        setPhone('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 z-10"
                    >
                        {/* Header Gradient Top Banner */}
                        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                <CreditCard size={32} className="text-white" />
                            </div>

                            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-2">
                                <Clock size={12} className="animate-spin" />
                                <span>به‌زودی...</span>
                            </span>

                            <h3 className="text-xl font-black text-white">خرید اقساطی آیس سنتر</h3>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 space-y-4 text-center">
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                امکان خرید اقساطی و شرایطی انواع تجهیزات برودتی، بستنی‌ساز، فالوده‌ساز و اسپرسوسازهای صنعتی <strong className="text-gray-900">به‌زودی</strong> در آیس سنتر فراهم خواهد شد.
                            </p>

                            {!submitted ? (
                                <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                                    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-right">
                                        <label className="block text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-amber-600" />
                                            <span>مایلم از فعال‌سازی شرایط اقساطی مطلع شوم:</span>
                                        </label>

                                        <div className="relative">
                                            <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full pr-9 pl-3 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-left dir-ltr"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles size={16} />
                                        <span>اطلاع‌رسانی هنگام فعال‌سازی</span>
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 space-y-2">
                                    <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                                    <h4 className="font-bold text-sm">شماره شما با موفقیت ثبت شد</h4>
                                    <p className="text-xs text-emerald-700">
                                        به محض فعال‌سازی طرح خرید اقساطی، پیامک اطلاع‌رسانی برای شما ارسال خواهد شد.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleClose}
                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                            >
                                متوجه شدم
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
