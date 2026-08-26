'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { createProductVariant, updateProductVariant, deleteProductVariant } from '@/app/actions/products';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fieldClass } from '@/lib/form-classes';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

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
    variants?: Variant[];
    initialVariants?: Variant[];
}

export default function VariantManager({ productId, variants: propVariants, initialVariants }: VariantManagerProps) {
    const router = useRouter();
    const [variants, setVariants] = useState<Variant[]>(propVariants ?? initialVariants ?? []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [addErrors, setAddErrors] = useState<Record<string, string>>({});
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const clearAddError = (field: string) => {
        if (addErrors[field]) {
            setAddErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const clearEditError = (field: string) => {
        if (editErrors[field]) {
            setEditErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const performDelete = async () => {
        if (!deletingVariant) return;
        const variantId = deletingVariant.id;
        setIsDeleting(true);
        const t = toast.loading('در حال حذف واریانت...');
        try {
            const res = await deleteProductVariant(variantId);
            if (res.success) {
                toast.success('واریانت با موفقیت حذف شد', { id: t });
                setVariants(variants.filter(v => v.id !== variantId));
                setDeletingVariant(null);
                router.refresh();
            } else {
                toast.error(res.error || 'خطا در حذف واریانت', { id: t });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'خطای غیرمنتظره رخ داد';
            toast.error(message, { id: t });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmitNew = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAddErrors({});
        const formData = new FormData(e.currentTarget);
        const t = toast.loading('در حال ایجاد واریانت...');

        try {
            const res = await createProductVariant(productId, formData);
            if (res.success) {
                toast.success('واریانت با موفقیت ایجاد شد', { id: t });
                setIsAdding(false);
                router.refresh();
            } else {
                if (res.fieldErrors) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(res.fieldErrors)) {
                        if (Array.isArray(v) && v[0]) flat[k] = v[0] as string;
                        else if (typeof v === 'string') flat[k] = v;
                    }
                    setAddErrors(flat);
                }
                toast.error(res.error || 'خطا در ایجاد واریانت', { id: t });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'خطای غیرمنتظره رخ داد';
            toast.error(message, { id: t });
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>, variantId: number) => {
        e.preventDefault();
        setEditErrors({});
        const formData = new FormData(e.currentTarget);
        const t = toast.loading('در حال ذخیره تغییرات واریانت...');

        try {
            const res = await updateProductVariant(variantId, formData);
            if (res.success) {
                toast.success('واریانت با موفقیت به‌روزرسانی شد', { id: t });
                setEditingId(null);
                router.refresh();
            } else {
                if (res.fieldErrors) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(res.fieldErrors)) {
                        if (Array.isArray(v) && v[0]) flat[k] = v[0] as string;
                        else if (typeof v === 'string') flat[k] = v;
                    }
                    setEditErrors(flat);
                }
                toast.error(res.error || 'خطا در ویرایش واریانت', { id: t });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'خطای غیرمنتظره رخ داد';
            toast.error(message, { id: t });
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">واریانت‌های محصول</h2>
                <button
                    type="button"
                    onClick={() => {
                        setAddErrors({});
                        setIsAdding(true);
                    }}
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
                                <label className="block text-xs font-medium text-gray-700 mb-1">نام واریانت <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="مثال: ۲۰ کیلوگرم - سه فاز"
                                    aria-invalid={!!addErrors.name}
                                    aria-describedby={addErrors.name ? 'new-variant-name-error' : undefined}
                                    onChange={() => clearAddError('name')}
                                    className={fieldClass(
                                        "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300",
                                        !!addErrors.name
                                    )}
                                />
                                {addErrors.name && (
                                    <p id="new-variant-name-error" className="text-xs font-medium text-red-600 mt-1">{addErrors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                <input
                                    name="sku"
                                    type="text"
                                    placeholder="ALBORZ-BF-20KG"
                                    aria-invalid={!!addErrors.sku}
                                    aria-describedby={addErrors.sku ? 'new-variant-sku-error' : undefined}
                                    onChange={() => clearAddError('sku')}
                                    className={fieldClass(
                                        "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300",
                                        !!addErrors.sku
                                    )}
                                />
                                {addErrors.sku && (
                                    <p id="new-variant-sku-error" className="text-xs font-medium text-red-600 mt-1">{addErrors.sku}</p>
                                )}
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
                                <label className="block text-xs font-medium text-gray-700 mb-1">قیمت (تومان) <span className="text-red-500">*</span></label>
                                <input
                                    name="price"
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    placeholder="0"
                                    aria-invalid={!!addErrors.price}
                                    aria-describedby={addErrors.price ? 'new-variant-price-error' : undefined}
                                    onChange={() => clearAddError('price')}
                                    className={fieldClass(
                                        "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300",
                                        !!addErrors.price
                                    )}
                                />
                                {addErrors.price && (
                                    <p id="new-variant-price-error" className="text-xs font-medium text-red-600 mt-1">{addErrors.price}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">موجودی</label>
                                <input
                                    name="stock"
                                    type="number"
                                    min="0"
                                    defaultValue="0"
                                    aria-invalid={!!addErrors.stock}
                                    aria-describedby={addErrors.stock ? 'new-variant-stock-error' : undefined}
                                    onChange={() => clearAddError('stock')}
                                    className={fieldClass(
                                        "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300",
                                        !!addErrors.stock
                                    )}
                                />
                                {addErrors.stock && (
                                    <p id="new-variant-stock-error" className="text-xs font-medium text-red-600 mt-1">{addErrors.stock}</p>
                                )}
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
                                        <label className="block text-xs font-medium text-gray-700 mb-1">نام واریانت <span className="text-red-500">*</span></label>
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            defaultValue={variant.name}
                                            aria-invalid={!!editErrors.name}
                                            aria-describedby={editErrors.name ? `edit-variant-name-error-${variant.id}` : undefined}
                                            onChange={() => clearEditError('name')}
                                            className={fieldClass(
                                                "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300",
                                                !!editErrors.name
                                            )}
                                        />
                                        {editErrors.name && (
                                            <p id={`edit-variant-name-error-${variant.id}`} className="text-xs font-medium text-red-600 mt-1">{editErrors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                        <input
                                            name="sku"
                                            type="text"
                                            defaultValue={variant.sku || ''}
                                            aria-invalid={!!editErrors.sku}
                                            aria-describedby={editErrors.sku ? `edit-variant-sku-error-${variant.id}` : undefined}
                                            onChange={() => clearEditError('sku')}
                                            className={fieldClass(
                                                "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300",
                                                !!editErrors.sku
                                            )}
                                        />
                                        {editErrors.sku && (
                                            <p id={`edit-variant-sku-error-${variant.id}`} className="text-xs font-medium text-red-600 mt-1">{editErrors.sku}</p>
                                        )}
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
                                        <label className="block text-xs font-medium text-gray-700 mb-1">قیمت (تومان) <span className="text-red-500">*</span></label>
                                        <input
                                            name="price"
                                            type="number"
                                            required
                                            min="0"
                                            step="1000"
                                            defaultValue={variant.price}
                                            aria-invalid={!!editErrors.price}
                                            aria-describedby={editErrors.price ? `edit-variant-price-error-${variant.id}` : undefined}
                                            onChange={() => clearEditError('price')}
                                            className={fieldClass(
                                                "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300",
                                                !!editErrors.price
                                            )}
                                        />
                                        {editErrors.price && (
                                            <p id={`edit-variant-price-error-${variant.id}`} className="text-xs font-medium text-red-600 mt-1">{editErrors.price}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">موجودی</label>
                                        <input
                                            name="stock"
                                            type="number"
                                            min="0"
                                            defaultValue={variant.stock}
                                            aria-invalid={!!editErrors.stock}
                                            aria-describedby={editErrors.stock ? `edit-variant-stock-error-${variant.id}` : undefined}
                                            onChange={() => clearEditError('stock')}
                                            className={fieldClass(
                                                "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300",
                                                !!editErrors.stock
                                            )}
                                        />
                                        {editErrors.stock && (
                                            <p id={`edit-variant-stock-error-${variant.id}`} className="text-xs font-medium text-red-600 mt-1">{editErrors.stock}</p>
                                        )}
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
                                        onClick={() => setDeletingVariant(variant)}
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

            {/* Shared confirmation dialog (DS6) */}
            <ConfirmDialog
                open={deletingVariant !== null}
                title="حذف واریانت"
                message={`آیا از حذف واریانت «${deletingVariant?.name ?? ''}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
                confirmText="حذف واریانت"
                variant="danger"
                isPending={isDeleting}
                onConfirm={performDelete}
                onClose={() => setDeletingVariant(null)}
            />
        </div>
    );
}
