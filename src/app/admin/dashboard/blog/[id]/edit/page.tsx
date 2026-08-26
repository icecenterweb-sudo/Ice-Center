import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getBlogCategories, getBlogTags } from '@/lib/blog/queries';
import EditPostForm from './EditPostForm';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

interface Props {
    params: Promise<{ id: string }>;
}

async function getPost(id: number) {
    return prisma.blogPost.findUnique({
        where: { id },
        include: {
            tags: { select: { id: true } },
        },
    });
}

async function EditPostContent({ params }: Props) {
    await connection();
    await requireRolePage('BLOG');
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
        notFound();
    }

    const [post, categories, tags] = await Promise.all([
        getPost(postId),
        getBlogCategories(),
        getBlogTags(),
    ]);

    if (!post) {
        notFound();
    }

    return <EditPostForm post={post} categories={categories} tags={tags} />;
}

export default function EditBlogPostPage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditPostContent {...props} />
        </Suspense>
    );
}
