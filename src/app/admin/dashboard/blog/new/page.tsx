import { getBlogCategories, getBlogTags } from '@/lib/blog/queries';
import NewPostForm from './NewPostForm';
import { connection } from 'next/server';
import { Suspense } from 'react';

async function NewPostContent() {
    await connection();
    const [categories, tags] = await Promise.all([
        getBlogCategories(),
        getBlogTags(),
    ]);

    return <NewPostForm categories={categories} tags={tags} />;
}

export default function NewBlogPostPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <NewPostContent />
        </Suspense>
    );
}

