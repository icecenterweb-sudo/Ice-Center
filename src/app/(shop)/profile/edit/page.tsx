'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toPersianDigits } from '@/lib/numbers';
import toast from 'react-hot-toast';

export default function ProfileEditPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Populate form with user data
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim() && !lastName.trim()) {
            toast.error('لطفاً حداقل یک فیلد را پر کنید');
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('پروفایل با موفقیت بروزرسانی شد');
                await refreshUser();
                router.push('/profile');
            } else {
                toast.error(data.error || 'خطا در بروزرسانی پروفایل');
            }
        } catch {
            toast.error('خطا در برقراری ارتباط');
        } finally {
            setIsSaving(false);
        }
    };

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
                    <h1 className="text-sm font-bold text-gray-800">ویرایش پروفایل</h1>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">ویرایش پروفایل</h1>
                <p className="text-sm text-gray-500 mt-1">اطلاعات حساب کاربری خود را ویرایش کنید</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-ocean to-blue-400 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Phone (Read-only) */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-xs text-gray-500 mb-2">شماره موبایل</label>
                    <div className="text-sm text-gray-400" dir="ltr">
                        {user?.phone ? toPersianDigits(user.phone) : ''}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                        شماره موبایل قابل تغییر نیست
                    </p>
                </div>

                {/* First Name */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label htmlFor="firstName" className="block text-xs text-gray-500 mb-2">
                        نام
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="نام خود را وارد کنید"
                        className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
                        maxLength={50}
                    />
                </div>

                {/* Last Name */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label htmlFor="lastName" className="block text-xs text-gray-500 mb-2">
                        نام خانوادگی
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="نام خانوادگی خود را وارد کنید"
                        className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
                        maxLength={50}
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-ocean hover:bg-blue-600 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            <span>ذخیره تغییرات</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
