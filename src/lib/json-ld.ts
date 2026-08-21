/**
 * Safely serializes JSON-LD objects for HTML script embedding,
 * escaping angle brackets and ampersands to prevent script tag injection / XSS.
 */
export function serializeJsonLd(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}
