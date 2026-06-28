'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Reply, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentUser {
    id: number;
    firstName: string | null;
    lastName: string | null;
}

interface Comment {
    id: number;
    content: string;
    authorName: string | null;
    user: CommentUser | null;
    createdAt: string;
    replies: Comment[];
}

interface BlogCommentSectionProps {
    postId: number;
}

interface CommentFormData {
    authorName: string;
    authorEmail: string;
    content: string;
}

interface CommentFormProps {
    parentId?: number;
    onCancel?: () => void;
    onSubmit: (e: React.FormEvent, parentId?: number) => void;
    formData: CommentFormData;
    setFormData: (data: CommentFormData) => void;
    submitting: boolean;
}

// Extracted CommentForm Component
const CommentForm = ({ parentId, onCancel, onSubmit, formData, setFormData, submitting }: CommentFormProps) => (
    <form onSubmit={(e) => onSubmit(e, parentId)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
                type="text"
                placeholder="نام شما (اختیاری)"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent bg-white text-gray-900"
            />
            <input
                type="email"
                placeholder="ایمیل شما (اختیاری)"
                value={formData.authorEmail}
                onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent bg-white text-gray-900"
            />
        </div>
        <textarea
            placeholder="نظر خود را بنویسید..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent resize-none bg-white text-gray-900"
        />
        <div className="flex gap-3">
            <button
                type="submit"
                disabled={submitting || !formData.content.trim()}
                className="flex items-center gap-2 bg-ocean hover:bg-royal text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-4 h-4" />
                {submitting ? 'در حال ارسال...' : 'ارسال نظر'}
            </button>
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    انصراف
                </button>
            )}
        </div>
    </form>
);

// Helper functions (moved outside or kept inside if simple)
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const getDisplayName = (comment: Comment) => {
    if (comment.user) {
        return `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || 'کاربر';
    }
    return comment.authorName || 'کاربر مهمان';
};

interface CommentItemProps {
    comment: Comment;
    isReply?: boolean;
    replyingTo: number | null;
    setReplyingTo: (id: number | null) => void;
    formData: CommentFormData;
    setFormData: (data: CommentFormData) => void;
    handleSubmit: (e: React.FormEvent, parentId?: number) => void;
    submitting: boolean;
}

// Extracted CommentItem Component
const CommentItem = ({
    comment,
    isReply = false,
    replyingTo,
    setReplyingTo,
    formData,
    setFormData,
    handleSubmit,
    submitting
}: CommentItemProps) => (
    <div className={`${isReply ? 'mr-8 border-r-2 border-gray-200 pr-4' : ''}`}>
        <div className={`bg-white rounded-xl p-4 ${isReply ? 'bg-gray-50' : 'border border-gray-200'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-ocean/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-ocean" />
                    </div>
                    <div>
                        <span className="font-medium text-gray-800">{getDisplayName(comment)}</span>
                        <span className="text-xs text-gray-500 mr-2">{formatDate(comment.createdAt)}</span>
                    </div>
                </div>
                {!isReply && (
                    <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-ocean transition-colors"
                    >
                        <Reply className="w-4 h-4" />
                        پاسخ
                    </button>
                )}
            </div>

            {/* Content */}
            <p className="text-gray-700 leading-7">{comment.content}</p>

            {/* Reply Form */}
            {replyingTo === comment.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <CommentForm
                        parentId={comment.id}
                        onCancel={() => setReplyingTo(null)}
                        onSubmit={handleSubmit}
                        formData={formData}
                        setFormData={setFormData}
                        submitting={submitting}
                    />
                </div>
            )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
                {comment.replies.map((reply) => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        formData={formData}
                        setFormData={setFormData}
                        handleSubmit={handleSubmit}
                        submitting={submitting}
                    />
                ))}
            </div>
        )}
    </div>
);

export default function BlogCommentSection({ postId }: BlogCommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        authorName: '',
        authorEmail: '',
        content: '',
    });

    // Fetch comments
    useEffect(() => {
        async function fetchComments() {
            try {
                const response = await fetch(`/api/blog/comments?postId=${postId}`);
                const data = await response.json();
                if (data.comments) {
                    setComments(data.comments);
                }
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchComments();
    }, [postId]);

    // Submit comment
    const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/blog/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    content: formData.content,
                    authorName: formData.authorName || undefined,
                    authorEmail: formData.authorEmail || undefined,
                    parentId: parentId || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: data.message });
                setFormData({ authorName: '', authorEmail: '', content: '' });
                setReplyingTo(null);
                setShowForm(false);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch {
            setMessage({ type: 'error', text: 'خطا در ارسال نظر' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-12 pt-8 border-t border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-ocean" />
                    <h3 className="text-xl font-bold text-gray-800">
                        نظرات ({comments.length})
                    </h3>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 text-ocean hover:text-royal transition-colors"
                >
                    {showForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    {showForm ? 'بستن فرم' : 'ثبت نظر جدید'}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-xl mb-6 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* New Comment Form */}
            {showForm && (
                <div className="bg-frost rounded-xl p-6 mb-8">
                    <h4 className="font-medium text-gray-800 mb-4">ثبت نظر جدید</h4>
                    <CommentForm
                        onSubmit={handleSubmit}
                        formData={formData}
                        setFormData={setFormData}
                        submitting={submitting}
                    />
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">هنوز نظری ثبت نشده است.</p>
                    <p className="text-gray-400 text-sm mt-1">اولین نفری باشید که نظر می‌دهد!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            formData={formData}
                            setFormData={setFormData}
                            handleSubmit={handleSubmit}
                            submitting={submitting}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
