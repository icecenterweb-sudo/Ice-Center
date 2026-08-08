'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { toPersianDigits } from '@/lib/persian'

export default function CartDrawer() {
    const {
        items,
        isOpen,
        closeCart,
        itemCount,
        totalPrice,
        updateQuantity,
        removeItem
    } = useCart()

    const formatPrice = (price: number) => {
        return toPersianDigits(price.toLocaleString('fa-IR'))
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                سبد خرید
                                {itemCount > 0 && (
                                    <span className="bg-ocean text-white text-xs px-2 py-0.5 rounded-full">
                                        {toPersianDigits(itemCount)}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={closeCart}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">سبد خرید خالی است</p>
                                    <p className="text-sm mt-1">محصولات مورد نظر خود را اضافه کنید</p>
                                    <button
                                        onClick={closeCart}
                                        className="mt-6 px-6 py-2 bg-ocean text-white rounded-lg hover:bg-royal transition-colors"
                                    >
                                        ادامه خرید
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex gap-3 p-3 bg-gray-50 rounded-xl"
                                        >
                                            {/* Image */}
                                            <Link
                                                href={`/products/${item.product.slug}`}
                                                onClick={closeCart}
                                                className="relative w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0"
                                            >
                                                {item.product.thumbnail ? (
                                                    <Image
                                                        src={item.product.thumbnail}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-contain p-1"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </Link>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/products/${item.product.slug}`}
                                                    onClick={closeCart}
                                                    className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-ocean transition-colors"
                                                >
                                                    {item.product.name}
                                                </Link>

                                                <div className="flex items-center justify-between mt-2">
                                                    {/* Quantity controls */}
                                                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="p-1.5 hover:bg-gray-50 rounded-r-lg transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4 text-ocean" />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-medium text-black">
                                                            {toPersianDigits(item.quantity)}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (item.quantity === 1) {
                                                                    removeItem(item.productId)
                                                                } else {
                                                                    updateQuantity(item.productId, item.quantity - 1)
                                                                }
                                                            }}
                                                            className="p-1.5 hover:bg-gray-50 rounded-l-lg transition-colors"
                                                        >
                                                            {item.quantity === 1 ? (
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            ) : (
                                                                <Minus className="w-4 h-4 text-gray-500" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-gray-800">
                                                            {formatPrice(item.product.price * item.quantity)}
                                                        </p>
                                                        <p className="text-xs text-gray-400">تومان</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="border-t border-gray-100 p-4 space-y-4">
                                {/* Total */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">جمع کل</span>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-gray-800">
                                            {formatPrice(totalPrice)}
                                        </p>
                                        <p className="text-xs text-gray-400">تومان</p>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <Link
                                    href="/checkout"
                                    onClick={closeCart}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-midnight hover:bg-[#0c2440] text-white font-bold rounded-xl transition-all"
                                >
                                    <span>تکمیل سفارش</span>
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>

                                {/* Continue Shopping */}
                                <button
                                    onClick={closeCart}
                                    className="w-full py-2.5 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                                >
                                    ادامه خرید
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
