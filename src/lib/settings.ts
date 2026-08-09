import { prisma } from '@/lib/db';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
import { connection } from 'next/server';

export { type SiteSettings, DEFAULT_SITE_SETTINGS };

let inMemoryCache: { data: SiteSettings; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        await connection();
    } catch {
        // Outside request lifecycle
    }

    const now = Date.now();
    if (inMemoryCache && now - inMemoryCache.timestamp < CACHE_TTL_MS) {
        return inMemoryCache.data;
    }

    try {
        const dbSettings = await prisma.siteSetting.findMany();
        const settingsMap: Record<string, string> = {};

        for (const item of dbSettings) {
            settingsMap[item.key] = item.value;
        }

        const settings: SiteSettings = {
            siteTitle: settingsMap.siteTitle ?? DEFAULT_SITE_SETTINGS.siteTitle,
            siteSlogan: settingsMap.siteSlogan ?? DEFAULT_SITE_SETTINGS.siteSlogan,
            // `||` (not `??`) so a saved-but-empty value falls back to the default
            // brand assets — an empty string in the DB should still show the logo/favicon.
            siteLogo: settingsMap.siteLogo || DEFAULT_SITE_SETTINGS.siteLogo,
            faviconUrl: settingsMap.faviconUrl || DEFAULT_SITE_SETTINGS.faviconUrl,
            phone: settingsMap.phone ?? DEFAULT_SITE_SETTINGS.phone,
            phoneFormatted: settingsMap.phoneFormatted ?? DEFAULT_SITE_SETTINGS.phoneFormatted,
            email: settingsMap.email ?? DEFAULT_SITE_SETTINGS.email,
            address: settingsMap.address ?? DEFAULT_SITE_SETTINGS.address,
            workingHours: settingsMap.workingHours ?? DEFAULT_SITE_SETTINGS.workingHours,
            aboutText: settingsMap.aboutText ?? DEFAULT_SITE_SETTINGS.aboutText,
            instagramUrl: settingsMap.instagramUrl ?? DEFAULT_SITE_SETTINGS.instagramUrl,
            telegramUrl: settingsMap.telegramUrl ?? DEFAULT_SITE_SETTINGS.telegramUrl,
            announcementText: settingsMap.announcementText ?? DEFAULT_SITE_SETTINGS.announcementText,
        };

        inMemoryCache = { data: settings, timestamp: now };
        return settings;
    } catch (error) {
        console.error('Failed to fetch site settings from DB, using defaults:', error);
        return DEFAULT_SITE_SETTINGS;
    }
}

export async function updateSiteSettings(newSettings: Partial<SiteSettings>): Promise<SiteSettings> {
    const keys = Object.keys(newSettings) as (keyof SiteSettings)[];

    for (const key of keys) {
        const val = newSettings[key];
        if (typeof val === 'string') {
            await prisma.siteSetting.upsert({
                where: { key },
                update: { value: val },
                create: { key, value: val },
            });
        }
    }

    // Invalidate cache
    inMemoryCache = null;
    try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/', 'layout');
    } catch {
        // Ignore outside request lifecycle
    }

    return getSiteSettings();
}
