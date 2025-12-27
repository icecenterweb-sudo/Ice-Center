'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollToTop component - ensures page scrolls to top on navigation
 * This fixes the issue where skeleton loading causes scroll position issues
 */
export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Scroll to top when the pathname changes
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);

    return null;
}
