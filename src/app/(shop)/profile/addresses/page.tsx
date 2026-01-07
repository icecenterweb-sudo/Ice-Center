'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Address {
    id: number;
    city: string;
    province: string | null;
    address: string;
    postalCode: string | null;
    isDefault: boolean;
}

export default function AddressesPage() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await fetch('/api/user/addresses');
            if (response.ok) {
                const data = await response.json();
                setAddresses(data.addresses || []);
            }
        } catch {
            toast.error('خطا در دریافت آدرس‌ها');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('آیا از حذف این آدرس اطمینان دارید؟')) return;

        setDeletingId(id);
        try {
            const response = await fetch(`/api/user/addresses/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAddresses(addresses.filter(a => a.id !== id));
                toast.success('آدرس حذف شد');
            } else {
                toast.error('خطا در حذف آدرس');
            }
        } catch {
            toast.error('خطا در برقراری ارتباط');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            const response = await fetch(`/api/user/addresses/${id}/default`, {
                method: 'PUT',
            });

            if (response.ok) {
                setAddresses(addresses.map(a => ({
                    ...a,
                    isDefault: a.id === id
                })));
                toast.success('آدرس پیش‌فرض تغییر کرد');
            }
        } catch {
            toast.error('خطا در برقراری ارتباط');
        }
    };

    return (
        <div className="pb-20 lg:pb-0">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <ArrowRight className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-sm font-bold text-gray-800">آدرس‌های من</h1>
                    </div>
                    <button
                        onClick={() => router.push('/profile/addresses/new')}
                        className="w-10 h-10 bg-ocean hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">آدرس‌های من</h1>
                    <p className="text-sm text-gray-500 mt-1">مدیریت آدرس‌های ارسال سفارش</p>
                </div>
                <button
                    onClick={() => router.push('/profile/addresses/new')}
                    className="flex items-center gap-2 bg-ocean hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-medium">افزودن آدرس</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-ocean animate-spin" />
                </div>
            ) : addresses.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800 mb-2">
                        آدرسی ثبت نشده است
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">
                        برای تکمیل سفارش‌ها، آدرس خود را اضافه کنید
                    </p>
                    <button
                        onClick={() => router.push('/profile/addresses/new')}
                        className="inline-flex items-center gap-2 bg-ocean hover:bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        افزودن آدرس
                    </button>
                </div>
            ) : (
                /* Address List */
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${address.isDefault ? 'border-ocean' : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${address.isDefault ? 'bg-ocean' : 'bg-gray-100'
                                    }`}>
                                    <MapPin className={`w-5 h-5 ${address.isDefault ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-800">
                                            {address.city}
                                            {address.province && ` - ${address.province}`}
                                        </span>
                                        {address.isDefault && (
                                            <span className="text-[10px] bg-ocean/10 text-ocean px-2 py-0.5 rounded-full font-medium">
                                                پیش‌فرض
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {address.address}
                                    </p>
                                    {address.postalCode && (
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            کد پستی: {address.postalCode}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                {!address.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(address.id)}
                                        className="flex items-center gap-1.5 text-xs text-ocean hover:text-blue-600 font-medium"
                                    >
                                        <Check className="w-4 h-4" />
                                        تنظیم به عنوان پیش‌فرض
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(address.id)}
                                    disabled={deletingId === address.id}
                                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium mr-auto disabled:opacity-50"
                                >
                                    {deletingId === address.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    حذف
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
