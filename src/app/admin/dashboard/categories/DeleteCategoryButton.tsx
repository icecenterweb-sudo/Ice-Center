'use client';

import { deleteCategory } from '@/app/actions/categories';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteCategoryButtonProps {
    categoryId: number;
    hasSubcategories: boolean;
}

export default function DeleteCategoryButton({ categoryId, hasSubcategories }: DeleteCategoryButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (hasSubcategories) {
            alert('این دسته‌بندی دارای زیردسته است و نمی‌توان آن را حذف کرد');
            return;
        }

        if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
            return;
        }

        try {
            await deleteCategory(categoryId);
            router.refresh();
        } catch (error: any) {
            alert(error.message || 'خطا در حذف دسته‌بندی');
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
