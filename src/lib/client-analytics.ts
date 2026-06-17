import { getStoredAnalyticsSource } from '@/components/analytics/VisitTracker'

export function recordClientEvent(
    type: string,
    data: {
        productId?: number | null
        orderId?: number | null
        searchQuery?: string | null
        searchResultCount?: number | null
        loadTime?: number | null
        imageSize?: number | null
        hasErrors?: boolean | null
        browser?: string | null
    } = {}
) {
    if (typeof window === 'undefined') return

    const payload = {
        type,
        path: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
        source: getStoredAnalyticsSource(),
        ...data,
    }

    const json = JSON.stringify(payload)

    if (navigator.sendBeacon) {
        try {
            navigator.sendBeacon('/api/analytics/event', new Blob([json], { type: 'application/json' }))
            return
        } catch {
            // Fallback to fetch if sendBeacon fails
        }
    }

    fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        keepalive: true,
    }).catch(() => undefined)
}
