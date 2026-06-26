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
        const totalUsers = await prisma.user.count()

        // 1. Check if there are any events at all
        const totalEvents30Days = await analyticsEventClient.count({
            where: { createdAt: { gte: start30 } }
        })
        const hasData = totalEvents30Days > 0;

        // 2. Fetch event counts grouped by type (for funnel and basic summary metrics)
        const typeCounts = await analyticsEventClient.groupBy({
            by: ['type'],
            where: { createdAt: { gte: start30 } },
            _count: { _all: true }
        })
        const counts = typeCounts.reduce((acc: any, curr: any) => {
            acc[curr.type] = curr._count._all;
            return acc;
        }, {} as Record<string, number>);

        const visits30Days = counts['PAGE_VIEW'] || 0;
        const productViews = counts['PRODUCT_VIEW'] || 0;
        const cartAdds = counts['ADD_TO_CART'] || 0;
        const checkoutStarts = counts['CHECKOUT_START'] || 0;
        const orderSubmits = counts['ORDER_SUBMIT'] || 0;
        const paidOrders = counts['PAYMENT_SUCCESS'] || 0;
        const userLogins30Days = counts['USER_LOGIN'] || 0;

        // Fetch counts for page views today and in the last 7 days
        const visitsToday = await analyticsEventClient.count({
            where: {
                type: 'PAGE_VIEW',
                createdAt: { gte: startToday }
            }
        })
        const visits7Days = await analyticsEventClient.count({
            where: {
                type: 'PAGE_VIEW',
                createdAt: { gte: start7 }
            }
        })

        // Fetch medium counts for social and search visits
        const mediumCounts = await analyticsEventClient.groupBy({
            by: ['medium'],
            where: {
                type: 'PAGE_VIEW',
                createdAt: { gte: start30 }
            },
            _count: { _all: true }
        })
        const mediumMap = mediumCounts.reduce((acc: any, curr: any) => {
            if (curr.medium) acc[curr.medium] = curr._count._all;
            return acc;
        }, {} as Record<string, number>);
        const socialVisits30Days = mediumMap['social'] || 0;
        const searchVisits30Days = mediumMap['search'] || 0;

        // Conversion Rate: paid orders / total visits
        const conversionRate = visits30Days > 0 ? (paidOrders / visits30Days) * 100 : 0

        // 3. Traffic to Purchase & Social Media Attributions
        const socialSources = ['instagram', 'telegram', 'whatsapp', 'bale', 'eitaa', 'rubika', 'linkedin', 'youtube', 'aparat', 'facebook', 'x']
        
        // Group event count by source & type for social platforms
        const socialEventsData = await analyticsEventClient.groupBy({
            by: ['source', 'type'],
            where: {
                source: { in: socialSources },
                createdAt: { gte: start30 }
            },
            _count: { _all: true }
        })

        // Retrieve ORDER_SUBMIT events from social sources to map them to orders
        const socialOrdersEvents = await analyticsEventClient.findMany({
            where: {
                type: 'ORDER_SUBMIT',
                source: { in: socialSources },
                createdAt: { gte: start30 },
                orderId: { not: null }
            },
            select: {
                source: true,
                orderId: true
            }
        })

        const orderIds = socialOrdersEvents.map((e: any) => e.orderId).filter(Boolean) as number[];
        const orders = await prisma.order.findMany({
            where: {
                id: { in: orderIds },
                createdAt: { gte: start30 }
            },
            select: { id: true, total: true }
        })
        const orderMap = new Map(orders.map(o => [o.id, o.total]));

        const socialCounts: Record<string, { visits: number; cartAdds: number }> = {};
        for (const src of socialSources) {
            socialCounts[src] = { visits: 0, cartAdds: 0 };
        }
        for (const item of socialEventsData) {
            const { source, type, _count } = item;
            if (source && socialCounts[source]) {
                if (type === 'PAGE_VIEW' || type === 'PRODUCT_VIEW') {
                    socialCounts[source].visits += _count._all;
                } else if (type === 'ADD_TO_CART') {
                    socialCounts[source].cartAdds += _count._all;
                }
            }
        }

        const socialOrderInfo: Record<string, { count: number; revenue: number }> = {};
        for (const src of socialSources) {
            socialOrderInfo[src] = { count: 0, revenue: 0 };
        }
        for (const ev of socialOrdersEvents) {
            const total = orderMap.get(ev.orderId!) || 0;
            if (ev.source && socialOrderInfo[ev.source]) {
                socialOrderInfo[ev.source].count++;
                socialOrderInfo[ev.source].revenue += total;
            }
        }

        const socialMetrics = socialSources.map(src => {
            const visits = socialCounts[src]?.visits || 0;
            const cartAdds = socialCounts[src]?.cartAdds || 0;
            const ordersCount = socialOrderInfo[src]?.count || 0;
            const revenue = socialOrderInfo[src]?.revenue || 0;
            return {
                source: src,
                visits,
                cartAdds,
                orders: ordersCount,
                revenue
            }
        }).filter(m => m.visits > 0 || m.orders > 0)

        // 4. High-Visit No-Sales Products
        // Group product views in database
        const productViewCounts = await analyticsEventClient.groupBy({
            by: ['productId'],
            where: {
                type: 'PRODUCT_VIEW',
                productId: { not: null },
                createdAt: { gte: start30 }
            },
            _count: { _all: true }
        })

        // Group sales quantity per product in database
        const productSalesData = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    status: { not: 'CANCELLED' },
                    createdAt: { gte: start30 }
                }
            },
            _sum: {
                quantity: true
            }
        })

        const viewCountsByProduct: Record<number, number> = {}
        productViewCounts.forEach((item: any) => {
            if (item.productId) {
                viewCountsByProduct[item.productId] = item._count._all;
            }
        })

        const salesCountsByProduct: Record<number, number> = {}
        productSalesData.forEach((item: any) => {
            if (item.productId) {
                salesCountsByProduct[item.productId] = item._sum.quantity || 0;
            }
        })

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
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)

        // 5. Internal Search logs
        const searchEventsData = await analyticsEventClient.groupBy({
            by: ['searchQuery'],
            where: {
                type: 'SEARCH',
                searchQuery: { not: null },
                createdAt: { gte: start30 }
            },
            _count: { _all: true },
            _sum: {
                searchResultCount: true
            }
        })

        const searchQueries: Record<string, { count: number; totalResults: number }> = {}
        searchEventsData.forEach((item: any) => {
            const q = item.searchQuery.trim().toLowerCase()
            if (!searchQueries[q]) {
                searchQueries[q] = { count: 0, totalResults: 0 }
            }
            searchQueries[q].count += item._count._all
            searchQueries[q].totalResults += (item._sum.searchResultCount || 0)
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

        const activeUserGroup = await analyticsEventClient.groupBy({
            by: ['userId'],
            where: {
                userId: { not: null },
                createdAt: { gte: start30 }
            }
        })
        const activeUserIds = activeUserGroup.map((g: any) => g.userId) as number[]
        const activeUsers = activeUserIds.length

        const returningUsers = await prisma.user.count({
            where: {
                id: { in: activeUserIds },
                createdAt: { lt: start30 }
            }
        })
        const inactiveUsers = Math.max(0, totalUsers - activeUsers)

        // 7 & 8. Peak-hour and daily trends.
        // Aggregate in SQL bucketed by Iran local time (Asia/Tehran) so "peak
        // hour" and day boundaries match the store's actual operating clock —
        // not the server's UTC. Avoids loading every event into memory.
        const IRAN_TZ = 'Asia/Tehran'

        const peakRows = await prisma.$queryRaw<
            { hour: number; visits: bigint; orders: bigint }[]
        >`
            SELECT
                EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${IRAN_TZ})::int AS hour,
                COUNT(*) FILTER (WHERE "type" = 'PAGE_VIEW')    AS visits,
                COUNT(*) FILTER (WHERE "type" = 'ORDER_SUBMIT') AS orders
            FROM "AnalyticsEvent"
            WHERE "type" IN ('PAGE_VIEW', 'ORDER_SUBMIT')
              AND "createdAt" >= ${start30}
            GROUP BY hour
        `
        const peakByHour = new Map(
            peakRows.map(r => [r.hour, { visits: Number(r.visits), orders: Number(r.orders) }])
        )
        const peakTraffic = Array.from({ length: 24 }, (_, hour) => {
            const row = peakByHour.get(hour)
            return { hour, visits: row?.visits ?? 0, orders: row?.orders ?? 0 }
        })

        const dailyRows = await prisma.$queryRaw<
            { day: Date; visits: bigint; orders: bigint }[]
        >`
            SELECT
                date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${IRAN_TZ}) AS day,
                COUNT(*) FILTER (WHERE "type" = 'PAGE_VIEW')    AS visits,
                COUNT(*) FILTER (WHERE "type" = 'ORDER_SUBMIT') AS orders
            FROM "AnalyticsEvent"
            WHERE "type" IN ('PAGE_VIEW', 'ORDER_SUBMIT')
              AND "createdAt" >= ${start30}
            GROUP BY day
        `
        // Key buckets by Iran-local YYYY-MM-DD so each calendar day lines up
        // regardless of the server's timezone.
        const iranDayKey = (d: Date) =>
            new Intl.DateTimeFormat('en-CA', {
                timeZone: IRAN_TZ,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(d)
        const dailyByDay = new Map(
            dailyRows.map(r => [
                iranDayKey(new Date(r.day)),
                { visits: Number(r.visits), orders: Number(r.orders) },
            ])
        )
        const daily = Array.from({ length: 30 }, (_, index) => {
            const dayStart = new Date(now.getTime() - (29 - index) * DAY_MS)
            const row = dailyByDay.get(iranDayKey(dayStart))
            return {
                label: dayStart.toLocaleDateString('fa-IR', { day: '2-digit', month: '2-digit' }),
                visits: row?.visits ?? 0,
                logins: row?.orders ?? 0,
            }
        })

        // 9. Device & Browser Breakdowns using database groupBy
        const devicesList = ['desktop', 'mobile', 'tablet']
        const deviceData = await analyticsEventClient.groupBy({
            by: ['device', 'type'],
            where: {
                type: { in: ['PAGE_VIEW', 'ORDER_SUBMIT'] },
                device: { in: devicesList },
                createdAt: { gte: start30 }
            },
            _count: { _all: true }
        })

        const deviceCounts: Record<string, { visits: number; orders: number }> = {}
        devicesList.forEach(dev => { deviceCounts[dev] = { visits: 0, orders: 0 } })
        deviceData.forEach((item: any) => {
            const dev = item.device;
            if (dev && deviceCounts[dev]) {
                if (item.type === 'PAGE_VIEW') {
                    deviceCounts[dev].visits += item._count._all;
                } else if (item.type === 'ORDER_SUBMIT') {
                    deviceCounts[dev].orders += item._count._all;
                }
            }
        })
        const devicesMetrics = devicesList.map(dev => {
            const { visits, orders } = deviceCounts[dev];
            const rate = visits > 0 ? (orders / visits) * 100 : 0
            return {
                name: dev,
                visits,
                orders,
                conversionRate: rate
            }
        }).filter(d => d.visits > 0)

        const browsersList = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Other']
        const browserData = await analyticsEventClient.groupBy({
            by: ['browser', 'type'],
            where: {
                type: { in: ['PAGE_VIEW', 'ORDER_SUBMIT'] },
                browser: { in: browsersList },
                createdAt: { gte: start30 }
            },
            _count: { _all: true }
        })

        const browserCounts: Record<string, { visits: number; orders: number }> = {}
        browsersList.forEach(b => { browserCounts[b] = { visits: 0, orders: 0 } })
        browserData.forEach((item: any) => {
            const browser = item.browser;
            if (browser && browserCounts[browser]) {
                if (item.type === 'PAGE_VIEW') {
                    browserCounts[browser].visits += item._count._all;
                } else if (item.type === 'ORDER_SUBMIT') {
                    browserCounts[browser].orders += item._count._all;
                }
            }
        })
        const browsersMetrics = browsersList.map(browser => {
            const { visits, orders } = browserCounts[browser];
            const rate = visits > 0 ? (orders / visits) * 100 : 0
            return {
                name: browser,
                visits,
                orders,
                conversionRate: rate
            }
        }).filter(b => b.visits > 0)

        // 10. Page Speed Reports using database groupBy
        const speedData = await analyticsEventClient.groupBy({
            by: ['path'],
            where: {
                type: 'SPEED_LOG',
                path: { not: null },
                createdAt: { gte: start30 }
            },
            _count: {
                loadTime: true
            },
            _sum: {
                loadTime: true,
                imageSize: true
            }
        })

        const speedErrorData = await analyticsEventClient.groupBy({
            by: ['path'],
            where: {
                type: 'SPEED_LOG',
                path: { not: null },
                hasErrors: true,
                createdAt: { gte: start30 }
            },
            _count: { _all: true }
        })

        const errorMap: Record<string, number> = {}
        speedErrorData.forEach((item: any) => {
            if (item.path) errorMap[item.path] = item._count._all;
        })

        const speedMetrics = speedData.map((item: any) => {
            const path = item.path!;
            const count = item._count.loadTime || 0;
            const totalTime = item._sum.loadTime || 0;
            const totalSize = item._sum.imageSize || 0;
            const errorCount = errorMap[path] || 0;

            return {
                path,
                avgLoadTime: count > 0 ? Math.round(totalTime / count) : 0,
                avgImageSize: count > 0 ? Math.round(totalSize / count) : 0,
                errorCount
            }
        })
        .sort((a: any, b: any) => b.avgLoadTime - a.avgLoadTime)
        .slice(0, 10)

        return (
            <AnalyticsDashboard
                hasData={hasData}
                summary={{
                    visitsToday,
                    visits7Days,
                    visits30Days,
                    userLogins30Days,
                    socialVisits30Days,
                    searchVisits30Days,
                    conversionRate,
                }}
                daily={daily}
                funnel={{
                    pageViews: visits30Days,
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
