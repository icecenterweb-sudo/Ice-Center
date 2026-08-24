import { prisma } from '@/lib/db';
import { slugify, CANONICAL_SLUG_REGEX, isValidSlug } from '@/lib/slugify-client';

export { slugify, CANONICAL_SLUG_REGEX, isValidSlug };

export type SlugSupportedModel =
    | 'product'
    | 'category'
    | 'subcategory'
    | 'blogPost'
    | 'offer'
    | 'blogCategory'
    | 'blogTag';

/**
 * Checks if a slug exists for a specific database entity model.
 */
async function checkSlugExists(slug: string, modelName: SlugSupportedModel): Promise<boolean> {
    switch (modelName) {
        case 'product': {
            const count = await prisma.product.count({ where: { slug } });
            return count > 0;
        }
        case 'category': {
            const count = await prisma.category.count({ where: { slug } });
            return count > 0;
        }
        case 'subcategory': {
            const count = await prisma.subcategory.count({ where: { slug } });
            return count > 0;
        }
        case 'blogPost': {
            const count = await prisma.blogPost.count({ where: { slug } });
            return count > 0;
        }
        case 'offer': {
            const count = await prisma.offer.count({ where: { slug } });
            return count > 0;
        }
        case 'blogCategory': {
            const count = await prisma.blogCategory.count({ where: { slug } });
            return count > 0;
        }
        case 'blogTag': {
            const count = await prisma.blogTag.count({ where: { slug } });
            return count > 0;
        }
        default:
            return false;
    }
}

/**
 * Generates a unique slug for a database table by appending a numeric suffix if needed.
 */
export async function generateUniqueSlug(
    name: string,
    modelName: SlugSupportedModel
): Promise<string> {
    const baseSlug = slugify(name) || 'item';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const exists = await checkSlugExists(slug, modelName);

        if (!exists) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}
