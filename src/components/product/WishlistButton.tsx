'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';

interface WishlistButtonProps {
    productId: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ productId, className = '', size = 'md' }: WishlistButtonProps) {
    const { isInWishlist, toggleWishlist, isLoading: contextLoading } = useWishlist();
    const { isAuthenticated } = useAuth();
    const [toggling, setToggling] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const isFav = hydrated && isInWishlist(productId);

    async function handleToggle(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (toggling || !isAuthenticated) return;

        setToggling(true);
        try {
            await toggleWishlist(productId);
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        } finally {
            setToggling(false);
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

    // Don't render anything different during SSR to avoid hydration mismatch
    if (!hydrated) {
        return (
            <button
                className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/90 backdrop-blur border border-gray-200 text-gray-400 ${className}`}
                disabled
            >
                <Heart className={iconSizes[size]} />
            </button>
        );
    }

    const isDisabled = !isAuthenticated || contextLoading || toggling;

    return (
        <button
            onClick={handleToggle}
            disabled={isDisabled}
            className={`
                ${sizeClasses[size]} 
                flex items-center justify-center rounded-full 
                transition-[background-color,border-color,color] duration-[150ms] ease-out active-press
                ${isFav
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-white/90 backdrop-blur border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
                }
                border disabled:opacity-50
                ${className}
            `}
            title={!isAuthenticated ? 'برای افزودن به علاقه‌مندی‌ها وارد شوید' : isFav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        >
            {toggling ? (
                <Loader2 className={`${iconSizes[size]} animate-spin`} />
            ) : (
                <Heart className={`${iconSizes[size]} ${isFav ? 'fill-current' : ''}`} />
            )}
        </button>
    );
}
