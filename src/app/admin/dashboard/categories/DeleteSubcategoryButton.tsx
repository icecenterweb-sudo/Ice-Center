'use client';

import { deleteSubcategory } from '@/app/actions/categories';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteSubcategoryButtonProps {
    subcategoryId: number;
}

export default function DeleteSubcategoryButton({ subcategoryId }: DeleteSubcategoryButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('آیا از حذف این زیردسته اطمینان دارید؟')) {
            return;
        }

        try {
            await deleteSubcategory(subcategoryId);
            router.refresh();
        } catch (error: any) {
            alert(error.message || 'خطا در حذف زیردسته');
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-100 rounded text-red-600"
        >
            <Trash2 className="w-3 h-3" />
        </button>
    );
}
