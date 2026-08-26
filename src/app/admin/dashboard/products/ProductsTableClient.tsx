'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Package,
    Eye,
    Edit,
    Trash2,
    AlertTriangle,
    Check,
    X,
    FolderEdit,
    Search,
    Filter,
    Power,
    PowerOff,
    CheckSquare,
    Square
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatPersianNumber, toPersianNumber } from '@/lib/persian';
import { bulkUpdateProductsAction } from '@/app/actions/products';
import DeleteProductButton from './DeleteProductButton';
import StatusBadge from '@/components/ui/StatusBadge';

interface Variant {
    id: number;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    brand: string | null;
    price: number;
    stock: number;
    inventoryStatus: string;
    isActive: boolean;
    thumbnail: string | null;
    subcategoryId: number | null;
    variants: Variant[];
    subcategory: {
        name: string;
    } | null;
}

interface CategoryWithSubcategories {
    id: number;
    name: string;
    subcategories: {
        id: number;
        name: string;
    }[];
}

interface ProductsTableClientProps {
    initialProducts: Product[];
    categories: CategoryWithSubcategories[];
}

export default function ProductsTableClient({ initialProducts, categories }: ProductsTableClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Checkbox selection states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Search and filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Subcategory change modal state
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [targetSubcategoryId, setTargetSubcategoryId] = useState<number | null>(null);

    // Bulk delete confirmation modal state
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Handle single row checkbox toggle
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Filtered products list
    const filteredProducts = useMemo(() => {
        return initialProducts.filter(product => {
            const matchesSearch = 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = 
                selectedCategory === 'all' || 
                (product.subcategoryId && product.subcategoryId === Number(selectedCategory));

            const matchesStatus = 
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && product.isActive) ||
                (selectedStatus === 'inactive' && !product.isActive);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [initialProducts, searchTerm, selectedCategory, selectedStatus]);

    // Checkbox select all/deselect all
    const handleSelectAll = () => {
        const filteredIds = filteredProducts.map(p => p.id);
        const allFilteredSelected = filteredIds.every(id => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const newSelection = [...prev];
                filteredIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id));
    const isSomeSelected = filteredProducts.length > 0 && filteredProducts.some(p => selectedIds.includes(p.id)) && !isAllSelected;

    // Perform bulk operation
    const handleBulkOperation = async (action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' | 'CHANGE_SUBCATEGORY', subId?: number) => {
        if (selectedIds.length === 0) return;

        // DELETE is confirmed through a styled modal (see showBulkDeleteConfirm) before reaching here.
        const actionLabel =
            action === 'ACTIVATE' ? 'فعال‌سازی گروهی' :
            action === 'DEACTIVATE' ? 'غیرفعال‌سازی گروهی' :
            action === 'DELETE' ? 'حذف گروهی' : 'تغییر گروهی دسته‌بندی';

        startTransition(async () => {
            const loadingToast = toast.loading(`در حال انجام ${actionLabel}...`);
            try {
                const res = await bulkUpdateProductsAction(selectedIds, action, subId);
                if (res.success) {
                    toast.success('عملیات گروهی با موفقیت انجام شد.', { id: loadingToast });
                    setSelectedIds([]);
                    setShowCategoryModal(false);
                    setShowBulkDeleteConfirm(false);
                    setTargetSubcategoryId(null);
                    router.refresh();
                } else {
                    toast.error(res.error || 'خطایی در عملیات گروهی رخ داد.', { id: loadingToast });
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                toast.error(message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید', { id: loadingToast });
            }
        });
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Filters Bar */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجوی نام محصول، کد یا برند..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-700 placeholder:text-gray-400"
                    />
                </div>

                {/* Subcategory dropdown filter */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-2xl border border-gray-200/30">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold whitespace-nowrap">فیلترها:</span>
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 text-gray-700 rounded-2xl transition-colors font-medium border-none outline-none cursor-pointer text-sm"
                    >
                        <option value="all">همه دسته‌بندی‌ها</option>
                        {categories.map((cat) => (
                            <optgroup key={cat.id} label={cat.name}>
                                {cat.subcategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 text-gray-700 rounded-2xl transition-colors font-medium border-none outline-none cursor-pointer text-sm"
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="active">فعال</option>
                        <option value="inactive">غیرفعال</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-4 py-4 w-12 text-center">
                                    <button 
                                        type="button"
                                        onClick={handleSelectAll} 
                                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare className="w-5 h-5 text-blue-600" />
                                        ) : isSomeSelected ? (
                                            <span className="inline-block w-4 h-4 bg-blue-100 border border-blue-500 rounded flex items-center justify-center">
                                                <span className="block w-2 h-0.5 bg-blue-600 rounded" />
                                            </span>
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-4 font-semibold w-14">تصویر</th>
                                <th className="px-3 py-4 font-semibold max-w-[180px]">نام محصول</th>
                                <th className="px-3 py-4 font-semibold w-34">برند / دسته</th>
                                <th className="px-3 py-4 font-semibold w-34 whitespace-nowrap">قیمت (تومان)</th>
                                <th className="px-3 py-4 font-semibold w-22">موجودی</th>
                                <th className="px-3 py-4 font-semibold w-22">واریانت</th>
                                <th className="px-3 py-4 font-semibold w-18">وضعیت</th>
                                <th className="px-4 py-4 w-24 text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                        هیچ محصولی با فیلترهای مشخص شده یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const isRowSelected = selectedIds.includes(product.id);
                                    return (
                                        <tr
                                            key={product.id}
                                            className={`group transition-colors ${
                                                isRowSelected ? 'bg-blue-50/20' : 'hover:bg-blue-50/10'
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectRow(product.id)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                                >
                                                    {isRowSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-300 group-hover:border-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                                    {product.thumbnail ? (
                                                        <Image
                                                            src={product.thumbnail}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-bold text-gray-800 text-sm truncate max-w-[220px]" title={product.name}>
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5 font-mono">{product.sku || '---'}</div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 text-sm">
                                                <div className="font-medium text-gray-700">{product.brand || '---'}</div>
                                                {product.subcategory && (
                                                    <div className="text-xs text-gray-400 mt-0.5">{product.subcategory.name}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 font-bold text-gray-800 text-sm whitespace-nowrap">
                                                {formatPersianNumber(product.price)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <StatusBadge
                                                    label={`${toPersianNumber(product.stock)} عدد`}
                                                    tone={product.stock > 5 ? 'green' : product.stock > 0 ? 'orange' : 'red'}
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                {product.variants.length > 0 ? (
                                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                        {toPersianNumber(product.variants.length)} واریانت
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium">یکپارچه</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                                        product.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-400/30' : 'bg-gray-300'
                                                    }`}></span>
                                                    <span className="text-xs text-gray-600 font-medium">
                                                        {product.isActive ? 'فعال' : 'غیرفعال'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/admin/dashboard/products/${product.id}`}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="مشاهده جزئیات"
                aria-label="مشاهده جزئیات"
                                                    >
                                                        <Eye className="w-4.5 h-4.5" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/dashboard/products/${product.id}/edit`}
                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="ویرایش محصول"
                aria-label="ویرایش محصول"
                                                    >
                                                        <Edit className="w-4.5 h-4.5" />
                                                    </Link>
                                                    <DeleteProductButton
                                                        productId={product.id}
                                                        hasVariants={product.variants.length > 0}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FLOATING BULK ACTIONS BAR */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4"
                    >
                        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md bg-opacity-95">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center bg-blue-500 text-white text-xs font-extrabold w-6 h-6 rounded-full">
                                    {toPersianNumber(selectedIds.length)}
                                </span>
                                <span className="text-sm font-bold text-slate-300">محصول انتخاب شده است</span>
                                <button 
                                    onClick={() => setSelectedIds([])}
                                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="لغو انتخاب"
                aria-label="لغو انتخاب"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                                <button
                                    onClick={() => handleBulkOperation('ACTIVATE')}
                                    disabled={isPending}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
                                >
                                    <Power className="w-4 h-4" />
                                    فعال‌سازی
                                </button>
                                <button
                                    onClick={() => handleBulkOperation('DEACTIVATE')}
                                    disabled={isPending}
                                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
                                >
                                    <PowerOff className="w-4 h-4" />
                                    غیرفعال‌سازی
                                </button>
                                <button
                                    onClick={() => setShowCategoryModal(true)}
                                    disabled={isPending}
                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
                                >
                                    <FolderEdit className="w-4 h-4" />
                                    تغییر دسته‌بندی
                                </button>
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(true)}
                                    disabled={isPending}
                                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    حذف
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SUBCATEGORY SELECT MODAL */}
            <AnimatePresence>
                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCategoryModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[80vh]"
                        >
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FolderEdit className="w-5 h-5 text-blue-600" />
                                    تغییر دسته گروهی محصولات انتخاب شده
                                </h3>
                                <button 
                                    onClick={() => setShowCategoryModal(false)} 
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="space-y-2">
                                        <div className="font-extrabold text-sm text-gray-800 bg-gray-50 px-3 py-1.5 rounded-xl">
                                            {cat.name}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pr-2">
                                            {cat.subcategories.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    onClick={() => setTargetSubcategoryId(sub.id)}
                                                    className={`px-4 py-2.5 rounded-xl border text-right text-xs font-semibold transition-all ${
                                                        targetSubcategoryId === sub.id 
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (targetSubcategoryId) {
                                            handleBulkOperation('CHANGE_SUBCATEGORY', targetSubcategoryId);
                                        }
                                    }}
                                    disabled={!targetSubcategoryId || isPending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-2xl font-bold transition-all shadow-md shadow-blue-500/10 text-sm flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    تأیید و ذخیره
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition-colors text-sm"
                                >
                                    انصراف
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* BULK DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {showBulkDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isPending && setShowBulkDeleteConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">حذف گروهی محصولات</h3>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">
                                آیا از حذف گروهی {toPersianNumber(selectedIds.length)} محصول اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkDeleteConfirm(false)}
                                    disabled={isPending}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBulkOperation('DELETE')}
                                    disabled={isPending}
                                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isPending ? 'در حال حذف...' : 'حذف گروهی'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
