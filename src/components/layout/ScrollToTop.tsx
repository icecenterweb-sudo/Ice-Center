'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollToTop component (#24)
 * Ensures page scrolls to top on intentional forward navigation,
 * while preserving native browser scroll restoration on Back/Forward (popstate) navigation.
 */
export default function ScrollToTop() {
    const pathname = usePathname();
    const isPopStateRef = useRef(false);
    const prevPathnameRef = useRef(pathname);

    useEffect(() => {
        const handlePopState = () => {
            isPopStateRef.current = true;
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        // Skip if pathname has not changed
        if (prevPathnameRef.current === pathname) {
            return;
        }
        prevPathnameRef.current = pathname;

        // Preserve scroll position on browser back/forward (popstate) navigation
        if (isPopStateRef.current) {
            isPopStateRef.current = false;
            return;
        }

        // Scroll to top on intentional forward route change
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);

    return null;
}
