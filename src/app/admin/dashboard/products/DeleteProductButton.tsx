'use client';

import { useState } from 'react';
import { deleteProduct } from '@/app/actions/products';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

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
                aria-label="حذف محصول"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Shared confirmation dialog (DS6) */}
            <ConfirmDialog
                open={showConfirm}
                title="حذف محصول"
                message="آیا از حذف این محصول اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف محصول"
                variant="danger"
                isPending={isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
