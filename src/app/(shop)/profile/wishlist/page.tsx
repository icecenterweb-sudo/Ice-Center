'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Heart, ShoppingBag, Trash2, Loader2, ShoppingCart } from 'lucide-react';

interface WishlistProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    inventoryStatus: string;
}

interface WishlistItem {
    id: number;
    productId: number;
    createdAt: string;
    product: WishlistProduct;
}

export default function WishlistPage() {
    const router = useRouter();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        fetchWishlist();
    }, []);

    async function fetchWishlist() {
        try {
            const res = await fetch('/api/wishlist');
            const data = await res.json();
            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove(productId: number) {
        setRemovingId(productId);
        try {
            await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((item) => item.productId !== productId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        } finally {
            setRemovingId(null);
        }
    }

    async function handleAddToCart(productId: number) {
        try {
            await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: 1 }),
            });
            // Optionally show toast notification
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    return (
        <div className="pb-20 lg:pb-0">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-sm font-bold text-gray-800">لیست علاقه‌مندی‌ها</h1>
                    {items.length > 0 && (
                        <span className="ml-auto text-xs text-gray-500">{items.length} محصول</span>
                    )}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">لیست علاقه‌مندی‌ها</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {items.length > 0 ? `${items.length} محصول در لیست شما` : 'محصولات مورد علاقه شما'}
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-ocean mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">در حال بارگذاری...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800 mb-2">
                        لیست علاقه‌مندی خالی است
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">
                        محصولات مورد علاقه خود را به این لیست اضافه کنید
                    </p>
                    <button
                        onClick={() => router.push('/categories')}
                        className="inline-flex items-center gap-2 bg-ocean hover:bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        مشاهده محصولات
                    </button>
                </div>
            )}

            {/* Wishlist Items */}
            {!loading && items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl p-4 shadow-sm flex gap-4"
                        >
                            {/* Product Image */}
                            <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden">
                                    {item.product.thumbnail ? (
                                        <img
                                            src={item.product.thumbnail}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <Link href={`/products/${item.product.slug}`}>
                                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-ocean transition-colors">
                                        {item.product.name}
                                    </h3>
                                </Link>

                                {/* Price */}
                                <div className="mt-2">
                                    {item.product.listPrice && item.product.listPrice > item.product.price && (
                                        <span className="text-xs text-gray-400 line-through block">
                                            {formatPrice(item.product.listPrice)}
                                        </span>
                                    )}
                                    <span className="text-sm font-bold text-gray-800">
                                        {item.product.price > 0 ? formatPrice(item.product.price) : 'تماس بگیرید'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={() => handleAddToCart(item.productId)}
                                        disabled={item.product.inventoryStatus === 'OUT_OF_STOCK'}
                                        className="flex-1 flex items-center justify-center gap-1 bg-ocean hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <ShoppingCart className="w-3 h-3" />
                                        افزودن به سبد
                                    </button>
                                    <button
                                        onClick={() => handleRemove(item.productId)}
                                        disabled={removingId === item.productId}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {removingId === item.productId ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

