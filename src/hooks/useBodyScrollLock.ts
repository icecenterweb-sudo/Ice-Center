'use client';

import { useEffect } from 'react';

/**
 * Locks body scrolling while `locked` is true (NEW-2: consistent modal
 * behaviour). Uses the same effect pattern as AuthModal/MobileSearchOverlay.
 */
export function useBodyScrollLock(locked: boolean): void {
    useEffect(() => {
        if (!locked) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [locked]);
}
