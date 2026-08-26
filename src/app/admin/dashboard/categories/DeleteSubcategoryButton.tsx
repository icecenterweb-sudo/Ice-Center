'use client';

import { useState } from 'react';
import { deleteSubcategory } from '@/app/actions/categories';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface DeleteSubcategoryButtonProps {
    subcategoryId: number;
}

export default function DeleteSubcategoryButton({ subcategoryId }: DeleteSubcategoryButtonProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        const t = toast.loading('در حال حذف زیردسته...');

        try {
            const res = await deleteSubcategory(subcategoryId);
            if (res.success) {
                toast.success('زیردسته با موفقیت حذف شد', { id: t });
                setShowConfirm(false);
                router.refresh();
            } else {
                toast.error(res.error || 'خطا در حذف زیردسته', { id: t });
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
                onClick={() => setShowConfirm(true)}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600 cursor-pointer"
                title="حذف زیردسته"
                aria-label="حذف زیردسته"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Shared confirmation dialog (DS6) */}
            <ConfirmDialog
                open={showConfirm}
                title="حذف زیردسته"
                message="آیا از حذف این زیردسته اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف زیردسته"
                variant="danger"
                isPending={isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
