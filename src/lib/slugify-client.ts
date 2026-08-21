/**
 * Generate a clean, SEO-friendly slug from a string (Client and Server safe).
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
