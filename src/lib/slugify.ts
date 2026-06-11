import { prisma } from '@/lib/db'

/**
 * Generate a clean, SEO-friendly slug from a string.
 * Supports both English and Persian characters.
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        // Replace spaces and special separators with a single hyphen
        .replace(/[\s_+\/\\#.,;:-]+/g, '-')
        // Remove characters that are not letters, numbers, or hyphens (keep Persian letters)
        .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF-]/g, '')
        // Replace multiple consecutive hyphens with a single one
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug for a database table by appending a numeric suffix if needed.
 */
export async function generateUniqueSlug(
    name: string,
    modelName: 'product' | 'category' | 'subcategory'
): Promise<string> {
    const baseSlug = slugify(name) || 'slug';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        let exists = false;

        if (modelName === 'product') {
            const count = await prisma.product.count({ where: { slug } });
            exists = count > 0;
        } else if (modelName === 'category') {
            const count = await prisma.category.count({ where: { slug } });
            exists = count > 0;
        } else if (modelName === 'subcategory') {
            const count = await prisma.subcategory.count({ where: { slug } });
            exists = count > 0;
        }

        if (!exists) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}
