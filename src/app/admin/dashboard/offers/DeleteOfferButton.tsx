'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface DeleteOfferButtonProps {
    offerId: number;
    offerName: string;
}

export default function DeleteOfferButton({ offerId, offerName }: DeleteOfferButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const performDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/offers/${offerId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast.success('پیشنهاد با موفقیت حذف شد');
                setShowConfirm(false);
                router.refresh();
            } else {
                toast.error(data.error || 'خطا در حذف پیشنهاد');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('خطا در حذف پیشنهاد');
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
                title="حذف پیشنهاد"
                message={`آیا از حذف پیشنهاد «${offerName}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
                confirmText="حذف پیشنهاد"
                isPending={isDeleting}
                onConfirm={performDelete}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
