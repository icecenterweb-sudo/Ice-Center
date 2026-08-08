import { NextRequest } from 'next/server';

/**
 * Validates request Origin header against allowed site domain.
 * Protects state-changing API endpoints from cross-site requests.
 */
export function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true; // Non-browser requests or same-origin direct navigation

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ice-center.ir';
    try {
        const allowedHost = new URL(siteUrl).host;
        const requestHost = request.headers.get('host');
        const originHost = new URL(origin).host;

        return originHost === allowedHost || originHost === requestHost;
    } catch {
        return false;
    }
}
