'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface CommentActionsProps {
    commentId: number;
    currentStatus: string;
}

export default function CommentActions({ commentId, currentStatus }: CommentActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const updateStatus = async (status: 'APPROVED' | 'REJECTED') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/blog/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                toast.success(status === 'APPROVED' ? 'نظر تایید شد' : 'نظر رد شد');
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(data.error || 'خطا در به‌روزرسانی');
            }
        } catch {
            toast.error('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    const performDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/blog/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('نظر حذف شد');
                setShowDeleteConfirm(false);
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(data.error || 'خطا در حذف');
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
                    onClick={() => updateStatus('APPROVED')}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
                    title="تایید"
                aria-label="تایید"
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
                aria-label="رد کردن"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
            <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                title="حذف"
                aria-label="حذف"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmDialog
                open={showDeleteConfirm}
                title="حذف نظر"
                message="آیا از حذف این نظر اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف نظر"
                isPending={loading}
                onConfirm={performDelete}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}
