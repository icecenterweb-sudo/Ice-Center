import { createHash } from 'node:crypto'
import { prisma } from '@/lib/db'

export type AnalyticsEventKind =
    | 'PAGE_VIEW'
    | 'PRODUCT_VIEW'
    | 'ADD_TO_CART'
    | 'CHECKOUT_START'
    | 'ORDER_SUBMIT'
    | 'PAYMENT_SUCCESS'
    | 'SEARCH'
    | 'SPEED_LOG'
    | 'USER_LOGIN'
    | 'ADMIN_LOGIN'

type EventInput = {
    type: AnalyticsEventKind
    request: Request
    path?: string | null
    referrer?: string | null
    source?: string | null
    medium?: string | null
    userId?: number | null
    adminId?: number | null
    productId?: number | null
    orderId?: number | null
    searchQuery?: string | null
    searchResultCount?: number | null
    loadTime?: number | null
    imageSize?: number | null
    hasErrors?: boolean | null
    browser?: string | null
}

const SOCIAL_SOURCES = new Map([
    ['instagram.com', 'instagram'],
    ['t.me', 'telegram'],
    ['telegram.me', 'telegram'],
    ['whatsapp.com', 'whatsapp'],
    ['wa.me', 'whatsapp'],
    ['bale.ai', 'bale'],
    ['eitaa.com', 'eitaa'],
    ['rubika.ir', 'rubika'],
    ['linkedin.com', 'linkedin'],
    ['youtube.com', 'youtube'],
    ['youtu.be', 'youtube'],
    ['aparat.com', 'aparat'],
    ['facebook.com', 'facebook'],
    ['twitter.com', 'x'],
    ['x.com', 'x'],
])

const SEARCH_SOURCES = new Map([
    ['google.', 'google'],
    ['bing.com', 'bing'],
    ['yahoo.', 'yahoo'],
    ['duckduckgo.com', 'duckduckgo'],
])

export function getAnalyticsSource(referrer?: string | null, explicitSource?: string | null): string {
    if (explicitSource) {
        return sanitizeSource(explicitSource)
    }

    if (!referrer) return 'direct'

    try {
        const hostname = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()

        for (const [domain, source] of SOCIAL_SOURCES) {
            if (hostname === domain || hostname.endsWith(`.${domain}`)) return source
        }

        for (const [domain, source] of SEARCH_SOURCES) {
            if (hostname.includes(domain)) return source
        }

        return hostname
    } catch {
        return 'direct'
    }
}

export function getAnalyticsMedium(source: string): string {
    if (source === 'direct') return 'direct'
    if (['google', 'bing', 'yahoo', 'duckduckgo'].includes(source)) return 'search'
    if (['instagram', 'telegram', 'whatsapp', 'bale', 'eitaa', 'rubika', 'linkedin', 'youtube', 'aparat', 'facebook', 'x'].includes(source)) {
        return 'social'
    }
    return 'referral'
}

export function getDevice(userAgent?: string | null): string {
    const ua = userAgent?.toLowerCase() || ''
    if (!ua) return 'unknown'
    if (/bot|crawler|spider|crawling/.test(ua)) return 'bot'
    if (/tablet|ipad/.test(ua)) return 'tablet'
    if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
    return 'desktop'
}

export function shouldSkipAnalytics(path?: string | null, userAgent?: string | null): boolean {
    if (!path) return true
    if (path.startsWith('/api') || path.startsWith('/admin') || path.startsWith('/_next')) return true
    return getDevice(userAgent) === 'bot'
}

function parseBrowser(userAgent?: string | null): string | null {
    if (!userAgent) return null
    const ua = userAgent.toLowerCase()
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
    if (ua.includes('edg/')) return 'Edge'
    if (ua.includes('chrome')) return 'Chrome'
    if (ua.includes('safari')) return 'Safari'
    return 'Other'
}

export async function recordAnalyticsEvent(input: EventInput): Promise<void> {
    try {
        const userAgent = input.request.headers.get('user-agent')
        if (input.type === 'PAGE_VIEW' && shouldSkipAnalytics(input.path, userAgent)) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const analyticsEventClient = (prisma as any).analyticsEvent;
        if (!analyticsEventClient) {
            return;
        }

        const source = getAnalyticsSource(input.referrer, input.source)
        const medium = input.medium || getAnalyticsMedium(source)

        await analyticsEventClient.create({
            data: {
                type: input.type,
                path: normalizePath(input.path),
                referrer: input.referrer?.slice(0, 500) || null,
                source,
                medium,
                device: getDevice(userAgent),
                userAgent: userAgent?.slice(0, 500) || null,
                ipHash: hashIp(getClientIp(input.request)),
                userId: input.userId || null,
                adminId: input.adminId || null,
                productId: input.productId || null,
                orderId: input.orderId || null,
                searchQuery: input.searchQuery || null,
                searchResultCount: input.searchResultCount ?? null,
                loadTime: input.loadTime || null,
                imageSize: input.imageSize || null,
                hasErrors: input.hasErrors ?? false,
                browser: input.browser || parseBrowser(userAgent),
            },
        })
    } catch (error) {
        console.error('[Analytics] Failed to record event:', error)
    }
}

function normalizePath(path?: string | null): string | null {
    if (!path) return null
    const trimmed = path.trim()
    if (!trimmed.startsWith('/')) return null
    return trimmed.slice(0, 500)
}

function getClientIp(request: Request): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown'
}

function hashIp(ip: string): string {
    const salt = process.env.ANALYTICS_SALT || process.env.JWT_SECRET || 'ice-center-analytics'
    return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

function sanitizeSource(source: string): string {
    return source.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 80) || 'direct'
}
