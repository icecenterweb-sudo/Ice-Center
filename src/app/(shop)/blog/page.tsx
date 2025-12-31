import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import BlogCard from '@/components/blog/BlogCard';
import { getPublishedPosts, getBlogCategories } from '@/lib/blog/queries';

export const metadata: Metadata = {
    title: 'وبلاگ آیس سنتر | مقالات و راهنماها',
    description: 'آخرین مقالات و راهنماهای تخصصی درباره تجهیزات کافی شاپ، بستنی ساز، یخ ساز و سایر محصولات صنعتی',
};

interface BlogCategory {
    id: number;
    name: string;
    slug: string;
    _count?: { posts: number };
}

interface BlogPostItem {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    coverImage: string | null;
    summary: string | null;
    publishedAt: Date | null;
    category: { id: number; name: string; slug: string } | null;
}

interface Props {
    searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const categorySlug = params.category;

    const [{ posts, pagination }, categories] = await Promise.all([
        getPublishedPosts({
            page,
            limit: 12,
            categorySlug,
        }),
        getBlogCategories(),
    ]);

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8 font-yekan" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">وبلاگ</h1>
                <Link href="/" className="text-ocean hover:text-royal flex items-center text-sm">
                    <ChevronLeft className="w-4 h-4" />
                    بازگشت به صفحه اصلی
                </Link>
            </div>

            {/* Categories Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
                <Link
                    href="/blog"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!categorySlug
                        ? 'bg-ocean text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    همه
                </Link>
                {categories.map((cat: BlogCategory) => (
                    <Link
                        key={cat.id}
                        href={`/blog?category=${cat.slug}`}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${categorySlug === cat.slug
                            ? 'bg-ocean text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat.name}
                    </Link>
                ))}
            </div>

            {/* Posts Grid */}
            {posts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {posts.map((post: BlogPostItem) => (
                            <BlogCard
                                key={post.id}
                                title={post.title}
                                slug={post.slug}
                                thumbnail={post.thumbnail}
                                coverImage={post.coverImage}
                                summary={post.summary}
                                publishedAt={post.publishedAt}
                                category={post.category}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-10">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                                (p) => (
                                    <Link
                                        key={p}
                                        href={`/blog?page=${p}${categorySlug ? `&category=${categorySlug}` : ''}`}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === pagination.page
                                            ? 'bg-ocean text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {p.toLocaleString('fa-IR')}
                                    </Link>
                                )
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">هنوز پستی منتشر نشده است.</p>
                </div>
            )}
        </div>
    );
}
