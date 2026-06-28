'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
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
    clearCart: () => void
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
                setItems(parsed)
            }
        } catch (e) {
            console.error('Failed to load local cart:', e)
        }
        setIsLoading(false)
    }, [])

    // Save cart to localStorage
    const saveLocalCart = useCallback((cartItems: CartItem[]) => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
        } catch (e) {
            console.error('Failed to save local cart:', e)
        }
    }, [])

    // Fetch cart from API
    const fetchCart = useCallback(async () => {
        try {
            const res = await fetch('/api/cart')
            const data = await res.json()
            if (data.items) {
                setItems(data.items)
            }
        } catch (e) {
            console.error('Failed to fetch cart:', e)
        }
    }, [])

    // Sync local cart to server after login
    const syncCart = useCallback(async () => {
        const localCart = localStorage.getItem(CART_STORAGE_KEY)
        if (!localCart) return

        try {
            const localItems = JSON.parse(localCart) as CartItem[]
            if (localItems.length === 0) return

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
                setItems(data.items)
            }
        } catch (e) {
            console.error('Failed to sync cart:', e)
        }
    }, [])

    // Initialize cart
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (authLoading) return

        if (isAuthenticated) {
            // Sync local cart and fetch server cart in parallel
            Promise.allSettled([syncCart(), fetchCart()])
                .then(() => setIsLoading(false))
        } else {
            loadLocalCart()
        }
    }, [isAuthenticated, authLoading, syncCart, fetchCart, loadLocalCart])
    /* eslint-enable react-hooks/set-state-in-effect */

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
            // Local storage
            setItems(prev => {
                const existing = prev.findIndex(i => i.productId === product.id)
                let updated: CartItem[]
                if (existing >= 0) {
                    updated = [...prev]
                    updated[existing] = {
                        ...updated[existing],
                        quantity: updated[existing].quantity + quantity
                    }
                } else {
                    updated = [...prev, { productId: product.id, quantity, product }]
                }
                saveLocalCart(updated)
                return updated
            })
            toast.success('به سبد خرید اضافه شد')
        }
    }, [isAuthenticated, saveLocalCart])

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
            setItems(prev => {
                const updated = prev.filter(i => i.productId !== productId)
                saveLocalCart(updated)
                return updated
            })
            toast.success('از سبد حذف شد')
        }
    }, [isAuthenticated, saveLocalCart])

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
            setItems(prev => {
                const updated = prev.map(i =>
                    i.productId === productId ? { ...i, quantity } : i
                )
                saveLocalCart(updated)
                return updated
            })
        }
    }, [isAuthenticated, removeItem, saveLocalCart])

    const clearCart = useCallback(() => {
        setItems([])
        localStorage.removeItem(CART_STORAGE_KEY)
    }, [])

    return (
        <CartContext.Provider value={{
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
        }}>
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
