'use client';

import { deleteProduct } from '@/app/actions/products';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteProductButtonProps {
    productId: number;
    hasVariants: boolean;
}

export default function DeleteProductButton({ productId, hasVariants }: DeleteProductButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (hasVariants) {
            alert('این محصول دارای واریانت است. ابتدا واریانت‌ها را حذف کنید');
            return;
        }

        if (!confirm('آیا از حذف این محصول اطمینان دارید؟')) {
            return;
        }

        try {
            await deleteProduct(productId);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert(message || 'خطا در حذف محصول');
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="حذف محصول"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
