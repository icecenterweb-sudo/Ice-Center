'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/context/CartContext'

interface CartProduct {
    id: number
    name: string
    slug: string
    price: number
    listPrice: number | null
    thumbnail: string | null
    stock: number
    inventoryStatus?: string
}

interface AddToCartButtonProps {
    product: CartProduct
    quantity?: number
    variant?: 'default' | 'small' | 'icon'
    className?: string
}

export default function AddToCartButton({
    product,
    quantity = 1,
    variant = 'default',
    className = ''
}: AddToCartButtonProps) {
    const { addItem, openCart } = useCart()
    const [isAdding, setIsAdding] = useState(false)
    const [added, setAdded] = useState(false)
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clear the pending reset timer on unmount (#33)
    useEffect(() => {
        return () => {
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
        }
    }, [])

    const handleClick = async () => {
        if (isAdding || added) return

        setIsAdding(true)
        await addItem(product, quantity)
        setIsAdding(false)
        setAdded(true)

        // Open cart drawer for immediate user feedback
        openCart()

        // Reset after animation
        resetTimerRef.current = setTimeout(() => {
            setAdded(false)
        }, 2000)
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={handleClick}
                disabled={isAdding}
                className={`p-2 rounded-lg border border-gray-200 hover:border-ocean hover:bg-frost transition-all ${className}`}
            >
                {isAdding ? (
                    <div className="w-5 h-5 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
                ) : added ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                    <ShoppingCart className="w-5 h-5 text-gray-600" />
                )}
            </button>
        )
    }

    if (variant === 'small') {
        return (
            <button
                onClick={handleClick}
                disabled={isAdding}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-ocean hover:bg-royal text-white'
                    } ${className}`}
            >
                {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : added ? (
                    <>
                        <Check className="w-4 h-4" />
                        <span>اضافه شد</span>
                    </>
                ) : (
                    <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>افزودن</span>
                    </>
                )}
            </button>
        )
    }

    // Default variant
    return (
        <button
            onClick={handleClick}
            disabled={isAdding}
            className={`flex items-center justify-center gap-2 w-full py-3.5 font-bold rounded-xl transition-all ${added
                ? 'bg-emerald-600 text-white'
                : 'bg-ocean hover:bg-royal text-white shadow-md hover:shadow-lg'
                } ${className}`}
        >
            {isAdding ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : added ? (
                <>
                    <Check className="w-5 h-5" />
                    <span>به سبد اضافه شد</span>
                </>
            ) : (
                <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>افزودن به سبد خرید</span>
                </>
            )}
        </button>
    )
}
