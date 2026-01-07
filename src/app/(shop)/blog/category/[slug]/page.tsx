import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import BlogCard from '@/components/blog/BlogCard';
import { getPublishedPosts, getBlogCategoryBySlug, getBlogCategories } from '@/lib/blog/queries';
import { connection } from 'next/server';
import { Suspense } from 'react';

interface BlogCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
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
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    await connection();
    const { slug } = await params;
    const category = await getBlogCategoryBySlug(slug);

    if (!category) {
        return { title: 'دسته‌بندی یافت نشد' };
    }

    return {
        title: `${category.name} | وبلاگ آیس سنتر`,
        description: category.description || `مقالات دسته‌بندی ${category.name}`,
    };
}

async function BlogCategoryContent({ params, searchParams }: Props) {
    await connection();
    const { slug } = await params;
    const search = await searchParams;
    const page = parseInt(search.page || '1', 10);

    const [category, { posts, pagination }, categories] = await Promise.all([
        getBlogCategoryBySlug(slug),
        getPublishedPosts({ page, limit: 12, categorySlug: slug }),
        getBlogCategories(),
    ]);

    if (!category) {
        notFound();
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8 font-yekan" dir="rtl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-ocean">صفحه اصلی</Link>
                <ChevronLeft className="w-4 h-4" />
                <Link href="/blog" className="hover:text-ocean">وبلاگ</Link>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-gray-800">{category.name}</span>
            </nav>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    {category.name}
                </h1>
                {category.description && (
                    <p className="text-gray-500">{category.description}</p>
                )}
            </div>

            {/* Categories Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
                <Link
                    href="/blog"
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    همه
                </Link>
                {categories.map((cat: BlogCategory) => (
                    <Link
                        key={cat.id}
                        href={`/blog/category/${cat.slug}`}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${cat.slug === slug
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
                                        href={`/blog/category/${slug}?page=${p}`}
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
                    <p className="text-gray-500 text-lg">هنوز پستی در این دسته‌بندی منتشر نشده است.</p>
                </div>
            )}
        </div>
    );
}

export default function BlogCategoryPage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <BlogCategoryContent {...props} />
        </Suspense>
    );
}
