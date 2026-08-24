'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Invoke `handler` when a pointer/keydown event lands outside the referenced element.
 * Shared replacement for the copy-pasted document listeners (#33).
 */
export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    handler: () => void,
    enabled: boolean = true
): void {
    useEffect(() => {
        if (!enabled) return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const el = ref.current;
            if (el && !el.contains(event.target as Node)) {
                handler();
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handler();
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [ref, handler, enabled]);
}
