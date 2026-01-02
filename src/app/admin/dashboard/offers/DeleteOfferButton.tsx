'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteOfferButtonProps {
    offerId: number;
    offerName: string;
}

export default function DeleteOfferButton({ offerId, offerName }: DeleteOfferButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`آیا از حذف پیشنهاد "${offerName}" اطمینان دارید؟`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/offers/${offerId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                router.refresh();
            } else {
                alert(data.error || 'خطا در حذف پیشنهاد');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('خطا در حذف پیشنهاد');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
