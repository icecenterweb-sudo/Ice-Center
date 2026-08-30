import { NextRequest, NextResponse } from 'next/server'
import { recordAnalyticsEvent, AnalyticsEventKind } from '@/lib/analytics'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter'
import { verifyUserToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        // Rate limit: unauthenticated endpoint — prevent log-flooding / DB
        // write amplification
        const clientIp = getClientIp(request)
        const rateLimit = await checkRateLimit(`analytics-event:${clientIp}`, RATE_LIMITS.relaxed)
        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false }, { status: 429 })
        }

        const body = await request.json().catch(() => ({}))
        const {
            type,
            path,
            referrer,
            source,
            productId,
            orderId,
            searchQuery,
            searchResultCount,
            loadTime,
            imageSize,
            hasErrors,
            browser,
        } = body

        if (!type) {
            return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
        }

        // Try to fetch logged in user from cookies if any, to attribute the event to the user
        let userId: number | null = null
        try {
            const cookieStore = await cookies()
            const token = cookieStore.get('user_token')?.value
            if (token) {
                const payload = await verifyUserToken(token)
                if (payload) {
                    userId = payload.userId
                }
            }
        } catch {
            // No auth context or cookie access failed
        }

        await recordAnalyticsEvent({
            type: type as AnalyticsEventKind,
            request,
            path: typeof path === 'string' ? path : null,
            referrer: typeof referrer === 'string' ? referrer : null,
            source: typeof source === 'string' ? source : null,
            productId: typeof productId === 'number' ? productId : null,
            orderId: typeof orderId === 'number' ? orderId : null,
            searchQuery: typeof searchQuery === 'string' ? searchQuery : null,
            searchResultCount: typeof searchResultCount === 'number' ? searchResultCount : null,
            loadTime: typeof loadTime === 'number' ? loadTime : null,
            imageSize: typeof imageSize === 'number' ? imageSize : null,
            hasErrors: typeof hasErrors === 'boolean' ? hasErrors : null,
            browser: typeof browser === 'string' ? browser : null,
            userId,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Analytics] Event API error:', error)
        return NextResponse.json({ success: true }) // Return 200 to not block/break client operations
    }
}
