import { connection } from 'next/server'
import { prisma } from '@/lib/db'
import AnalyticsDashboard from './AnalyticsDashboard'

type AnalyticsEventForReport = {
    type: 'PAGE_VIEW' | 'USER_LOGIN' | 'ADMIN_LOGIN'
    path: string | null
    source: string
    medium: string | null
    device: string | null
    createdAt: Date
}

const DAY_MS = 24 * 60 * 60 * 1000

export default async function AdminAnalyticsPage() {
    await connection()
    const now = new Date()
    const start90 = startOfDay(new Date(now.getTime() - 89 * DAY_MS))

    const events = await loadEvents(start90)
    const startToday = startOfDay(now)
    const start7 = startOfDay(new Date(now.getTime() - 6 * DAY_MS))
    const start30 = startOfDay(new Date(now.getTime() - 29 * DAY_MS))

    const visits30 = events.filter((event) => event.type === 'PAGE_VIEW' && event.createdAt >= start30)
    const logins30 = events.filter((event) => event.type === 'USER_LOGIN' && event.createdAt >= start30)
    const socialVisits30 = visits30.filter((event) => event.medium === 'social')
    const searchVisits30 = visits30.filter((event) => event.medium === 'search')

    return (
        <AnalyticsDashboard
            hasData={events.length > 0}
            summary={{
                visitsToday: count(events, 'PAGE_VIEW', startToday),
                visits7Days: count(events, 'PAGE_VIEW', start7),
                visits30Days: visits30.length,
                userLogins30Days: logins30.length,
                socialVisits30Days: socialVisits30.length,
                searchVisits30Days: searchVisits30.length,
                conversionRate: visits30.length > 0 ? (logins30.length / visits30.length) * 100 : 0,
            }}
            daily={buildDailySeries(events, now)}
            weekly={buildWeeklySeries(events, now)}
            monthly={buildMonthlySeries(events, now)}
            socialSources={topCounts(socialVisits30.map((event) => event.source), 6)}
            loginSources={topCounts(logins30.map((event) => event.source), 6)}
            topPages={topCounts(visits30.map((event) => event.path || '/'), 8)}
            devices={topCounts(visits30.map((event) => event.device || 'unknown'), 6)}
        />
    )
}

async function loadEvents(startDate: Date): Promise<AnalyticsEventForReport[]> {
    try {
        const analyticsEventClient = (prisma as any).analyticsEvent;
        if (!analyticsEventClient) {
            console.warn('Prisma client has not been regenerated with AnalyticsEvent model.');
            return [];
        }
        return await analyticsEventClient.findMany({
            where: { createdAt: { gte: startDate } },
            select: {
                type: true,
                path: true,
                source: true,
                medium: true,
                device: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
            take: 20000,
        })
    } catch (error) {
        if (isMissingAnalyticsTable(error)) return []
        throw error
    }
}

function count(events: AnalyticsEventForReport[], type: AnalyticsEventForReport['type'], from: Date): number {
    return events.filter((event) => event.type === type && event.createdAt >= from).length
}

function buildDailySeries(events: AnalyticsEventForReport[], now: Date) {
    return Array.from({ length: 30 }, (_, index) => {
        const day = startOfDay(new Date(now.getTime() - (29 - index) * DAY_MS))
        const next = new Date(day.getTime() + DAY_MS)
        return {
            label: day.toLocaleDateString('fa-IR', { day: '2-digit', month: '2-digit' }),
            visits: countInRange(events, 'PAGE_VIEW', day, next),
            logins: countInRange(events, 'USER_LOGIN', day, next),
        }
    })
}

function buildWeeklySeries(events: AnalyticsEventForReport[], now: Date) {
    return Array.from({ length: 12 }, (_, index) => {
        const start = startOfDay(new Date(now.getTime() - (11 - index) * 7 * DAY_MS))
        const end = new Date(start.getTime() + 7 * DAY_MS)
        return {
            label: `هفته ${index + 1}`,
            visits: countInRange(events, 'PAGE_VIEW', start, end),
            logins: countInRange(events, 'USER_LOGIN', start, end),
        }
    })
}

function buildMonthlySeries(events: AnalyticsEventForReport[], now: Date) {
    return Array.from({ length: 6 }, (_, index) => {
        const start = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
        return {
            label: start.toLocaleDateString('fa-IR', { month: 'short' }),
            visits: countInRange(events, 'PAGE_VIEW', start, end),
            logins: countInRange(events, 'USER_LOGIN', start, end),
        }
    })
}

function countInRange(events: AnalyticsEventForReport[], type: AnalyticsEventForReport['type'], start: Date, end: Date): number {
    return events.filter((event) => event.type === type && event.createdAt >= start && event.createdAt < end).length
}

function topCounts(values: string[], limit: number) {
    const counts = new Map<string, number>()
    for (const value of values) {
        counts.set(value, (counts.get(value) || 0) + 1)
    }
    return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isMissingAnalyticsTable(error: unknown): boolean {
    return typeof error === 'object'
        && error !== null
        && 'code' in error
        && String(error.code) === 'P2021'
}
