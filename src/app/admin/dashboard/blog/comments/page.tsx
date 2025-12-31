import { prisma } from '@/lib/db';
import Link from 'next/link';
import { MessageCircle, CheckCircle, XCircle, Clock, Eye, ArrowLeft } from 'lucide-react';
import CommentActions from './CommentActions';

export const dynamic = 'force-dynamic';

async function getComments() {
    return prisma.blogComment.findMany({
        include: {
            post: { select: { id: true, title: true, slug: true } },
            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
            parent: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function getStats() {
    const [total, pending, approved, rejected] = await Promise.all([
        prisma.blogComment.count(),
        prisma.blogComment.count({ where: { status: 'PENDING' } }),
        prisma.blogComment.count({ where: { status: 'APPROVED' } }),
        prisma.blogComment.count({ where: { status: 'REJECTED' } }),
    ]);
    return { total, pending, approved, rejected };
}

export default async function AdminCommentsPage() {
    const [comments, stats] = await Promise.all([getComments(), getStats()]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'تایید شده';
            case 'PENDING':
                return 'در انتظار';
            case 'REJECTED':
                return 'رد شده';
            default:
                return status;
        }
    };

    const getDisplayName = (comment: { user: { firstName: string | null; lastName: string | null } | null; authorName: string | null }) => {
        if (comment.user) {
            return `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || 'کاربر';
        }
        return comment.authorName || 'کاربر مهمان';
    };

    return (
        <div className="p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/dashboard/blog"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">مدیریت نظرات بلاگ</h1>
                        <p className="text-gray-500 text-sm mt-1">تایید، رد و مدیریت نظرات کاربران</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <MessageCircle className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                            <div className="text-sm text-gray-500">کل نظرات</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-gray-500">در انتظار تایید</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                            <div className="text-sm text-gray-500">تایید شده</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-sm text-gray-500">رد شده</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    نویسنده
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    متن نظر
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    پست
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    وضعیت
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    تاریخ
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                                    عملیات
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {comments.length > 0 ? (
                                comments.map((comment) => (
                                    <tr
                                        key={comment.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800">
                                                {getDisplayName(comment)}
                                            </div>
                                            {comment.parent && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    پاسخ به نظر #{comment.parent.id}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                                                {comment.content}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/blog/${comment.post.slug}`}
                                                target="_blank"
                                                className="text-sm text-ocean hover:underline line-clamp-1"
                                            >
                                                {comment.post.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(
                                                    comment.status
                                                )}`}
                                            >
                                                {getStatusLabel(comment.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(comment.createdAt).toLocaleDateString('fa-IR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={`/blog/${comment.post.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-500 hover:text-ocean transition-colors"
                                                    title="مشاهده پست"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <CommentActions
                                                    commentId={comment.id}
                                                    currentStatus={comment.status}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        هنوز نظری ثبت نشده است.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
