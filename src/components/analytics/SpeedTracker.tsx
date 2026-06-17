'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordClientEvent } from '@/lib/client-analytics'

export default function SpeedTracker() {
    const pathname = usePathname()

    useEffect(() => {
        const reportSpeed = () => {
            // Delay slightly to ensure resource and navigation timings are populated
            setTimeout(() => {
                try {
                    const navEntries = performance.getEntriesByType('navigation')
                    if (navEntries.length === 0) return
                    const nav = navEntries[0] as PerformanceNavigationTiming
                    
                    const loadTime = nav.loadEventEnd || nav.domContentLoadedEventEnd || 0
                    if (loadTime <= 0) return

                    const resources = performance.getEntriesByType('resource')
                    const images = resources.filter((r: any) => r.initiatorType === 'img')
                    const imageSize = images.reduce((sum, img: any) => sum + (img.encodedBodySize || img.transferSize || 0), 0) / 1024 // in KB

                    recordClientEvent('SPEED_LOG', {
                        loadTime,
                        imageSize,
                        hasErrors: false,
                    })
                } catch (e) {
                    console.error('[Analytics] Speed report error:', e)
                }
            }, 1500)
        }

        if (document.readyState === 'complete') {
            reportSpeed()
        } else {
            window.addEventListener('load', reportSpeed)
            return () => window.removeEventListener('load', reportSpeed)
        }
    }, [pathname])

    useEffect(() => {
        const handleError = () => {
            recordClientEvent('SPEED_LOG', {
                hasErrors: true,
            })
        }

        window.addEventListener('error', handleError)
        return () => window.removeEventListener('error', handleError)
    }, [])

    return null
}
