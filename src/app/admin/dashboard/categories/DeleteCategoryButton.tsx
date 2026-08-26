'use client';

import { useState } from 'react';
import { deleteCategory } from '@/app/actions/categories';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface DeleteCategoryButtonProps {
    categoryId: number;
    hasSubcategories: boolean;
}

export default function DeleteCategoryButton({ categoryId, hasSubcategories }: DeleteCategoryButtonProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = () => {
        if (hasSubcategories) {
            toast.error('این دسته‌بندی دارای زیردسته است و نمی‌توان آن را حذف کرد');
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        const t = toast.loading('در حال حذف دسته‌بندی...');

        try {
            const res = await deleteCategory(categoryId);
            if (res.success) {
                toast.success('دسته‌بندی با موفقیت حذف شد', { id: t });
                setShowConfirm(false);
                router.refresh();
            } else {
                toast.error(res.error || 'خطا در حذف دسته‌بندی', { id: t });
            }
        } catch {
            toast.error('خطای غیرمنتظره رخ داد', { id: t });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 cursor-pointer"
                title="حذف دسته‌بندی"
                aria-label="حذف دسته‌بندی"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Shared confirmation dialog (DS6) */}
            <ConfirmDialog
                open={showConfirm}
                title="حذف دسته‌بندی"
                message="آیا از حذف این دسته‌بندی اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف دسته‌بندی"
                variant="danger"
                isPending={isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
