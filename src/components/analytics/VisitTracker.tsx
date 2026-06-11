'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SOURCE_STORAGE_KEY = 'ice_center_analytics_source'
const SOCIAL_DOMAINS: Array<[string, string]> = [
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
]

export function getStoredAnalyticsSource(): string {
    if (typeof window === 'undefined') return 'direct'
    return localStorage.getItem(SOURCE_STORAGE_KEY) || 'direct'
}

export default function VisitTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        const query = searchParams.toString()
        const path = query ? `${pathname}?${query}` : pathname
        const source = detectSource(document.referrer, searchParams.get('utm_source'))

        localStorage.setItem(SOURCE_STORAGE_KEY, source)

        const payload = JSON.stringify({
            path,
            referrer: document.referrer || null,
            source,
        })

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/visit', new Blob([payload], { type: 'application/json' }))
            return
        }

        fetch('/api/analytics/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => undefined)
    }, [pathname, searchParams])

    return null
}

function detectSource(referrer: string, utmSource: string | null): string {
    if (utmSource) return sanitize(utmSource)
    if (!referrer) return 'direct'

    try {
        const hostname = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
        if (hostname === window.location.hostname.replace(/^www\./, '').toLowerCase()) return getStoredAnalyticsSource()

        for (const [domain, source] of SOCIAL_DOMAINS) {
            if (hostname === domain || hostname.endsWith(`.${domain}`)) return source
        }

        if (hostname.includes('google.')) return 'google'
        if (hostname.includes('bing.com')) return 'bing'
        return hostname
    } catch {
        return 'direct'
    }
}

function sanitize(source: string): string {
    return source.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 80) || 'direct'
}
