import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getBlogCategories, getBlogTags } from '@/lib/blog/queries';
import EditPostForm from './EditPostForm';

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

export default async function EditBlogPostPage({ params }: Props) {
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
