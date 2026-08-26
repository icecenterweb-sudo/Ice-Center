import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'بلاگ' };

import Link from 'next/link';
import { Plus, Edit, Eye, MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import DeletePostButton from './DeletePostButton';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusTone } from '@/components/ui/StatusBadge';

const POST_TONE: Record<string, StatusTone> = {
    PUBLISHED: 'green',
    DRAFT: 'gray',
    SCHEDULED: 'blue',
};

async function getBlogPosts() {
    await connection();
    return prisma.blogPost.findMany({
        include: {
            category: { select: { id: true, name: true } },
            author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function getPendingCommentsCount() {
    await connection();
    return prisma.blogComment.count({ where: { status: 'PENDING' } });
}

async function BlogContent() {
    await requireRolePage('BLOG');
    const [posts, pendingComments] = await Promise.all([getBlogPosts(), getPendingCommentsCount()]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'منتشر شده';
            case 'DRAFT':
                return 'پیش‌نویس';
            case 'SCHEDULED':
                return 'زمان‌بندی شده';
            default:
                return status;
        }
    };

    return (
        <div className="p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت بلاگ</h1>
                    <p className="text-gray-500 text-sm mt-1">مدیریت پست‌ها، دسته‌بندی‌ها و برچسب‌ها</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/dashboard/blog/comments"
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
                    >
                        <MessageCircle className="w-5 h-5" />
                        نظرات
                        {pendingComments > 0 && (
                            <span className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {pendingComments}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/admin/dashboard/blog/new"
                        className="flex items-center gap-2 bg-gradient-to-l from-ocean to-sky-breeze text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-5 h-5" />
                        پست جدید
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-800">{posts.length}</div>
                    <div className="text-sm text-gray-500">کل پست‌ها</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">
                        {posts.filter((p) => p.status === 'PUBLISHED').length}
                    </div>
                    <div className="text-sm text-gray-500">منتشر شده</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-600">
                        {posts.filter((p) => p.status === 'DRAFT').length}
                    </div>
                    <div className="text-sm text-gray-500">پیش‌نویس</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {posts.filter((p) => p.status === 'SCHEDULED').length}
                    </div>
                    <div className="text-sm text-gray-500">زمان‌بندی شده</div>
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    عنوان
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    دسته‌بندی
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    وضعیت
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    تاریخ ایجاد
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                                    عملیات
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800 line-clamp-1">
                                                {post.title}
                                            </div>
                                            <div className="text-sm text-gray-500">/{post.slug}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-600">
                                                {post.category?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                label={getStatusLabel(post.status)}
                                                tone={POST_TONE[post.status] ?? 'gray'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-500 hover:text-ocean transition-colors"
                                                    title="مشاهده"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/dashboard/blog/${post.id}/edit`}
                                                    className="p-2 text-gray-500 hover:text-ocean transition-colors"
                                                    title="ویرایش"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <DeletePostButton slug={post.slug} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        هنوز پستی ایجاد نشده است.
                                        <br />
                                        <Link
                                            href="/admin/dashboard/blog/new"
                                            className="text-ocean hover:underline mt-2 inline-block"
                                        >
                                            اولین پست را ایجاد کنید
                                        </Link>
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

export default function AdminBlogPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری اطلاعات بلاگ...</div>}>
            <BlogContent />
        </Suspense>
    );
}
