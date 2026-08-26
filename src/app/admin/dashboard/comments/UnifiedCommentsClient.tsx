'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MessageSquare,
    Package,
    FileText,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
    Eye,
    Search,
    User,
    Calendar,
    Phone,
    X,
    ExternalLink,
    CornerDownLeft,
    CheckCheck,
    Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
    COMMENT_TONE,
    getCommentStatusLabel
} from '@/lib/comments-status';
import { toPersianNumber } from '@/lib/persian';

export type CommentType = 'PRODUCT_REVIEW' | 'BLOG_COMMENT';
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UnifiedComment {
    id: number;
    type: CommentType;
    status: CommentStatus;
    content: string;
    title: string | null;
    rating?: number | null;
    adminNote?: string | null;
    createdAt: string; // ISO string
    targetId: number;
    targetName: string;
    targetSlug: string;
    user: {
        id?: number | null;
        name: string;
        phone?: string | null;
    } | null;
    parent?: {
        id: number;
        content: string;
    } | null;
}

interface StatsSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    productReviewsCount: number;
    blogCommentsCount: number;
}

interface UnifiedCommentsClientProps {
    initialComments: UnifiedComment[];
    stats: StatsSummary;
}

export default function UnifiedCommentsClient({
    initialComments,
    stats,
}: UnifiedCommentsClientProps) {
    const router = useRouter();
    const [typeFilter, setTypeFilter] = useState<'ALL' | CommentType>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | CommentStatus>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedComment, setSelectedComment] = useState<UnifiedComment | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<UnifiedComment | null>(null);

    // Filter comments
    const filteredComments = useMemo(() => {
        return initialComments.filter((item) => {
            if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
            if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const contentMatch = item.content.toLowerCase().includes(q);
                const titleMatch = item.title ? item.title.toLowerCase().includes(q) : false;
                const targetMatch = item.targetName.toLowerCase().includes(q);
                const authorMatch = item.user?.name.toLowerCase().includes(q);
                const phoneMatch = item.user?.phone ? item.user.phone.includes(q) : false;
                if (!contentMatch && !titleMatch && !targetMatch && !authorMatch && !phoneMatch) {
                    return false;
                }
            }
            return true;
        });
    }, [initialComments, typeFilter, statusFilter, searchQuery]);

    // Handle Review Moderation
    const handleModerateReview = async (
        reviewId: number,
        action: 'APPROVED' | 'REJECTED',
        note?: string
    ) => {
        setActionLoading(true);
        const toastId = toast.loading('در حال به‌روزرسانی نظر...');
        try {
            const res = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, adminNote: note }),
            });

            if (res.ok) {
                toast.success(action === 'APPROVED' ? 'نقد محصول تایید شد' : 'نقد محصول رد شد', {
                    id: toastId,
                });
                setSelectedComment(null);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطا در بررسی نقد', { id: toastId });
            }
        } catch {
            toast.error('خطا در برقراری ارتباط با سرور', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Blog Comment Moderation
    const handleModerateBlogComment = async (
        commentId: number,
        status: 'APPROVED' | 'REJECTED'
    ) => {
        setActionLoading(true);
        const toastId = toast.loading('در حال به‌روزرسانی نظر...');
        try {
            const res = await fetch(`/api/admin/blog/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                toast.success(status === 'APPROVED' ? 'نظر بلاگ تایید شد' : 'نظر بلاگ رد شد', {
                    id: toastId,
                });
                setSelectedComment(null);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطا در به‌روزرسانی نظر', { id: toastId });
            }
        } catch {
            toast.error('خطا در برقراری ارتباط با سرور', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Blog Comment Delete
    const handleDeleteBlogComment = async () => {
        if (!commentToDelete) return;
        setActionLoading(true);
        const toastId = toast.loading('در حال حذف نظر...');
        try {
            const res = await fetch(`/api/admin/blog/comments/${commentToDelete.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('نظر با موفقیت حذف شد', { id: toastId });
                setDeleteConfirmOpen(false);
                setCommentToDelete(null);
                setSelectedComment(null);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطا در حذف نظر', { id: toastId });
            }
        } catch {
            toast.error('خطا در اتصال به سرور', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    const openDetailsModal = (comment: UnifiedComment) => {
        setSelectedComment(comment);
        setAdminNote(comment.adminNote || '');
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
                        <MessageSquare className="w-7 h-7 text-ocean" />
                        مدیریت جامع نظرات و دیدگاه‌ها
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        مرکز یکپارچه بررسی، تایید و پاسخ‌دهی به نظرات محصولات و مقالات بلاگ
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 bg-blue-50 text-ocean rounded-xl shrink-0">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">
                            {toPersianNumber(stats.total)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                            کل دیدگاه‌ها ({toPersianNumber(stats.productReviewsCount)} کالا / {toPersianNumber(stats.blogCommentsCount)} بلاگ)
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4.5 border border-amber-100 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-amber-600">
                            {toPersianNumber(stats.pending)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                            در انتظار بررسی ادمین
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4.5 border border-emerald-100 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-emerald-600">
                            {toPersianNumber(stats.approved)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                            منتشر شده و تایید شده
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4.5 border border-rose-100 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-rose-600">
                            {toPersianNumber(stats.rejected)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                            رد شده یا نامناسب
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar & Tabs */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                {/* Top Section: Type Tabs + Search */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    {/* Primary Type Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl overflow-x-auto scrollbar-none min-w-0">
                        <button
                            type="button"
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                typeFilter === 'ALL'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            همه نظرات ({toPersianNumber(initialComments.length)})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('PRODUCT_REVIEW')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                typeFilter === 'PRODUCT_REVIEW'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Package className="w-3.5 h-3.5 text-blue-500" />
                            نظرات محصولات ({toPersianNumber(stats.productReviewsCount)})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('BLOG_COMMENT')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                typeFilter === 'BLOG_COMMENT'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            نظرات بلاگ ({toPersianNumber(stats.blogCommentsCount)})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="جستجو در متن، نام، کالا، موبایل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-ocean outline-none text-xs placeholder:text-gray-400 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Bottom Section: Status Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none min-w-0 pt-1 border-t border-gray-100">
                    <Filter className="w-3.5 h-3.5 text-gray-400 ml-1 shrink-0" />
                    <button
                        type="button"
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            statusFilter === 'ALL'
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/40'
                        }`}
                    >
                        همه وضعیت‌ها
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            statusFilter === 'PENDING'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/40'
                        }`}
                    >
                        <Clock className="w-3 h-3" />
                        در انتظار بررسی ({toPersianNumber(stats.pending)})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('APPROVED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            statusFilter === 'APPROVED'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/40'
                        }`}
                    >
                        <CheckCircle className="w-3 h-3" />
                        تایید شده ({toPersianNumber(stats.approved)})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('REJECTED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            statusFilter === 'REJECTED'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/40'
                        }`}
                    >
                        <XCircle className="w-3 h-3" />
                        رد شده ({toPersianNumber(stats.rejected)})
                    </button>
                </div>
            </div>

            {/* Comments Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto min-w-0">
                    <table className="w-full text-xs text-right">
                        <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4">نوع</th>
                                <th className="px-5 py-4">منبع / کالا یا مقاله</th>
                                <th className="px-5 py-4">نویسنده</th>
                                <th className="px-5 py-4 min-w-[280px]">متن و جزئیات</th>
                                <th className="px-5 py-4 text-center">وضعیت</th>
                                <th className="px-5 py-4">تاریخ ثبت</th>
                                <th className="px-5 py-4 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredComments.length > 0 ? (
                                filteredComments.map((item) => {
                                    const isProduct = item.type === 'PRODUCT_REVIEW';
                                    return (
                                        <tr
                                            key={`${item.type}-${item.id}`}
                                            className="hover:bg-blue-50/20 transition-colors group"
                                        >
                                            {/* Type Badge */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {isProduct ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/40">
                                                        <Package className="w-3 h-3 text-blue-600" />
                                                        کالا
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/40">
                                                        <FileText className="w-3 h-3 text-emerald-600" />
                                                        بلاگ
                                                    </span>
                                                )}
                                            </td>

                                            {/* Target Item */}
                                            <td className="px-5 py-4 max-w-[200px]">
                                                <Link
                                                    href={
                                                        isProduct
                                                            ? `/products/${item.targetSlug}`
                                                            : `/blog/${item.targetSlug}`
                                                    }
                                                    target="_blank"
                                                    className="font-bold text-gray-800 hover:text-ocean line-clamp-2 transition-colors flex items-start gap-1"
                                                    title={item.targetName}
                                                >
                                                    <span>{item.targetName}</span>
                                                    <ExternalLink className="w-3 h-3 text-gray-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </td>

                                            {/* Author */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                                        {item.user?.name || 'کاربر مهمان'}
                                                    </div>
                                                    {item.user?.phone && (
                                                        <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                                                            <Phone className="w-3 h-3 text-gray-400" />
                                                            {toPersianNumber(item.user.phone)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Content & Details */}
                                            <td className="px-5 py-4">
                                                <div className="space-y-1">
                                                    {isProduct && item.rating && item.rating > 0 && (
                                                        <div className="flex items-center gap-1 text-amber-500">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-3.5 h-3.5 ${
                                                                        i < (item.rating || 0)
                                                                            ? 'fill-amber-400 text-amber-400'
                                                                            : 'text-gray-200'
                                                                    }`}
                                                                />
                                                            ))}
                                                            <span className="text-[11px] font-bold text-gray-600 mr-1">
                                                                ({toPersianNumber(item.rating)})
                                                            </span>
                                                        </div>
                                                    )}

                                                    {item.parent && (
                                                        <div className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md w-fit">
                                                            <CornerDownLeft className="w-3 h-3" />
                                                            <span>پاسخ به نظر دیگر</span>
                                                        </div>
                                                    )}

                                                    {item.title && (
                                                        <div className="font-bold text-gray-900 text-xs">
                                                            {item.title}
                                                        </div>
                                                    )}

                                                    <p className="text-gray-600 line-clamp-2 leading-relaxed">
                                                        {item.content}
                                                    </p>

                                                    {item.adminNote && (
                                                        <div className="text-[11px] text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100 w-fit">
                                                            یادداشت ادمین: {item.adminNote}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 text-center whitespace-nowrap">
                                                <StatusBadge
                                                    label={getCommentStatusLabel(item.status)}
                                                    tone={COMMENT_TONE[item.status]}
                                                />
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 whitespace-nowrap text-gray-500">
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Quick Approve */}
                                                    {item.status !== 'APPROVED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                isProduct
                                                                    ? handleModerateReview(item.id, 'APPROVED')
                                                                    : handleModerateBlogComment(item.id, 'APPROVED')
                                                            }
                                                            disabled={actionLoading}
                                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="تایید سریع"
                                                            aria-label="تایید سریع"
                                                        >
                                                            <CheckCheck className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Quick Reject */}
                                                    {item.status !== 'REJECTED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                isProduct
                                                                    ? handleModerateReview(item.id, 'REJECTED')
                                                                    : handleModerateBlogComment(item.id, 'REJECTED')
                                                            }
                                                            disabled={actionLoading}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="رد نظر"
                                                            aria-label="رد نظر"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Details / Review Modal */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetailsModal(item)}
                                                        className="p-1.5 text-gray-400 hover:text-ocean hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="مشاهده جزئیات و بررسی کامل"
                                                        aria-label="مشاهده جزئیات و بررسی کامل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete (Blog comment only) */}
                                                    {!isProduct && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCommentToDelete(item);
                                                                setDeleteConfirmOpen(true);
                                                            }}
                                                            disabled={actionLoading}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="حذف دائمی"
                                                            aria-label="حذف دائمی"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        هیچ نظری با مشخصات انتخابی یافت نشد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Comment Detail / Moderation Modal */}
            {selectedComment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-2.5">
                                {selectedComment.type === 'PRODUCT_REVIEW' ? (
                                    <Package className="w-5 h-5 text-blue-600" />
                                ) : (
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                )}
                                <h3 className="font-bold text-gray-900 text-sm">
                                    بررسی نظر {selectedComment.type === 'PRODUCT_REVIEW' ? 'محصول' : 'مقاله بلاگ'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedComment(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            {/* Target Item */}
                            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-gray-400 font-medium block text-[11px]">مربوط به:</span>
                                    <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                                        {selectedComment.targetName}
                                    </span>
                                </div>
                                <Link
                                    href={
                                        selectedComment.type === 'PRODUCT_REVIEW'
                                            ? `/products/${selectedComment.targetSlug}`
                                            : `/blog/${selectedComment.targetSlug}`
                                    }
                                    target="_blank"
                                    className="p-2 text-ocean hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                                    title="مشاهده در سایت"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Author Info & Rating */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 block text-[11px]">نویسنده:</span>
                                    <span className="font-bold text-gray-800 mt-0.5 block">
                                        {selectedComment.user?.name || 'کاربر مهمان'}
                                    </span>
                                    {selectedComment.user?.phone && (
                                        <span className="text-gray-500 font-mono text-[11px] block mt-0.5">
                                            {toPersianNumber(selectedComment.user.phone)}
                                        </span>
                                    )}
                                </div>

                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 block text-[11px]">وضعیت فعلی:</span>
                                    <div className="mt-1">
                                        <StatusBadge
                                            label={getCommentStatusLabel(selectedComment.status)}
                                            tone={COMMENT_TONE[selectedComment.status]}
                                        />
                                    </div>
                                    {selectedComment.type === 'PRODUCT_REVIEW' && selectedComment.rating && (
                                        <div className="flex items-center gap-1 text-amber-500 mt-1.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${
                                                        i < (selectedComment.rating || 0)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-gray-200'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Parent Comment (If Reply) */}
                            {selectedComment.parent && (
                                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/50">
                                    <span className="text-amber-800 font-bold block mb-1 flex items-center gap-1 text-[11px]">
                                        <CornerDownLeft className="w-3.5 h-3.5" />
                                        پاسخ به نظر:
                                    </span>
                                    <p className="text-amber-900/80 leading-relaxed text-xs">
                                        {selectedComment.parent.content}
                                    </p>
                                </div>
                            )}

                            {/* Comment Title & Content */}
                            <div className="p-4 bg-white rounded-2xl border border-gray-200/70 space-y-2">
                                {selectedComment.title && (
                                    <div className="font-extrabold text-gray-900 text-sm pb-1.5 border-b border-gray-100">
                                        {selectedComment.title}
                                    </div>
                                )}
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs">
                                    {selectedComment.content}
                                </p>
                            </div>

                            {/* Admin Note (Product Reviews) */}
                            {selectedComment.type === 'PRODUCT_REVIEW' && (
                                <div className="space-y-1.5">
                                    <label className="font-bold text-gray-700 block text-xs">
                                        یادداشت ادمین (اختیاری):
                                    </label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="توضیحات داخلی یا دلیل تایید/رد نقد..."
                                        rows={2}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-ocean outline-none text-xs"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-wrap gap-2.5 justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedComment(null)}
                                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition-colors"
                            >
                                بستن
                            </button>

                            {selectedComment.status !== 'REJECTED' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        selectedComment.type === 'PRODUCT_REVIEW'
                                            ? handleModerateReview(selectedComment.id, 'REJECTED', adminNote)
                                            : handleModerateBlogComment(selectedComment.id, 'REJECTED')
                                    }
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    رد نظر
                                </button>
                            )}

                            {selectedComment.status !== 'APPROVED' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        selectedComment.type === 'PRODUCT_REVIEW'
                                            ? handleModerateReview(selectedComment.id, 'APPROVED', adminNote)
                                            : handleModerateBlogComment(selectedComment.id, 'APPROVED')
                                    }
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    تایید و انتشار
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog (for blog comments) */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="حذف دائمی نظر"
                message="آیا از حذف این نظر بلاگ اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
                confirmText="حذف نظر"
                isPending={actionLoading}
                onConfirm={handleDeleteBlogComment}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setCommentToDelete(null);
                }}
            />
        </div>
    );
}
