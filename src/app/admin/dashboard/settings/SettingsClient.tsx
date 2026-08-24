'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings as SettingsIcon,
    Globe,
    Phone,
    Share2,
    Save,
    Image as ImageIcon,
    Loader2,
    Sparkles,
    Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
import MediaGalleryModal from '@/components/admin/MediaGalleryModal';

export default function SettingsClient() {
    const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'social'>('branding');

    // Media picker modal state
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'siteLogo' | 'faviconUrl' | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings) {
                        setSettings(data.settings);
                    }
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
                toast.error('خطا در دریافت تنظیمات');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (key: keyof SiteSettings, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            if (res.ok) {
                toast.success('تنظیمات عمومی سایت با موفقیت ذخیره شد');
            } else {
                toast.error('خطا در ذخیره‌سازی تنظیمات');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('خطا در ارتباط با سرور');
        } finally {
            setSaving(false);
        }
    };

    const openMediaModal = (target: 'siteLogo' | 'faviconUrl') => {
        setMediaTarget(target);
        setMediaModalOpen(true);
    };

    const handleSelectMedia = (url: string) => {
        if (mediaTarget) {
            handleChange(mediaTarget, url);
        }
        setMediaModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-gray-500">در حال بارگذاری تنظیمات عمومی...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none" dir="rtl">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">تنظیمات عمومی سایت</h1>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            مدیریت برند، عنوان، لوگو، فاوآیکون، تلفن پشتیبانی، ایمیل، آدرس و شبکه‌های اجتماعی
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>در حال ذخیره...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>ذخیره تغییرات</span>
                        </>
                    )}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                        activeTab === 'branding'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    <span>هویت و برندینگ (هدر و فاوآیکون)</span>
                </button>

                <button
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                        activeTab === 'contact'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Phone className="w-4 h-4" />
                    <span>اطلاعات تماس و پابرگ (فوتر)</span>
                </button>

                <button
                    onClick={() => setActiveTab('social')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                        activeTab === 'social'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Share2 className="w-4 h-4" />
                    <span>شبکه‌های اجتماعی و بنر اطلاع‌رسانی</span>
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-6">
                {/* TAB 1: BRANDING */}
                {activeTab === 'branding' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6"
                    >
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 text-slate-800">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-bold">نام، شعار و نشان تجاری (هدر و لوگو)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Site Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">عنوان اصلی سایت (Header & Tabs)</label>
                                <input
                                    type="text"
                                    value={settings.siteTitle}
                                    onChange={(e) => handleChange('siteTitle', e.target.value)}
                                    placeholder="مثال: آیس سنتر"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Site Slogan */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">شعار زیر لوگوی سایت</label>
                                <input
                                    type="text"
                                    value={settings.siteSlogan}
                                    onChange={(e) => handleChange('siteSlogan', e.target.value)}
                                    placeholder="مثال: با آیس سنتر، همیشه تخصصی بخر"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            {/* Site Logo */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">آدرس تصوير لوگوی اختصاصی (اختیاری)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={settings.siteLogo}
                                        onChange={(e) => handleChange('siteLogo', e.target.value)}
                                        placeholder="مثال: /images/logo.png"
                                        className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all dir-ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openMediaModal('siteLogo')}
                                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>گالری</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5">اگر خالی باشد، آیکون دانه‌ی برف آیس سنتر نمایش داده می‌شود.</p>
                            </div>

                            {/* Favicon URL */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">آدرس فاوآیکون مرورگر (Favicon URL)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={settings.faviconUrl}
                                        onChange={(e) => handleChange('faviconUrl', e.target.value)}
                                        placeholder="مثال: /favicon.ico"
                                        className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all dir-ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openMediaModal('faviconUrl')}
                                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>گالری</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5">آیکونی که در تب‌های مرورگر قرار می‌گیرد.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: CONTACT & FOOTER */}
                {activeTab === 'contact' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6"
                    >
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 text-slate-800">
                            <Phone className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold">اطلاعات تماس، آدرس و پابرگ سایت (Footer)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">شماره تلفن (دیجیتال / عددی)</label>
                                <input
                                    type="text"
                                    value={settings.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="مثال: 09122248917"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-right dir-ltr"
                                />
                            </div>

                            {/* Formatted Phone */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">نمایش شماره تلفن (با خط تیره)</label>
                                <input
                                    type="text"
                                    value={settings.phoneFormatted}
                                    onChange={(e) => handleChange('phoneFormatted', e.target.value)}
                                    placeholder="مثال: ۰۹۱۲-۲۲۴-۸۹۱۷"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">پست الکترونیکی (ایمیل)</label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="مثال: icecenter.web@gmail.com"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all dir-ltr"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            {/* Address */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">آدرس نمایشگاه و دفتر مرکزی</label>
                                <input
                                    type="text"
                                    value={settings.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="مثال: تهران، چهاردانگه، ماهر ۲۱"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                                />
                            </div>

                            {/* Working Hours */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">ساعات کاری</label>
                                <input
                                    type="text"
                                    value={settings.workingHours}
                                    onChange={(e) => handleChange('workingHours', e.target.value)}
                                    placeholder="مثال: شنبه تا چهارشنبه ۹ الی ۱۸ | پنجشنبه ۹ الی ۱۴"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                                />
                            </div>
                        </div>

                        {/* About Text in Footer */}
                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-700 mb-2">متن معرفی کوتاه در پابرگ (Footer About)</label>
                            <textarea
                                rows={3}
                                value={settings.aboutText}
                                onChange={(e) => handleChange('aboutText', e.target.value)}
                                placeholder="معرفی کوتاه برند آیس سنتر در فوتر..."
                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none text-right"
                            />
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: SOCIAL & ANNOUNCEMENTS */}
                {activeTab === 'social' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6"
                    >
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 text-slate-800">
                            <Share2 className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold">شبکه‌های اجتماعی و پیام اطلاع‌رسانی</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Instagram */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">لینک اینستاگرام</label>
                                <input
                                    type="text"
                                    value={settings.instagramUrl}
                                    onChange={(e) => handleChange('instagramUrl', e.target.value)}
                                    placeholder="مثال: https://instagram.com/icecenter"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all dir-ltr"
                                />
                            </div>

                            {/* Telegram */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">لینک تلگرام</label>
                                <input
                                    type="text"
                                    value={settings.telegramUrl}
                                    onChange={(e) => handleChange('telegramUrl', e.target.value)}
                                    placeholder="مثال: https://t.me/icecenter"
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all dir-ltr"
                                />
                            </div>
                        </div>

                        {/* Top Announcement Bar */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Megaphone className="w-4 h-4 text-orange-500" />
                                <label className="block text-xs font-bold text-gray-700">متن اطلاعیه بالای سایت (Top Announcement Bar)</label>
                            </div>
                            <input
                                type="text"
                                value={settings.announcementText}
                                onChange={(e) => handleChange('announcementText', e.target.value)}
                                placeholder="مثال: ارسال رایگان خریدهای بالای ۱۰ میلیون تومان به سراسر کشور"
                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">اگر پر شود، به صورت نوار اطلاع‌رسانی برجسته در بالاطرین بخش هدر سایت نمایش داده می‌شود.</p>
                        </div>
                    </motion.div>
                )}
            </form>

            {/* Media Gallery Modal */}
            <MediaGalleryModal
                isOpen={mediaModalOpen}
                onClose={() => setMediaModalOpen(false)}
                onSelect={(url) => handleSelectMedia(url)}
            />
        </div>
    );
}
