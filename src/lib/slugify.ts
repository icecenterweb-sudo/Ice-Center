import { prisma } from '@/lib/db'
import { slugify } from '@/lib/slugify-client'

export { slugify }

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
