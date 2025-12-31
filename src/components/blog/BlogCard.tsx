import Image from 'next/image';
import Link from 'next/link';

interface BlogCardProps {
    title: string;
    slug: string;
    thumbnail: string | null;
    coverImage: string | null;
    summary: string | null;
    publishedAt: Date | null;
    category?: {
        name: string;
        slug: string;
    } | null;
}

export default function BlogCard({
    title,
    slug,
    thumbnail,
    coverImage,
    summary,
    publishedAt,
    category,
}: BlogCardProps) {
    const imageUrl = thumbnail || coverImage;
    const fallbackImage = 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1764859446/banner_ArticleBanners_bOE8Hn_a141732b-5dda-4bc6-af7f-c69e9191fdd2_dzm93j.png';

    const formattedDate = publishedAt
        ? new Date(publishedAt).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : null;

    return (
        <Link
            href={`/blog/${slug}`}
            className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group"
        >
            {/* Image */}
            <div className="relative w-full h-40 overflow-hidden">
                <Image
                    src={imageUrl || fallbackImage}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {category && (
                    <span className="absolute top-3 right-3 bg-ocean text-white text-xs px-2 py-1 rounded-lg">
                        {category.name}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-6 mb-2 group-hover:text-ocean transition-colors">
                    {title}
                </h3>

                {summary && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-5">
                        {summary}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                    {formattedDate && <span>{formattedDate}</span>}
                    <span className="text-ocean font-medium">ادامه مطلب ←</span>
                </div>
            </div>
        </Link>
    );
}
