import { connection } from 'next/server'
import { prisma } from '@/lib/db'
import AnalyticsDashboard from './AnalyticsDashboard'

const DAY_MS = 24 * 60 * 60 * 1000

export default async function AdminAnalyticsPage() {
    await connection()
    const now = new Date()
    const start30 = startOfDay(new Date(now.getTime() - 29 * DAY_MS))
    const start7 = startOfDay(new Date(now.getTime() - 6 * DAY_MS))
    const startToday = startOfDay(now)

    // Base client check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analyticsEventClient = (prisma as any).analyticsEvent;
    if (!analyticsEventClient) {
        console.warn('Prisma client has not been regenerated with AnalyticsEvent model.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <AnalyticsDashboard hasData={false} summary={null as any} daily={[]} funnel={null as any} socialMetrics={[]} highVisitNoSales={[]} searchMetrics={{ topQueries: [], zeroResultQueries: [] }} retentionMetrics={{ newUsers: 0, activeUsers: 0, returningUsers: 0, inactiveUsers: 0 }} peakTraffic={[]} deviceBrowserMetrics={{ devices: [], browsers: [] }} speedMetrics={[]} />
    }

    try {
        // 1. Fetch raw events in the last 30 days
        const events = await analyticsEventClient.findMany({
            where: { createdAt: { gte: start30 } },
            orderBy: { createdAt: 'asc' },
            take: 30000,
        }) as any[];

        const totalUsers = await prisma.user.count()

        // 2. Summary & Funnel Calculations
        const visits30 = events.filter((e) => e.type === 'PAGE_VIEW')
        const visits7Days = visits30.filter((e) => e.createdAt >= start7).length
        const visitsToday = visits30.filter((e) => e.createdAt >= startToday).length

        const productViews = events.filter((e) => e.type === 'PRODUCT_VIEW').length
        const cartAdds = events.filter((e) => e.type === 'ADD_TO_CART').length
        const checkoutStarts = events.filter((e) => e.type === 'CHECKOUT_START').length
        const orderSubmits = events.filter((e) => e.type === 'ORDER_SUBMIT').length
        const paidOrders = events.filter((e) => e.type === 'PAYMENT_SUCCESS').length

        const logins30 = events.filter((e) => e.type === 'USER_LOGIN')
        const socialVisits30 = visits30.filter((e) => e.medium === 'social').length
        const searchVisits30 = visits30.filter((e) => e.medium === 'search').length

        // Conversion Rate: paid orders / total visits
        const conversionRate = visits30.length > 0 ? (paidOrders / visits30.length) * 100 : 0

        // 3. Traffic to Purchase & Social Media Attributions
        // Fetch orders in the last 30 days to calculate revenue
        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: start30 } },
            select: { id: true, total: true, status: true },
        })

        // Group events by source for social media metrics
        const socialSources = ['instagram', 'telegram', 'whatsapp', 'bale', 'eitaa', 'rubika', 'linkedin', 'youtube', 'aparat', 'facebook', 'x']
        const socialMetrics = socialSources.map(src => {
            const platformEvents = events.filter(e => e.source === src)
            const visits = platformEvents.filter(e => e.type === 'PAGE_VIEW' || e.type === 'PRODUCT_VIEW').length
            const cartAdds = platformEvents.filter(e => e.type === 'ADD_TO_CART').length
            
            // Find order IDs associated with this platform's events
            const orderIds = platformEvents.filter(e => e.type === 'ORDER_SUBMIT' && e.orderId).map(e => e.orderId)
            const ordersList = orders.filter(o => orderIds.includes(o.id))
            const ordersCount = ordersList.length
            const revenue = ordersList.reduce((sum, o) => sum + o.total, 0)

            return {
                source: src,
                visits,
                cartAdds,
                orders: ordersCount,
                revenue
            }
        }).filter(m => m.visits > 0 || m.orders > 0)

        // 4. High-Visit No-Sales Products
        // Group views per product
        const viewCountsByProduct: Record<number, number> = {}
        events.filter(e => e.type === 'PRODUCT_VIEW' && e.productId).forEach(e => {
            viewCountsByProduct[e.productId] = (viewCountsByProduct[e.productId] || 0) + 1
        })

        // Fetch sales per product in the last 30 days
        const orderItems = await prisma.orderItem.findMany({
            where: { order: { status: { not: 'CANCELLED' }, createdAt: { gte: start30 } } },
            select: { productId: true, quantity: true },
        })
        const salesCountsByProduct: Record<number, number> = {}
        orderItems.forEach(item => {
            salesCountsByProduct[item.productId] = (salesCountsByProduct[item.productId] || 0) + item.quantity
        })

        // Fetch product names for viewed or sold products
        const uniqueProductIds = Array.from(new Set([
            ...Object.keys(viewCountsByProduct).map(Number),
            ...Object.keys(salesCountsByProduct).map(Number)
        ]))
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: uniqueProductIds } },
            select: { id: true, name: true, price: true, slug: true },
        })

        const highVisitNoSales = dbProducts.map(p => {
            const views = viewCountsByProduct[p.id] || 0
            const sales = salesCountsByProduct[p.id] || 0
            const ratio = views > 0 ? (sales / views) * 100 : 0
            return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                views,
                sales,
                ratio
            }
        })
        .sort((a, b) => b.views - a.views) // Sort by views to see high-visit products first
        .slice(0, 10)

        // 5. Internal Search logs
        const searchEvents = events.filter(e => e.type === 'SEARCH' && e.searchQuery)
        const searchQueries: Record<string, { count: number; totalResults: number }> = {}
        searchEvents.forEach(e => {
            const q = e.searchQuery.trim().toLowerCase()
            if (!searchQueries[q]) {
                searchQueries[q] = { count: 0, totalResults: 0 }
            }
            searchQueries[q].count++
            searchQueries[q].totalResults += (e.searchResultCount || 0)
        })

        const sortedQueries = Object.entries(searchQueries).map(([query, data]) => ({
            query,
            count: data.count,
            avgResults: Math.round(data.totalResults / data.count)
        })).sort((a, b) => b.count - a.count)

        const topQueries = sortedQueries.slice(0, 8)
        const zeroResultQueries = sortedQueries.filter(q => q.avgResults === 0).slice(0, 8)

        // 6. Customer Retention
        const newUsers = await prisma.user.count({
            where: { createdAt: { gte: start30 } }
        })

        // Active users: count distinct userIds from events in last 30 days
        const activeUserIds = Array.from(new Set(events.filter(e => e.userId).map(e => e.userId))) as number[]
        const activeUsers = activeUserIds.length

        // Returning users: active users who were created before the 30d window
        const returningUsers = await prisma.user.count({
            where: {
                id: { in: activeUserIds },
                createdAt: { lt: start30 }
            }
        })
        const inactiveUsers = Math.max(0, totalUsers - activeUsers)

        // 7. Peak Traffic Times (Hour of Day)
        const peakTraffic = Array.from({ length: 24 }, (_, hour) => {
            const hourEvents = events.filter(e => new Date(e.createdAt).getHours() === hour)
            const hourVisits = hourEvents.filter(e => e.type === 'PAGE_VIEW').length
            const hourOrders = hourEvents.filter(e => e.type === 'ORDER_SUBMIT').length
            return {
                hour,
                visits: hourVisits,
                orders: hourOrders
            }
        })

        // 8. Device & Browser Breakdowns
        const devicesList = ['desktop', 'mobile', 'tablet']
        const devicesMetrics = devicesList.map(dev => {
            const devEvents = events.filter(e => e.device === dev)
            const visits = devEvents.filter(e => e.type === 'PAGE_VIEW').length
            const orders = devEvents.filter(e => e.type === 'ORDER_SUBMIT').length
            const rate = visits > 0 ? (orders / visits) * 100 : 0
            return {
                name: dev,
                visits,
                orders,
                conversionRate: rate
            }
        }).filter(d => d.visits > 0)

        const browsersList = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Other']
        const browsersMetrics = browsersList.map(browser => {
            const browserEvents = events.filter(e => e.browser === browser)
            const visits = browserEvents.filter(e => e.type === 'PAGE_VIEW').length
            const orders = browserEvents.filter(e => e.type === 'ORDER_SUBMIT').length
            const rate = visits > 0 ? (orders / visits) * 100 : 0
            return {
                name: browser,
                visits,
                orders,
                conversionRate: rate
            }
        }).filter(b => b.visits > 0)

        // 9. Page Speed Reports
        const speedEvents = events.filter(e => e.type === 'SPEED_LOG' && e.path)
        const speedByPath: Record<string, { totalTime: number; totalSize: number; count: number; errorCount: number }> = {}
        
        speedEvents.forEach(e => {
            const p = e.path
            if (!speedByPath[p]) {
                speedByPath[p] = { totalTime: 0, totalSize: 0, count: 0, errorCount: 0 }
            }
            if (e.loadTime) {
                speedByPath[p].totalTime += e.loadTime
                speedByPath[p].count++
            }
            if (e.imageSize) {
                speedByPath[p].totalSize += e.imageSize
            }
            if (e.hasErrors) {
                speedByPath[p].errorCount++
            }
        })

        const speedMetrics = Object.entries(speedByPath).map(([path, data]) => ({
            path,
            avgLoadTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
            avgImageSize: data.count > 0 ? Math.round(data.totalSize / data.count) : 0,
            errorCount: data.errorCount
        }))
        .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
        .slice(0, 10)

        // Generate Trends for line chart (daily views vs order submits)
        const daily = Array.from({ length: 30 }, (_, index) => {
            const dayStart = startOfDay(new Date(now.getTime() - (29 - index) * DAY_MS))
            const dayEnd = new Date(dayStart.getTime() + DAY_MS)
            const dayEvents = events.filter(e => e.createdAt >= dayStart && e.createdAt < dayEnd)
            return {
                label: dayStart.toLocaleDateString('fa-IR', { day: '2-digit', month: '2-digit' }),
                visits: dayEvents.filter(e => e.type === 'PAGE_VIEW').length,
                logins: dayEvents.filter(e => e.type === 'ORDER_SUBMIT').length, // display order completions in trend
            }
        })

        return (
            <AnalyticsDashboard
                hasData={events.length > 0}
                summary={{
                    visitsToday,
                    visits7Days,
                    visits30Days: visits30.length,
                    userLogins30Days: logins30.length,
                    socialVisits30Days: socialVisits30,
                    searchVisits30Days: searchVisits30,
                    conversionRate,
                }}
                daily={daily}
                funnel={{
                    pageViews: visits30.length,
                    productViews,
                    cartAdds,
                    checkoutStarts,
                    orderSubmits,
                    paidOrders,
                }}
                socialMetrics={socialMetrics}
                highVisitNoSales={highVisitNoSales}
                searchMetrics={{
                    topQueries,
                    zeroResultQueries,
                }}
                retentionMetrics={{
                    newUsers,
                    activeUsers,
                    returningUsers,
                    inactiveUsers,
                }}
                peakTraffic={peakTraffic}
                deviceBrowserMetrics={{
                    devices: devicesMetrics,
                    browsers: browsersMetrics,
                }}
                speedMetrics={speedMetrics}
            />
        )

    } catch (error) {
        console.error('[Analytics] Dashboard aggregation error:', error)
        // Fallback safely so page doesn't crash
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <AnalyticsDashboard hasData={false} summary={null as any} daily={[]} funnel={null as any} socialMetrics={[]} highVisitNoSales={[]} searchMetrics={{ topQueries: [], zeroResultQueries: [] }} retentionMetrics={{ newUsers: 0, activeUsers: 0, returningUsers: 0, inactiveUsers: 0 }} peakTraffic={[]} deviceBrowserMetrics={{ devices: [], browsers: [] }} speedMetrics={[]} />
    }
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
