'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Tag, Calendar, Search, X, Plus, Percent, Banknote, Loader2 } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    hasActiveOffer?: boolean;
}

interface OfferProduct {
    product: Product;
    customDiscountValue: number | null;
}

interface Offer {
    id: number;
    name: string;
    description: string | null;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isFeatured: boolean;
    priority: number;
    badgeText: string | null;
    products: OfferProduct[];
}

export default function EditOfferClient({ id }: { id: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
    const [discountValue, setDiscountValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(true);
    const [priority, setPriority] = useState('0');
    const [badgeText, setBadgeText] = useState('');

    // Product selection
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [customDiscounts, setCustomDiscounts] = useState<Record<number, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // Load offer data
    useEffect(() => {
        async function loadOffer() {
            try {
                const res = await fetch(`/api/offers/${id}`);
                const data = await res.json();

                if (data.success && data.offer) {
                    const offer: Offer = data.offer;
                    setName(offer.name);
                    setDescription(offer.description || '');
                    setDiscountType(offer.discountType);
                    setDiscountValue(offer.discountValue.toString());
                    setStartDate(new Date(offer.startDate).toISOString().slice(0, 16));
                    setEndDate(new Date(offer.endDate).toISOString().slice(0, 16));
                    setIsActive(offer.isActive);
                    setIsFeatured(offer.isFeatured);
                    setPriority(offer.priority.toString());
                    setBadgeText(offer.badgeText || '');
                    setSelectedProducts(offer.products.map(p => p.product));
                    const discounts: Record<number, string> = {};
                    offer.products.forEach(p => {
                        if (p.customDiscountValue !== null) {
                            discounts[p.product.id] = p.customDiscountValue.toString();
                        }
                    });
                    setCustomDiscounts(discounts);
                } else {
                    setError('پیشنهاد یافت نشد');
                }
            } catch (err) {
                console.error('Failed to load offer:', err);
                setError('خطا در بارگذاری اطلاعات');
            } finally {
                setIsLoading(false);
            }
        }
        loadOffer();
    }, [id]);

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

    const filteredProducts = products.filter(p =>
        p.name.includes(searchQuery) &&
        !selectedProducts.find(sp => sp.id === p.id)
    );

    const addProduct = (product: Product) => {
        setSelectedProducts(prev => [...prev, product]);
        setSearchQuery('');
    };

    const removeProduct = (productId: number) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
        setCustomDiscounts(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const updateCustomDiscount = (productId: number, value: string) => {
        setCustomDiscounts(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    const calculatePreviewPrice = (product: Product) => {
        const basePrice = product.listPrice || product.price;
        const customValue = customDiscounts[product.id];
        const value = customValue ? parseFloat(customValue) : (parseFloat(discountValue) || 0);

        if (discountType === 'PERCENTAGE') {
            return basePrice * (1 - value / 100);
        }
        return basePrice - value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedProducts.length === 0) {
            setError('لطفاً حداقل یک محصول انتخاب کنید');
            return;
        }

        setIsSubmitting(true);

        try {
            const productsData = selectedProducts.map(p => ({
                productId: p.id,
                customDiscountValue: customDiscounts[p.id] ? parseFloat(customDiscounts[p.id]) : null,
            }));

            const response = await fetch(`/api/offers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    discountType,
                    discountValue: parseFloat(discountValue),
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    isActive,
                    isFeatured,
                    priority: parseInt(priority) || 0,
                    badgeText: badgeText || null,
                    products: productsData,
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/dashboard/offers');
                router.refresh();
            } else {
                setError(data.error || 'خطا در بروزرسانی پیشنهاد');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('خطا در بروزرسانی پیشنهاد');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-ocean animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard/offers" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">ویرایش پیشنهاد</h1>
                    <p className="text-gray-500 text-sm mt-1">{name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl">{error}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-ocean" />
                                اطلاعات پیشنهاد
                            </h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">نام پیشنهاد</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none resize-none text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Percent className="w-5 h-5 text-ocean" />
                                تنظیمات تخفیف
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setDiscountType('PERCENTAGE')}
                                    className={`p-4 rounded-xl border-2 transition-all ${discountType === 'PERCENTAGE' ? 'border-ocean bg-ocean/5' : 'border-gray-200'}`}
                                >
                                    <Percent className={`w-6 h-6 mx-auto mb-2 ${discountType === 'PERCENTAGE' ? 'text-ocean' : 'text-gray-400'}`} />
                                    <p className={`font-medium ${discountType === 'PERCENTAGE' ? 'text-ocean' : 'text-gray-600'}`}>درصدی</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDiscountType('FIXED_AMOUNT')}
                                    className={`p-4 rounded-xl border-2 transition-all ${discountType === 'FIXED_AMOUNT' ? 'border-ocean bg-ocean/5' : 'border-gray-200'}`}
                                >
                                    <Banknote className={`w-6 h-6 mx-auto mb-2 ${discountType === 'FIXED_AMOUNT' ? 'text-ocean' : 'text-gray-400'}`} />
                                    <p className={`font-medium ${discountType === 'FIXED_AMOUNT' ? 'text-ocean' : 'text-gray-600'}`}>مبلغ ثابت</p>
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    مقدار تخفیف {discountType === 'PERCENTAGE' ? '(درصد)' : '(تومان)'}
                                </label>
                                <input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    min="0"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">متن بج</label>
                                <input
                                    type="text"
                                    value={badgeText}
                                    onChange={(e) => setBadgeText(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-ocean" />
                                زمان‌بندی
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع</label>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ پایان</label>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800">محصولات</h2>
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="جستجوی محصول..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                />
                            </div>

                            {searchQuery && (
                                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl">
                                    {filteredProducts.slice(0, 10).map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => !product.hasActiveOffer && addProduct(product)}
                                            disabled={product.hasActiveOffer}
                                            className={`w-full flex items-center gap-3 p-3 text-right transition-colors ${product.hasActiveOffer ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                                {product.thumbnail ? (
                                                    <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(product.listPrice || product.price).toLocaleString('fa-IR')} تومان
                                                </p>
                                            </div>
                                            {!product.hasActiveOffer && <Plus className="w-5 h-5 text-ocean" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedProducts.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">{selectedProducts.length} محصول انتخاب شده</p>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {selectedProducts.map(product => (
                                            <div key={product.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden">
                                                        {product.thumbnail ? (
                                                            <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
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
                                                    <button type="button" onClick={() => removeProduct(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={customDiscounts[product.id] || ''}
                                                        onChange={(e) => updateCustomDiscount(product.id, e.target.value)}
                                                        placeholder={`تخفیف سفارشی ${discountType === 'PERCENTAGE' ? '(%)' : '(تومان)'}`}
                                                        min="0"
                                                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-900"
                                                    />
                                                    {customDiscounts[product.id] && (
                                                        <span className="text-xs text-ocean bg-ocean/10 px-2 py-1 rounded-lg">سفارشی</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h2 className="font-bold text-gray-800">تنظیمات</h2>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-ocean"
                                />
                                <span className="text-sm text-gray-700">فعال</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-ocean"
                                />
                                <span className="text-sm text-gray-700">نمایش در کاروسل</span>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اولویت</label>
                                <input
                                    type="number"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    min="0"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none text-gray-900"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white px-6 py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
                        >
                            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
