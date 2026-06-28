'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { createProductVariant, updateProductVariant, deleteProductVariant } from '@/app/actions/products';
import { useRouter } from 'next/navigation';

interface Variant {
    id: number;
    name: string;
    sku: string | null;
    capacity: string | null;
    phase: number | null;
    voltage: string | null;
    price: number;
    stock: number;
    isDefault: boolean;
    isActive: boolean;
}

interface VariantManagerProps {
    productId: number;
    variants: Variant[];
}

export default function VariantManager({ productId, variants: initialVariants }: VariantManagerProps) {
    const router = useRouter();
    const [variants, setVariants] = useState(initialVariants);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleDelete = async (variantId: number) => {
        if (!confirm('آیا از حذف این واریانت اطمینان دارید؟')) return;

        try {
            await deleteProductVariant(variantId);
            setVariants(variants.filter(v => v.id !== variantId));
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert(message || 'خطا در حذف واریانت');
        }
    };

    const handleSubmitNew = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            await createProductVariant(productId, formData);
            setIsAdding(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert(message || 'خطا در ایجاد واریانت');
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>, variantId: number) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            await updateProductVariant(variantId, formData);
            setEditingId(null);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert(message || 'خطا در ویرایش واریانت');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">واریانت‌های محصول</h2>
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-bold"
                >
                    <Plus className="w-4 h-4" />
                    افزودن واریانت
                </button>
            </div>

            <div className="space-y-3">
                {/* Add New Variant Form */}
                {isAdding && (
                    <form onSubmit={handleSubmitNew} className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800">واریانت جدید</h3>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">نام واریانت *</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="مثال: ۲۰ کیلوگرم - سه فاز"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                <input
                                    name="sku"
                                    type="text"
                                    placeholder="ALBORZ-BF-20KG"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">ظرفیت</label>
                                <input
                                    name="capacity"
                                    type="text"
                                    placeholder="20kg"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">فاز</label>
                                <select
                                    name="phase"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="">انتخاب کنید</option>
                                    <option value="1">تک فاز</option>
                                    <option value="3">سه فاز</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">ولتاژ</label>
                                <input
                                    name="voltage"
                                    type="text"
                                    placeholder="220V یا 380V"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">قیمت (تومان) *</label>
                                <input
                                    name="price"
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">موجودی</label>
                                <input
                                    name="stock"
                                    type="number"
                                    min="0"
                                    defaultValue="0"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="isDefault" value="true" className="w-4 h-4" />
                                <span className="text-sm text-gray-700">واریانت پیش‌فرض</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="isActive" value="true" defaultChecked className="w-4 h-4" />
                                <span className="text-sm text-gray-700">فعال</span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold"
                        >
                            <Save className="w-4 h-4" />
                            ذخیره واریانت
                        </button>
                    </form>
                )}

                {/* Existing Variants */}
                {variants.map((variant) => (
                    <div key={variant.id}>
                        {editingId === variant.id ? (
                            <form onSubmit={(e) => handleSubmitEdit(e, variant.id)} className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-800">ویرایش واریانت</h3>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="p-1 hover:bg-orange-100 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">نام واریانت *</label>
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            defaultValue={variant.name}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                        <input
                                            name="sku"
                                            type="text"
                                            defaultValue={variant.sku || ''}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">ظرفیت</label>
                                        <input
                                            name="capacity"
                                            type="text"
                                            defaultValue={variant.capacity || ''}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">فاز</label>
                                        <select
                                            name="phase"
                                            defaultValue={variant.phase || ''}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        >
                                            <option value="">انتخاب کنید</option>
                                            <option value="1">تک فاز</option>
                                            <option value="3">سه فاز</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">ولتاژ</label>
                                        <input
                                            name="voltage"
                                            type="text"
                                            defaultValue={variant.voltage || ''}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">قیمت (تومان) *</label>
                                        <input
                                            name="price"
                                            type="number"
                                            required
                                            min="0"
                                            step="1000"
                                            defaultValue={variant.price}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">موجودی</label>
                                        <input
                                            name="stock"
                                            type="number"
                                            min="0"
                                            defaultValue={variant.stock}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="isDefault" value="true" defaultChecked={variant.isDefault} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700">واریانت پیش‌فرض</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="isActive" value="true" defaultChecked={variant.isActive} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700">فعال</span>
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-bold"
                                >
                                    <Save className="w-4 h-4" />
                                    ذخیره تغییرات
                                </button>
                            </form>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800">{variant.name}</h3>
                                        {variant.isDefault && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">پیش‌فرض</span>
                                        )}
                                        {!variant.isActive && (
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded">غیرفعال</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {variant.capacity && <span>ظرفیت: {variant.capacity}</span>}
                                        {variant.phase && <span className="mr-3">فاز: {variant.phase}</span>}
                                        {variant.voltage && <span className="mr-3">ولتاژ: {variant.voltage}</span>}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        قیمت: {new Intl.NumberFormat('fa-IR').format(variant.price)} تومان • موجودی: {variant.stock} عدد
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(variant.id)}
                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="ویرایش"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(variant.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {variants.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-500">
                        <p>هنوز واریانتی ثبت نشده است</p>
                        <p className="text-sm mt-1">برای افزودن واریانت روی دکمه بالا کلیک کنید</p>
                    </div>
                )}
            </div>
        </div>
    );
}
