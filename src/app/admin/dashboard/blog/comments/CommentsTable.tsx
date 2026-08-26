'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, X, MessageCircle, User, Calendar, FileText } from 'lucide-react';
import CommentActions from './CommentActions';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusTone } from '@/components/ui/StatusBadge';

const COMMENT_TONE: Record<string, StatusTone> = {
    APPROVED: 'green',
    PENDING: 'yellow',
    REJECTED: 'red',
};

interface Comment {
    id: number;
    content: string;
    authorName: string | null;
    status: string;
    createdAt: Date;
    post: { id: number; title: string; slug: string };
    user: { id: number; firstName: string | null; lastName: string | null; phone: string } | null;
    parent: { id: number; content: string } | null;
}

interface CommentsTableProps {
    comments: Comment[];
}



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

const getDisplayName = (comment: Comment) => {
    if (comment.user) {
        return `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || 'کاربر';
    }
    return comment.authorName || 'کاربر مهمان';
};

const truncateText = (text: string, wordCount: number = 5) => {
    const words = text.split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
};

export default function CommentsTable({ comments }: CommentsTableProps) {
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

    return (
        <>
            {/* Comments Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto scrollbar-sleek">
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
                                            <button
                                                onClick={() => setSelectedComment(comment)}
                                                className="text-sm text-gray-700 hover:text-ocean transition-colors text-right"
                                            >
                                                {truncateText(comment.content, 5)}
                                            </button>
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
                                            <StatusBadge
                                                label={getStatusLabel(comment.status)}
                                                tone={COMMENT_TONE[comment.status] ?? 'gray'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(comment.createdAt).toLocaleDateString('fa-IR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setSelectedComment(comment)}
                                                    className="p-2 text-gray-500 hover:text-ocean transition-colors"
                                                    title="مشاهده کامل"
                aria-label="مشاهده کامل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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

            {/* Comment Detail Dialog */}
            {selectedComment && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedComment(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto scrollbar-sleek shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">جزئیات نظر</h3>
                            <button
                                onClick={() => setSelectedComment(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Dialog Content */}
                        <div className="p-6 space-y-4">
                            {/* Author Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ocean/10 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-ocean" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">
                                        {getDisplayName(selectedComment)}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(selectedComment.createdAt).toLocaleDateString('fa-IR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">وضعیت:</span>
                                <StatusBadge
                                    label={getStatusLabel(selectedComment.status)}
                                    tone={COMMENT_TONE[selectedComment.status] ?? 'gray'}
                                />
                            </div>

                            {/* Post Link */}
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">پست:</span>
                                <Link
                                    href={`/blog/${selectedComment.post.slug}`}
                                    target="_blank"
                                    className="text-sm text-ocean hover:underline"
                                >
                                    {selectedComment.post.title}
                                </Link>
                            </div>

                            {/* Parent Comment */}
                            {selectedComment.parent && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="text-xs text-gray-500 mb-2">پاسخ به:</div>
                                    <p className="text-sm text-gray-700">{selectedComment.parent.content}</p>
                                </div>
                            )}

                            {/* Full Comment Content */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="text-xs text-gray-500 mb-2">متن نظر:</div>
                                <p className="text-gray-800 leading-7 whitespace-pre-wrap">
                                    {selectedComment.content}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <CommentActions
                                        commentId={selectedComment.id}
                                        currentStatus={selectedComment.status}
                                    />
                                </div>
                                <button
                                    onClick={() => setSelectedComment(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    بستن
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
