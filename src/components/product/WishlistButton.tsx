'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';

interface WishlistButtonProps {
    productId: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ productId, className = '', size = 'md' }: WishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Check if product is in wishlist on mount
    useEffect(() => {
        setHydrated(true);
        checkWishlistStatus();
    }, [productId]);

    async function checkWishlistStatus() {
        try {
            const res = await fetch('/api/wishlist');
            if (res.ok) {
                const data = await res.json();
                const isIn = data.items?.some((item: any) => item.productId === productId);
                setIsInWishlist(isIn);
            }
        } catch (error) {
            // User not logged in or error - ignore
        }
    }

    async function toggleWishlist(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (loading) return;
        setLoading(true);

        try {
            if (isInWishlist) {
                // Remove from wishlist
                await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
                setIsInWishlist(false);
            } else {
                // Add to wishlist
                const res = await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId }),
                });
                if (res.ok) {
                    setIsInWishlist(true);
                }
            }
        } catch (error) {
            console.error('Wishlist error:', error);
        } finally {
            setLoading(false);
        }
    }

    const sizeClasses = {
        sm: 'w-7 h-7',
        md: 'w-9 h-9',
        lg: 'w-11 h-11',
    };

    const iconSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    // Don't render anything during SSR to avoid hydration mismatch
    if (!hydrated) {
        return (
            <button
                className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/90 backdrop-blur border border-gray-200 text-gray-400 ${className}`}
            >
                <Heart className={iconSizes[size]} />
            </button>
        );
    }

    return (
        <button
            onClick={toggleWishlist}
            disabled={loading}
            className={`
                ${sizeClasses[size]} 
                flex items-center justify-center rounded-full 
                transition-all duration-200
                ${isInWishlist
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-white/90 backdrop-blur border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
                }
                border disabled:opacity-50
                ${className}
            `}
            title={isInWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        >
            {loading ? (
                <Loader2 className={`${iconSizes[size]} animate-spin`} />
            ) : (
                <Heart className={`${iconSizes[size]} ${isInWishlist ? 'fill-current' : ''}`} />
            )}
        </button>
    );
}
