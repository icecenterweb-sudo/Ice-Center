'use client';

import React from 'react';

export type ScrollbarVariant = 
    | 'sleek' 
    | 'oceanic' 
    | 'cyberpunk' 
    | 'glass' 
    | 'luxury' 
    | 'hide' 
    | 'custom';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ScrollbarVariant;
    children: React.ReactNode;
}

/**
 * ScrollArea - A premium utility wrapper for scrollable elements.
 * 
 * Available scroll models (variants):
 * - 'sleek': Minimalist, subtle gray thin scrollbar (default)
 * - 'oceanic': Beautiful gradient cyan/blue (Ice Center brand match)
 * - 'cyberpunk': Glowing neon cyberpunk theme
 * - 'glass': Semitransparent glassmorphic theme with blur filter
 * - 'luxury': Premium gold gradient
 * - 'hide': Hidden scrollbar but keeps scrolling functionality
 * - 'custom': Sidebar style light custom scrollbar
 */
export default function ScrollArea({
    variant = 'sleek',
    children,
    className = '',
    ...props
}: ScrollAreaProps) {
    const variantClasses: Record<ScrollbarVariant, string> = {
        sleek: 'scrollbar-sleek',
        oceanic: 'scrollbar-oceanic',
        cyberpunk: 'scrollbar-cyberpunk',
        glass: 'scrollbar-glass',
        luxury: 'scrollbar-luxury',
        hide: 'scrollbar-hide',
        custom: 'custom-scrollbar',
    };

    const scrollClass = variantClasses[variant] || 'scrollbar-sleek';

    return (
        <div
            className={`overflow-auto ${scrollClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
