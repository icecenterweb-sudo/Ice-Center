'use client';

import { useState, useEffect } from 'react';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';

// Module-level single-flight promise — Header and Footer share one fetch per page load (#28)
let sharedFetch: Promise<SiteSettings | null> | null = null;
function getSharedSettings(): Promise<SiteSettings | null> {
    if (!sharedFetch) {
        sharedFetch = fetch('/api/settings')
            .then(async (res) => {
                if (!res.ok) return null;
                const data = await res.json();
                return (data.settings as SiteSettings) ?? null;
            })
            .catch((err) => {
                console.error('Failed to load site settings:', err);
                return null;
            });
    }
    return sharedFetch;
}

export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getSharedSettings().then((data) => {
            if (data && isMounted) setSettings(data);
            if (isMounted) setLoading(false);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    return { settings, loading };
}
