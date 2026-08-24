'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WishlistContextType {
    wishlistProductIds: Set<number>;
    isLoading: boolean;
    isHydrated: boolean;
    toggleWishlist: (productId: number) => Promise<void>;
    isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [ids, setIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    // Single shared hydration flag instead of one effect per button (#33)
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const fetchWishlist = useCallback(async () => {
        try {
            const res = await fetch('/api/wishlist');
            if (res.ok) {
                const data = await res.json();
                setIds(new Set(data.items?.map((i: { productId: number }) => i.productId) || []));
            } else {
                setIds(new Set());
            }
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
            setIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        
        if (!isAuthenticated) {
            setIds(new Set());
            setIsLoading(false);
            return;
        }

        fetchWishlist();
    }, [isAuthenticated, authLoading, fetchWishlist]);

    const isInWishlist = useCallback((productId: number) => ids.has(productId), [ids]);

    const toggleWishlist = useCallback(async (productId: number) => {
        if (!isAuthenticated) {
            return;
        }

        const isCurrentlyIn = ids.has(productId);

        // Optimistic update
        setIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyIn) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });

        try {
            let ok = false;
            if (isCurrentlyIn) {
                const res = await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
                ok = res.ok;
            } else {
                const res = await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId }),
                });
                ok = res.ok;
            }

            // HTTP-level failures don't throw — revert explicitly (#10)
            if (!ok) {
                throw new Error(`wishlist request failed for product ${productId}`);
            }
        } catch (error) {
            console.error('Wishlist toggle failed, reverting:', error);
            // Revert state on error
            setIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyIn) {
                    next.add(productId);
                } else {
                    next.delete(productId);
                }
                return next;
            });
        }
    }, [ids, isAuthenticated]);

    return (
        <WishlistContext.Provider value={{ wishlistProductIds: ids, isLoading, isHydrated, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
