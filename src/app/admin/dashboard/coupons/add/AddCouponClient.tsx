'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { fieldClass } from '@/lib/form-classes';

const FIELD_BASE =
    'w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900';

type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';
type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export default function AddCouponClient() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (fieldName: string) => {
        setFieldErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    };

    // Form state
    const [code, setCode] = useState('');
    const [type, setType] = useState<CouponType>('PERCENTAGE');
    const [value, setValue] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');
    const [maxDiscount, setMaxDiscount] = useState('');
    const [status, setStatus] = useState<CouponStatus>('ACTIVE');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [perUserLimit, setPerUserLimit] = useState('1');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Client-side validation mirroring the server's couponSchema
        const newFieldErrors: Record<string, string> = {};
        if (!code.trim()) {
            newFieldErrors.code = 'کد تخفیف الزامی است';
        }
        const numValue = Number(value);
        if (!value.trim()) {
            newFieldErrors.value = 'مقدار تخفیف الزامی است';
        } else if (Number.isNaN(numValue) || numValue <= 0) {
            newFieldErrors.value = 'مقدار باید مثبت باشد';
        } else if (type === 'PERCENTAGE' && numValue > 100) {
            newFieldErrors.value = 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد';
        }
        if (minOrderAmount.trim() && (Number.isNaN(Number(minOrderAmount)) || Number(minOrderAmount) < 0)) {
            newFieldErrors.minOrderAmount = 'حداقل مبلغ باید عددی مثبت یا صفر باشد';
        }
        if (type === 'PERCENTAGE' && maxDiscount.trim() && (Number.isNaN(Number(maxDiscount)) || Number(maxDiscount) < 0)) {
            newFieldErrors.maxDiscount = 'سقف تخفیف باید عددی مثبت یا صفر باشد';
        }
        if (usageLimit.trim() && (!Number.isInteger(Number(usageLimit)) || Number(usageLimit) <= 0)) {
            newFieldErrors.usageLimit = 'سقف استفاده باید عدد صحیح مثبت باشد';
        }
        if (!Number.isInteger(Number(perUserLimit)) || Number(perUserLimit) <= 0) {
            newFieldErrors.perUserLimit = 'سقف استفاده هر کاربر باید عدد صحیح مثبت باشد';
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            toast.error('لطفاً خطاهای فرم را برطرف نمایید.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code.trim().toUpperCase(),
                    type,
                    value: numValue,
                    minOrderAmount: minOrderAmount.trim() ? Number(minOrderAmount) : null,
                    maxDiscount: type === 'PERCENTAGE' && maxDiscount.trim() ? Number(maxDiscount) : null,
                    status,
                    startDate: startDate ? new Date(startDate).toISOString() : null,
                    endDate: endDate ? new Date(endDate).toISOString() : null,
                    usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
                    perUserLimit: Number(perUserLimit),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('کد تخفیف با موفقیت ایجاد شد');
                router.push('/admin/dashboard/coupons');
            } else {
                setError(data.error || 'خطا در ایجاد کد تخفیف');
                toast.error(data.error || 'خطا در ایجاد کد تخفیف');
            }
        } catch (err) {
            console.error('Failed to create coupon:', err);
            setError('خطا در ایجاد کد تخفیف');
            toast.error('خطا در ایجاد کد تخفیف');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">افزودن کد تخفیف</h1>
                    <p className="text-gray-500 text-sm mt-1">ایجاد کد تخفیف جدید برای استفاده در صفحه پرداخت</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-6 py-4 text-sm font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main fields */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-ocean" />
                            اطلاعات کد تخفیف
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    کد تخفیف <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={code}
                                    aria-invalid={!!fieldErrors.code}
                                    aria-describedby={fieldErrors.code ? 'code-error' : undefined}
                                    onChange={(e) => {
                                        setCode(e.target.value.toUpperCase());
                                        clearFieldError('code');
                                    }}
                                    placeholder="مثال: SUMMER1405"
                                    className={fieldClass(`${FIELD_BASE} font-mono tracking-wide text-right`, !!fieldErrors.code)}
                                />
                                {fieldErrors.code && (
                                    <p id="code-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">نوع تخفیف</label>
                                <select
                                    value={type}
                                    onChange={(e) => {
                                        setType(e.target.value as CouponType);
                                        clearFieldError('value');
                                        clearFieldError('maxDiscount');
                                    }}
                                    className={FIELD_BASE}
                                >
                                    <option value="PERCENTAGE">درصدی</option>
                                    <option value="FIXED_AMOUNT">مبلغ ثابت (تومان)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {type === 'PERCENTAGE' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)'} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={value}
                                        aria-invalid={!!fieldErrors.value}
                                        aria-describedby={fieldErrors.value ? 'value-error' : undefined}
                                        onChange={(e) => {
                                            setValue(e.target.value);
                                            clearFieldError('value');
                                        }}
                                        placeholder={type === 'PERCENTAGE' ? 'مثال: ۱۵' : 'مثال: ۵۰۰۰۰۰'}
                                        className={fieldClass(`${FIELD_BASE} pl-14`, !!fieldErrors.value)}
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                        {type === 'PERCENTAGE' ? 'درصد' : 'تومان'}
                                    </span>
                                </div>
                                {fieldErrors.value && (
                                    <p id="value-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.value}</p>
                                )}
                                {type === 'PERCENTAGE' && !fieldErrors.value && (
                                    <p className="mt-1 text-xs text-gray-400">درصد باید بین ۱ تا ۱۰۰ باشد</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as CouponStatus)}
                                    className={FIELD_BASE}
                                >
                                    <option value="ACTIVE">فعال</option>
                                    <option value="INACTIVE">غیرفعال</option>
                                    <option value="EXPIRED">منقضی</option>
                                </select>
                            </div>
                        </div>

                        {type === 'PERCENTAGE' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    سقف تخفیف (تومان) — اختیاری
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={maxDiscount}
                                    aria-invalid={!!fieldErrors.maxDiscount}
                                    aria-describedby={fieldErrors.maxDiscount ? 'maxDiscount-error' : undefined}
                                    onChange={(e) => {
                                        setMaxDiscount(e.target.value);
                                        clearFieldError('maxDiscount');
                                    }}
                                    placeholder="حداکثر مبلغ تخفیف برای هر سفارش"
                                    className={fieldClass(FIELD_BASE, !!fieldErrors.maxDiscount)}
                                />
                                {fieldErrors.maxDiscount && (
                                    <p id="maxDiscount-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.maxDiscount}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-400">فقط برای کدهای درصدی کاربرد دارد</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع — اختیاری</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={FIELD_BASE}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ پایان — اختیاری</label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={FIELD_BASE}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="font-bold text-gray-800">محدودیت‌های استفاده</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                حداقل مبلغ سفارش (تومان) — اختیاری
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={minOrderAmount}
                                aria-invalid={!!fieldErrors.minOrderAmount}
                                aria-describedby={fieldErrors.minOrderAmount ? 'minOrderAmount-error' : undefined}
                                onChange={(e) => {
                                    setMinOrderAmount(e.target.value);
                                    clearFieldError('minOrderAmount');
                                }}
                                placeholder="برای همه سفارش‌ها"
                                className={fieldClass(FIELD_BASE, !!fieldErrors.minOrderAmount)}
                            />
                            {fieldErrors.minOrderAmount && (
                                <p id="minOrderAmount-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.minOrderAmount}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                سقف کل استفاده — اختیاری
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={usageLimit}
                                aria-invalid={!!fieldErrors.usageLimit}
                                aria-describedby={fieldErrors.usageLimit ? 'usageLimit-error' : undefined}
                                onChange={(e) => {
                                    setUsageLimit(e.target.value);
                                    clearFieldError('usageLimit');
                                }}
                                placeholder="نامحدود"
                                className={fieldClass(FIELD_BASE, !!fieldErrors.usageLimit)}
                            />
                            {fieldErrors.usageLimit && (
                                <p id="usageLimit-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.usageLimit}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                سقف استفاده هر کاربر
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={perUserLimit}
                                aria-invalid={!!fieldErrors.perUserLimit}
                                aria-describedby={fieldErrors.perUserLimit ? 'perUserLimit-error' : undefined}
                                onChange={(e) => {
                                    setPerUserLimit(e.target.value);
                                    clearFieldError('perUserLimit');
                                }}
                                className={fieldClass(FIELD_BASE, !!fieldErrors.perUserLimit)}
                            />
                            {fieldErrors.perUserLimit && (
                                <p id="perUserLimit-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.perUserLimit}</p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                        {isSubmitting ? 'در حال ایجاد...' : 'ایجاد کد تخفیف'}
                    </button>
                </div>
            </form>
        </div>
    );
}
