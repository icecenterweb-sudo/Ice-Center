'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toPersianDigits } from '@/lib/persian';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema using Zod
const profileSchema = z.object({
    firstName: z.string().max(50, 'نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
    lastName: z.string().max(50, 'نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
}).refine(data => data.firstName.trim() || data.lastName.trim(), {
    message: 'لطفاً حداقل یک فیلد را پر کنید',
    path: ['firstName'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
        },
    });

    // Populate form with user data when loaded
    useEffect(() => {
        if (user) {
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('پروفایل با موفقیت بروزرسانی شد');
                await refreshUser();
                router.push('/profile');
            } else {
                toast.error(result.error || 'خطا در بروزرسانی پروفایل');
            }
        } catch {
            toast.error('خطا در برقراری ارتباط');
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Phone (Read-only) */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-xs text-gray-500 mb-2">شماره موبایل</label>
                    <div className="text-sm text-gray-500" dir="ltr">
                        {user?.phone ? toPersianDigits(user.phone) : ''}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
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
                        {...register('firstName')}
                        placeholder="نام خود را وارد کنید"
                        className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
                    />
                    {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                </div>

                {/* Last Name */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label htmlFor="lastName" className="block text-xs text-gray-500 mb-2">
                        نام خانوادگی
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        {...register('lastName')}
                        placeholder="نام خانوادگی خود را وارد کنید"
                        className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
                    />
                    {errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-ocean hover:bg-blue-600 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
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

