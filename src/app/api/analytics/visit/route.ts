import { NextRequest, NextResponse } from 'next/server'
import { recordAnalyticsEvent } from '@/lib/analytics'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
    try {
        // Rate limit: unauthenticated endpoint — prevent log-flooding / DB
        // write amplification
        const clientIp = getClientIp(request)
        const rateLimit = await checkRateLimit(`analytics-visit:${clientIp}`, RATE_LIMITS.relaxed)
        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false }, { status: 429 })
        }

        const body = await request.json().catch(() => ({}))
        const path = typeof body.path === 'string' ? body.path : null
        const referrer = typeof body.referrer === 'string' ? body.referrer : request.headers.get('referer')
        const source = typeof body.source === 'string' ? body.source : null

        await recordAnalyticsEvent({
            type: 'PAGE_VIEW',
            request,
            path,
            referrer,
            source,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Analytics] Visit route error:', error)
        return NextResponse.json({ success: true })
    }
}
