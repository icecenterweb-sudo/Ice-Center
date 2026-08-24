'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewActionsProps {
    reviewId: number;
    currentStatus: string;
}

export default function ReviewActions({ reviewId, currentStatus }: ReviewActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const moderate = async (action: 'APPROVED' | 'REJECTED') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                toast.success(action === 'APPROVED' ? 'نقد تایید شد' : 'نقد رد شد');
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(data.error || 'خطا در بروزرسانی');
            }
        } catch {
            toast.error('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {currentStatus !== 'APPROVED' && (
                <button
                    onClick={() => moderate('APPROVED')}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
                    title="تایید"
                >
                    <CheckCircle className="w-4 h-4" />
                </button>
            )}
            {currentStatus !== 'REJECTED' && (
                <button
                    onClick={() => moderate('REJECTED')}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="رد کردن"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </>
    );
}
