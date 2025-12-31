import { getBlogCategories, getBlogTags } from '@/lib/blog/queries';
import NewPostForm from './NewPostForm';

export default async function NewBlogPostPage() {
    const [categories, tags] = await Promise.all([
        getBlogCategories(),
        getBlogTags(),
    ]);

    return <NewPostForm categories={categories} tags={tags} />;
}
