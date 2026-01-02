import { prisma } from '@/lib/db';
import { BannerPosition } from '@prisma/client';

export interface BannerForDisplay {
    id: number;
    title: string;
    desktopImage: string;
    mobileImage: string;
    alt: string;
    link: string;
}

/**
 * Get banners by position for homepage display
 * Returns empty array if Banner table doesn't exist (before migration)
 */
export async function getBannersByPosition(position: BannerPosition): Promise<BannerForDisplay[]> {
    try {
        const banners = await prisma.banner.findMany({
            where: {
                position,
                isActive: true,
            },
            include: {
                product: { select: { slug: true } },
                category: { select: { slug: true } },
            },
            orderBy: { order: 'asc' },
        });

        return banners.map((banner) => ({
            id: banner.id,
            title: banner.title,
            desktopImage: banner.desktopImage,
            mobileImage: banner.mobileImage,
            alt: banner.alt,
            link: resolveLink(banner),
        }));
    } catch (error) {
        // Table doesn't exist yet (before migration) - return empty array
        if ((error as { code?: string })?.code === 'P2021') {
            console.warn('Banner table does not exist yet. Run prisma migrate to create it.');
            return [];
        }
        throw error;
    }
}

/**
 * Resolve the link for a banner
 * Priority: custom link > product > category > '#'
 */
function resolveLink(banner: {
    link: string | null;
    product: { slug: string } | null;
    category: { slug: string } | null;
}): string {
    if (banner.link) {
        return banner.link;
    }
    if (banner.product) {
        return `/products/${banner.product.slug}`;
    }
    if (banner.category) {
        return `/categories/${banner.category.slug}`;
    }
    return '#';
}

/**
 * Get single full-width banners
 */
export async function getSingleBanners(): Promise<BannerForDisplay[]> {
    return getBannersByPosition('SINGLE_FULL');
}

/**
 * Get double (side-by-side) banners
 */
export async function getDoubleBanners(): Promise<BannerForDisplay[]> {
    return getBannersByPosition('DOUBLE');
}
