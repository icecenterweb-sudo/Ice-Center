'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface CommentActionsProps {
    commentId: number;
    currentStatus: string;
}

export default function CommentActions({ commentId, currentStatus }: CommentActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const updateStatus = async (status: 'APPROVED' | 'REJECTED') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/blog/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                router.refresh();
            } else {
                const data = await response.json();
                alert(data.error || 'خطا در بروزرسانی');
            }
        } catch {
            alert('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async () => {
        if (!confirm('آیا از حذف این نظر اطمینان دارید؟')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/blog/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.refresh();
            } else {
                const data = await response.json();
                alert(data.error || 'خطا در حذف');
            }
        } catch {
            alert('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {currentStatus !== 'APPROVED' && (
                <button
                    onClick={() => updateStatus('APPROVED')}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
                    title="تایید"
                >
                    <CheckCircle className="w-4 h-4" />
                </button>
            )}
            {currentStatus !== 'REJECTED' && (
                <button
                    onClick={() => updateStatus('REJECTED')}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="رد کردن"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
            <button
                onClick={deleteComment}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                title="حذف"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </>
    );
}
