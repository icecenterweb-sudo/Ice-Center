'use client';

import { useState, useEffect } from 'react';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';

export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings && isMounted) {
                        setSettings(data.settings);
                    }
                }
            } catch (error) {
                console.error('Failed to load site settings:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    return { settings, loading };
}
