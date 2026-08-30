'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Tag, Calendar, Search, X, Plus, Percent, Banknote } from 'lucide-react';
import Image from 'next/image';
import { fieldClass } from '@/lib/form-classes';

interface Product {
    id: number;
    name: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    hasActiveOffer?: boolean;
}

export default function AddOfferPage() {
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
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
    const [discountValue, setDiscountValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isFeatured, setIsFeatured] = useState(true);
    const [priority, setPriority] = useState('0');
    const [badgeText, setBadgeText] = useState('');

    // Product selection
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [customDiscounts, setCustomDiscounts] = useState<Record<number, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // Load products
    useEffect(() => {
        async function loadProducts() {
            try {
                const res = await fetch('/api/products?limit=200');
                const data = await res.json();
                if (data.data) {
                    setProducts(data.data);
                }
            } catch (err) {
                console.error('Failed to load products:', err);
            } finally {
                setIsLoadingProducts(false);
            }
        }
        loadProducts();
    }, []);

    // Filtered products for search
    const filteredProducts = products.filter(p =>
        p.name.includes(searchQuery) &&
        !selectedProducts.find(sp => sp.id === p.id)
    );

    // Add product to selection
    const addProduct = (product: Product) => {
        setSelectedProducts(prev => [...prev, product]);
        setSearchQuery('');
    };

    // Remove product from selection
    const removeProduct = (productId: number) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
        setCustomDiscounts(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    // Update custom discount for a product
    const updateCustomDiscount = (productId: number, value: string) => {
        setCustomDiscounts(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    // Calculate preview price (uses custom discount if set, otherwise default)
    const calculatePreviewPrice = (product: Product) => {
        const basePrice = product.listPrice || product.price;
        const customValue = customDiscounts[product.id];
        const value = customValue ? parseFloat(customValue) : (parseFloat(discountValue) || 0);

        if (discountType === 'PERCENTAGE') {
            return basePrice * (1 - value / 100);
        }
        return basePrice - value;
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const newFieldErrors: Record<string, string> = {};
        if (selectedProducts.length === 0) {
            newFieldErrors.products = 'لطفاً حداقل یک محصول انتخاب کنید';
        }
        if (!discountValue || parseFloat(discountValue) <= 0) {
            newFieldErrors.discountValue = 'مقدار تخفیف باید بیشتر از صفر باشد';
        }
        if (!endDate) {
            newFieldErrors.endDate = 'تاریخ پایان الزامی است';
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            setError(Object.values(newFieldErrors)[0]);
            return;
        }

        setIsSubmitting(true);

        try {
            // Build products array with custom discounts
            const productsData = selectedProducts.map(p => ({
                productId: p.id,
                customDiscountValue: customDiscounts[p.id] ? parseFloat(customDiscounts[p.id]) : null,
            }));

            const response = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || `تخفیف ${new Date().toLocaleDateString('fa-IR')}`,
                    description,
                    discountType,
                    discountValue: parseFloat(discountValue),
                    startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    isFeatured,
                    priority: parseInt(priority) || 0,
                    badgeText: badgeText || undefined,
                    products: productsData, // Now sends products with custom discounts
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/dashboard/offers');
                router.refresh();
            } else {
                if (data.fieldErrors) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(data.fieldErrors)) {
                        if (Array.isArray(v) && v[0]) flat[k] = v[0] as string;
                        else if (typeof v === 'string') flat[k] = v;
                    }
                    setFieldErrors(flat);
                }
                setError(data.error || 'خطا در ایجاد پیشنهاد');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('خطا در ایجاد پیشنهاد');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard/offers"
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">پیشنهاد جدید</h1>
                    <p className="text-gray-500 text-sm mt-1">ایجاد تخفیف و پیشنهاد ویژه</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-ocean" />
                                اطلاعات پیشنهاد
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    نام پیشنهاد
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    aria-invalid={!!fieldErrors.name}
                                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        clearFieldError('name');
                                    }}
                                    placeholder="مثلاً: تخفیف یلدا"
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                        !!fieldErrors.name
                                    )}
                                />
                                {fieldErrors.name && (
                                    <p id="name-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    توضیحات (اختیاری)
                                </label>
                                <textarea
                                    value={description}
                                    aria-invalid={!!fieldErrors.description}
                                    aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        clearFieldError('description');
                                    }}
                                    placeholder="توضیحات داخلی برای ادمین..."
                                    rows={2}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none resize-none text-gray-900",
                                        !!fieldErrors.description
                                    )}
                                />
                                {fieldErrors.description && (
                                    <p id="description-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Discount Settings */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Percent className="w-5 h-5 text-ocean" />
                                تنظیمات تخفیف
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setDiscountType('PERCENTAGE')}
                                    className={`p-4 rounded-xl border-2 transition-all ${discountType === 'PERCENTAGE'
                                        ? 'border-ocean bg-ocean/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Percent className={`w-6 h-6 mx-auto mb-2 ${discountType === 'PERCENTAGE' ? 'text-ocean' : 'text-gray-400'}`} />
                                    <p className={`font-medium ${discountType === 'PERCENTAGE' ? 'text-ocean' : 'text-gray-600'}`}>
                                        درصدی
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDiscountType('FIXED_AMOUNT')}
                                    className={`p-4 rounded-xl border-2 transition-all ${discountType === 'FIXED_AMOUNT'
                                        ? 'border-ocean bg-ocean/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Banknote className={`w-6 h-6 mx-auto mb-2 ${discountType === 'FIXED_AMOUNT' ? 'text-ocean' : 'text-gray-400'}`} />
                                    <p className={`font-medium ${discountType === 'FIXED_AMOUNT' ? 'text-ocean' : 'text-gray-600'}`}>
                                        مبلغ ثابت
                                    </p>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    مقدار تخفیف {discountType === 'PERCENTAGE' ? '(درصد)' : '(تومان)'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={discountValue}
                                    aria-invalid={!!fieldErrors.discountValue}
                                    aria-describedby={fieldErrors.discountValue ? 'discountValue-error' : undefined}
                                    onChange={(e) => {
                                        setDiscountValue(e.target.value);
                                        clearFieldError('discountValue');
                                    }}
                                    placeholder={discountType === 'PERCENTAGE' ? 'مثلاً: 20' : 'مثلاً: 500000'}
                                    min="0"
                                    max={discountType === 'PERCENTAGE' ? '100' : undefined}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                        !!fieldErrors.discountValue
                                    )}
                                />
                                {fieldErrors.discountValue && (
                                    <p id="discountValue-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.discountValue}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    متن بج (اختیاری)
                                </label>
                                <input
                                    type="text"
                                    value={badgeText}
                                    aria-invalid={!!fieldErrors.badgeText}
                                    aria-describedby={fieldErrors.badgeText ? 'badgeText-error' : undefined}
                                    onChange={(e) => {
                                        setBadgeText(e.target.value);
                                        clearFieldError('badgeText');
                                    }}
                                    placeholder="مثلاً: ۲۰٪ تخفیف"
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                        !!fieldErrors.badgeText
                                    )}
                                />
                                {fieldErrors.badgeText && (
                                    <p id="badgeText-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.badgeText}</p>
                                )}
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-ocean" />
                                زمان‌بندی
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        تاریخ شروع
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        aria-invalid={!!fieldErrors.startDate}
                                        aria-describedby={fieldErrors.startDate ? 'startDate-error' : undefined}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            clearFieldError('startDate');
                                        }}
                                        className={fieldClass(
                                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                            !!fieldErrors.startDate
                                        )}
                                    />
                                    {fieldErrors.startDate && (
                                        <p id="startDate-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.startDate}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">خالی = همین الان</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        تاریخ پایان <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        aria-invalid={!!fieldErrors.endDate}
                                        aria-describedby={fieldErrors.endDate ? 'endDate-error' : undefined}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            clearFieldError('endDate');
                                        }}
                                        className={fieldClass(
                                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                            !!fieldErrors.endDate
                                        )}
                                    />
                                    {fieldErrors.endDate && (
                                        <p id="endDate-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.endDate}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Products Selection */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-gray-800">
                                    انتخاب محصولات <span className="text-red-500">*</span>
                                </h2>
                                {fieldErrors.products && (
                                    <p id="products-error" className="text-xs font-medium text-red-600">{fieldErrors.products}</p>
                                )}
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="جستجوی محصول..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                                />
                            </div>

                            {/* Search Results */}
                            {searchQuery && (
                                <div className="max-h-48 overflow-y-auto scrollbar-sleek border border-gray-100 rounded-xl">
                                    {isLoadingProducts ? (
                                        <p className="p-4 text-center text-gray-500">در حال بارگذاری...</p>
                                    ) : filteredProducts.length === 0 ? (
                                        <p className="p-4 text-center text-gray-500">محصولی یافت نشد</p>
                                    ) : (
                                        filteredProducts.slice(0, 10).map(product => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                onClick={() => {
                                                    if (!product.hasActiveOffer) {
                                                        addProduct(product);
                                                        clearFieldError('products');
                                                    }
                                                }}
                                                disabled={product.hasActiveOffer}
                                                className={`w-full flex items-center gap-3 p-3 text-right transition-colors ${product.hasActiveOffer
                                                    ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="relative w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {product.thumbnail ? (
                                                        <Image src={product.thumbnail} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(product.listPrice || product.price).toLocaleString('fa-IR')} تومان
                                                        {product.hasActiveOffer && (
                                                            <span className="text-red-500 mr-2">🚫 تخفیف فعال دارد</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {!product.hasActiveOffer && <Plus className="w-5 h-5 text-ocean" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Selected Products */}
                            {selectedProducts.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            {selectedProducts.length} محصول انتخاب شده
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            تخفیف سفارشی اختیاری
                                        </p>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-sleek">
                                        {selectedProducts.map(product => (
                                            <div
                                                key={product.id}
                                                className="p-3 bg-gray-50 rounded-xl space-y-2"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0">
                                                        {product.thumbnail ? (
                                                            <Image src={product.thumbnail} alt="" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-gray-400 line-through">
                                                                {(product.listPrice || product.price).toLocaleString('fa-IR')}
                                                            </span>
                                                            <span className="text-green-600 font-medium">
                                                                {Math.round(calculatePreviewPrice(product)).toLocaleString('fa-IR')} تومان
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProduct(product.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {/* Custom discount input */}
                                                <div className="flex items-center gap-2 pr-15">
                                                    <input
                                                        type="number"
                                                        value={customDiscounts[product.id] || ''}
                                                        onChange={(e) => updateCustomDiscount(product.id, e.target.value)}
                                                        placeholder={`تخفیف سفارشی ${discountType === 'PERCENTAGE' ? '(%)' : '(تومان)'}`}
                                                        min="0"
                                                        max={discountType === 'PERCENTAGE' ? 100 : undefined}
                                                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none text-gray-900"
                                                    />
                                                    {customDiscounts[product.id] && (
                                                        <span className="text-xs text-ocean bg-ocean/10 px-2 py-1 rounded-lg">
                                                            سفارشی
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Options */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800">تنظیمات</h2>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-ocean focus:ring-ocean"
                                />
                                <span className="text-sm text-gray-700">نمایش در کاروسل صفحه اصلی</span>
                            </label>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    اولویت (عدد بزرگتر = اولویت بالاتر)
                                </label>
                                <input
                                    type="number"
                                    value={priority}
                                    aria-invalid={!!fieldErrors.priority}
                                    aria-describedby={fieldErrors.priority ? 'priority-error' : undefined}
                                    onChange={(e) => {
                                        setPriority(e.target.value);
                                        clearFieldError('priority');
                                    }}
                                    min="0"
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                        !!fieldErrors.priority
                                    )}
                                />
                                {fieldErrors.priority && (
                                    <p id="priority-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.priority}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-ocean hover:bg-royal text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {isSubmitting ? 'در حال ایجاد...' : 'ایجاد پیشنهاد'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
