'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface DeleteCouponButtonProps {
    couponId: number;
    couponCode: string;
    /** Optional callback fired after a successful delete so client-fetched lists can update immediately. */
    onDeleted?: () => void;
}

export default function DeleteCouponButton({ couponId, couponCode, onDeleted }: DeleteCouponButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const performDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/coupons/${couponId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast.success('کد تخفیف با موفقیت حذف شد');
                setShowConfirm(false);
                // router.refresh() alone is not enough here: the list lives in a
                // client component's state (fetched via useEffect), and refresh()
                // only re-renders server components. Update local state too.
                onDeleted?.();
                router.refresh();
            } else {
                toast.error(data.error || 'خطا در حذف کد تخفیف');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('خطا در حذف کد تخفیف');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmDialog
                open={showConfirm}
                title="حذف کد تخفیف"
                message={`آیا از حذف کد تخفیف «${couponCode}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
                confirmText="حذف کد"
                isPending={isDeleting}
                onConfirm={performDelete}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
