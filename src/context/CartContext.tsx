'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { recordClientEvent } from '@/lib/client-analytics'

const CART_STORAGE_KEY = 'ice_center_cart'

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

interface CartItem {
    id?: number
    productId: number
    quantity: number
    product: CartProduct
}

interface CartContextType {
    items: CartItem[]
    isLoading: boolean
    isOpen: boolean
    itemCount: number
    totalPrice: number
    openCart: () => void
    closeCart: () => void
    toggleCart: () => void
    addItem: (product: CartProduct, quantity?: number) => Promise<void>
    updateQuantity: (productId: number, quantity: number) => Promise<void>
    removeItem: (productId: number) => Promise<void>
    clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const [items, setItems] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    // Calculate derived values
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

    // Load cart from localStorage
    const loadLocalCart = useCallback(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) {
                    setItems(parsed)
                }
            }
        } catch (e) {
            console.error('Failed to load local cart:', e)
        }
    }, [])

    // Persist guest cart to localStorage outside of state updaters (#8)
    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
            } catch (e) {
                console.error('Failed to save local cart:', e)
            }
        }
    }, [items, isAuthenticated, isLoading])

    // Fetch cart from API
    const fetchCart = useCallback(async () => {
        try {
            const res = await fetch('/api/cart')
            const data = await res.json()
            if (data.items && Array.isArray(data.items)) {
                setItems(data.items)
            }
        } catch (e) {
            console.error('Failed to fetch cart:', e)
        }
    }, [])

    // Sync local cart to server after login (#7 sequential flow)
    const syncCart = useCallback(async (): Promise<boolean> => {
        const localCart = localStorage.getItem(CART_STORAGE_KEY)
        if (!localCart) return false

        try {
            const localItems = JSON.parse(localCart) as CartItem[]
            if (!Array.isArray(localItems) || localItems.length === 0) {
                localStorage.removeItem(CART_STORAGE_KEY)
                return false
            }

            const syncItems = localItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))

            const res = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: syncItems })
            })

            if (res.ok) {
                localStorage.removeItem(CART_STORAGE_KEY)
                const data = await res.json()
                if (data.items && Array.isArray(data.items)) {
                    setItems(data.items)
                }
                return true
            }
        } catch (e) {
            console.error('Failed to sync cart:', e)
        }
        return false
    }, [])

    // Initialize cart sequentially to prevent race conditions (#7)
    useEffect(() => {
        if (authLoading) return

        let isCancelled = false
        const initCart = async () => {
            setIsLoading(true)
            if (isAuthenticated) {
                const didSync = await syncCart()
                if (!didSync && !isCancelled) {
                    await fetchCart()
                }
            } else {
                loadLocalCart()
            }
            if (!isCancelled) {
                setIsLoading(false)
            }
        }

        initCart()
        return () => {
            isCancelled = true
        }
    }, [isAuthenticated, authLoading, syncCart, fetchCart, loadLocalCart])

    // Cart operations
    const openCart = useCallback(() => setIsOpen(true), [])
    const closeCart = useCallback(() => setIsOpen(false), [])
    const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

    const addItem = useCallback(async (product: CartProduct, quantity = 1) => {
        recordClientEvent('ADD_TO_CART', { productId: product.id })
        if (isAuthenticated) {
            // API call
            try {
                const res = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: product.id, quantity })
                })

                if (res.ok) {
                    const data = await res.json()
                    setItems(prev => {
                        const existing = prev.findIndex(i => i.productId === product.id)
                        if (existing >= 0) {
                            const updated = [...prev]
                            updated[existing] = data.item
                            return updated
                        }
                        return [...prev, data.item]
                    })
                    toast.success('به سبد خرید اضافه شد')
                } else {
                    const data = await res.json()
                    toast.error(data.error || 'خطا در افزودن به سبد')
                }
            } catch {
                toast.error('خطا در ارتباط با سرور')
            }
        } else {
            // Local state (pure updater, stock-capped) (#8, #21)
            setItems(prev => {
                const existing = prev.findIndex(i => i.productId === product.id)
                const maxStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : Infinity
                if (existing >= 0) {
                    const currentQty = prev[existing].quantity
                    const newQty = Math.min(currentQty + quantity, maxStock)
                    const updated = [...prev]
                    updated[existing] = {
                        ...prev[existing],
                        quantity: newQty,
                        product: { ...product }
                    }
                    return updated
                } else {
                    const initialQty = Math.min(quantity, maxStock)
                    return [...prev, { productId: product.id, quantity: initialQty, product }]
                }
            })
            toast.success('به سبد خرید اضافه شد')
        }
    }, [isAuthenticated])

    const removeItem = useCallback(async (productId: number) => {
        if (isAuthenticated) {
            try {
                const res = await fetch('/api/cart/remove', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                })

                if (res.ok) {
                    setItems(prev => prev.filter(i => i.productId !== productId))
                    toast.success('از سبد حذف شد')
                }
            } catch {
                toast.error('خطا در حذف')
            }
        } else {
            // Pure updater (#8)
            setItems(prev => prev.filter(i => i.productId !== productId))
            toast.success('از سبد حذف شد')
        }
    }, [isAuthenticated])

    const updateQuantity = useCallback(async (productId: number, quantity: number) => {
        if (quantity < 1) {
            await removeItem(productId)
            return
        }

        if (isAuthenticated) {
            try {
                const res = await fetch('/api/cart/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, quantity })
                })

                if (res.ok) {
                    const data = await res.json()
                    setItems(prev => prev.map(i =>
                        i.productId === productId ? data.item : i
                    ))
                }
            } catch {
                toast.error('خطا در بروزرسانی')
            }
        } else {
            // Pure updater with stock capping (#8, #21)
            setItems(prev => prev.map(i => {
                if (i.productId === productId) {
                    const maxStock = typeof i.product.stock === 'number' && i.product.stock > 0 ? i.product.stock : Infinity
                    return { ...i, quantity: Math.min(quantity, maxStock) }
                }
                return i
            }))
        }
    }, [isAuthenticated, removeItem])

    const clearCart = useCallback(async () => {
        setItems([])
        localStorage.removeItem(CART_STORAGE_KEY)
        if (isAuthenticated) {
            try {
                await fetch('/api/cart', { method: 'DELETE' })
            } catch (err) {
                console.error('Failed to clear server cart:', err)
            }
        }
    }, [isAuthenticated])

    // Memoize the context value so consumers only re-render on real changes (#33/L2)
    const value = useMemo(() => ({
        items,
        isLoading,
        isOpen,
        itemCount,
        totalPrice,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart
    }), [items, isLoading, isOpen, itemCount, totalPrice, openCart, closeCart, toggleCart, addItem, updateQuantity, removeItem, clearCart])

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
