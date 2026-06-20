import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Calendar, Tag } from 'lucide-react';
import BlockRenderer from '@/components/blog/BlockRenderer';
import BlogCommentSection from '@/components/blog/BlogCommentSection';
import { getPublishedPostBySlug, getRecentPosts } from '@/lib/blog/queries';
import type { BlogContent } from '@/lib/blog/validation';
import { connection } from 'next/server';

interface Props {
    params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    await connection();
    const { slug } = await params;
    const post = await getPublishedPostBySlug(slug);

    if (!post) {
        return {
            title: 'پست یافت نشد',
        };
    }

    return {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.summary || undefined,
        keywords: post.keywords,
        openGraph: {
            title: post.seoTitle || post.title,
            description: post.seoDescription || post.summary || undefined,
            images: post.coverImage ? [post.coverImage] : undefined,
            type: 'article',
            publishedTime: post.publishedAt?.toISOString(),
        },
    };
}

import { Suspense } from 'react';

async function BlogPostContent({ params }: Props) {
    await connection();
    const { slug } = await params;
    const [post, recentPosts] = await Promise.all([
        getPublishedPostBySlug(slug),
        getRecentPosts(4),
    ]);

    if (!post) {
        notFound();
    }

    const formattedDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : null;

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8 font-yekan" dir="rtl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-ocean">صفحه اصلی</Link>
                <ChevronLeft className="w-4 h-4" />
                <Link href="/blog" className="hover:text-ocean">وبلاگ</Link>
                {post.category && (
                    <>
                        <ChevronLeft className="w-4 h-4" />
                        <Link href={`/blog/category/${post.category.slug}`} className="hover:text-ocean">
                            {post.category.name}
                        </Link>
                    </>
                )}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <article className="lg:col-span-2">
                    {/* Cover Image */}
                    {post.coverImage && (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6">
                            <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* Title and Meta */}
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-relaxed">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
                        {formattedDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formattedDate}
                            </span>
                        )}
                        {post.category && (
                            <Link
                                href={`/blog/category/${post.category.slug}`}
                                className="flex items-center gap-1 text-ocean hover:text-royal"
                            >
                                <Tag className="w-4 h-4" />
                                {post.category.name}
                            </Link>
                        )}
                        {post.author?.name && (
                            <span>نویسنده: {post.author.name}</span>
                        )}
                    </div>

                    {/* Summary */}
                    {post.summary && (
                        <p className="text-lg text-gray-600 mb-8 leading-8 bg-frost p-4 rounded-xl border-r-4 border-ocean">
                            {post.summary}
                        </p>
                    )}

                    {/* Content */}
                    <div className="prose-content">
                        <BlockRenderer content={post.content as unknown as BlogContent} />
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
                            <span className="text-gray-500 text-sm">برچسب‌ها:</span>
                            {post.tags.map((tag: { id: number; name: string; slug: string }) => (
                                <Link
                                    key={tag.id}
                                    href={`/blog/tag/${tag.slug}`}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-sm transition-colors"
                                >
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Comments Section */}
                    <BlogCommentSection postId={post.id} />
                </article>

                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Recent Posts */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">آخرین مطالب</h3>
                            <div className="space-y-4">
                                {recentPosts
                                    .filter((p: { id: number; slug: string; title: string; thumbnail: string | null; coverImage: string | null }) => p.slug !== slug)
                                    .slice(0, 3)
                                    .map((p: { id: number; slug: string; title: string; thumbnail: string | null; coverImage: string | null }) => (
                                        <Link
                                            key={p.id}
                                            href={`/blog/${p.slug}`}
                                            className="flex gap-3 group"
                                        >
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={p.thumbnail || p.coverImage || '/uploads/blog-covers/banner_ArticleBanners_bOE8Hn_a141732b-5dda-4bc6-af.png'}
                                                    alt={p.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-ocean transition-colors">
                                                    {p.title}
                                                </h4>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* Back to Blog */}
                        <Link
                            href="/blog"
                            className="flex items-center justify-center gap-2 w-full bg-ocean hover:bg-royal text-white py-3 rounded-xl font-medium transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            بازگشت به وبلاگ
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default function BlogPostPage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری مقاله...</div>}>
            <BlogPostContent {...props} />
        </Suspense>
    );
}
