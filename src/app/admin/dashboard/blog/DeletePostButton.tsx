'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface DeletePostButtonProps {
    slug: string;
}

export default function DeletePostButton({ slug }: DeletePostButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const performDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/blog/${slug}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('پست با موفقیت حذف شد');
                setShowConfirm(false);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطا در حذف پست');
            }
        } catch (error) {
            console.error('Failed to delete blog post:', error);
            toast.error('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="حذف پست"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
            </button>

            <ConfirmDialog
                open={showConfirm}
                title="حذف پست"
                message="آیا از حذف این پست اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف پست"
                isPending={loading}
                onConfirm={performDelete}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
