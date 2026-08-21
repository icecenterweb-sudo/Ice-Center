'use client';

import { useState } from 'react';
import { deleteProduct } from '@/app/actions/products';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface DeleteProductButtonProps {
    productId: number;
    hasVariants: boolean;
}

export default function DeleteProductButton({ productId, hasVariants }: DeleteProductButtonProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = () => {
        if (hasVariants) {
            toast.error('این محصول دارای واریانت است. ابتدا واریانت‌ها را حذف کنید');
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        const t = toast.loading('در حال حذف محصول...');

        try {
            const res = await deleteProduct(productId);
            if (res.success) {
                toast.success('محصول با موفقیت حذف شد', { id: t });
                setShowConfirm(false);
                router.refresh();
            } else {
                toast.error(res.error || 'خطا در حذف محصول', { id: t });
            }
        } catch {
            toast.error('خطای غیرمنتظره در حذف محصول رخ داد', { id: t });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="حذف محصول"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Custom RTL Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" dir="rtl">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scaleUp">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">حذف محصول</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            آیا از حذف این محصول اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? 'در حال حذف...' : 'حذف محصول'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
