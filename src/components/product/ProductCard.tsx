'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, BarChart2, Check, Phone } from 'lucide-react';

interface ProductCardProps {
    product: {
        id: number;
        slug: string;
        name: string;
        price: number;
        listPrice?: number;
        image: string;
        rating: number;
        reviewCount: number;
        inventoryStatus: string;
        specs?: {
            capacity?: string;
            power?: string;
            temp?: string;
        };
        isSpecialOffer?: boolean;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const discount = product.listPrice
        ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
        : 0;

    const isInStock = product.inventoryStatus === 'IN_STOCK' || product.inventoryStatus === 'LOW_STOCK';

    return (
        <Link href={`/products/${product.slug}`} className="block h-full group">
            <div className="bg-white rounded-lg border border-gray-100 p-3 h-full flex flex-col hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 relative">

                {/* Special Offer Badge */}
                {product.isSpecialOffer && (
                    <div className="absolute top-0 right-0 z-10 bg-[#ef394e] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-md">
                        پیشنهاد ویژه
                    </div>
                )}

                {/* Compare Checkbox (Hidden by default, shown on hover/group) */}
                <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-600 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-gray-200 hover:border-blue-300 transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            // Handle compare
                        }}
                    >
                        <BarChart2 className="w-3 h-3" />
                        <span>مقایسه</span>
                    </button>
                </div>

                {/* Image Container */}
                <div className="relative aspect-square mb-4 bg-white rounded-lg overflow-hidden p-4">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="text-[13px] leading-6 font-medium text-gray-800 mb-3 min-h-[3rem] line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Key Specs Preview (B2B Feature) */}
                    {product.specs && (
                        <div className="mb-4 space-y-1.5">
                            {product.specs.capacity && (
                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-100"></span>
                                    <span className="text-gray-400">ظرفیت:</span>
                                    <span className="font-medium text-gray-600">{product.specs.capacity}</span>
                                </div>
                            )}
                            {product.specs.power && (
                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-100"></span>
                                    <span className="text-gray-400">توان:</span>
                                    <span className="font-medium text-gray-600">{product.specs.power}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Footer: Price & Actions */}
                    <div className="pt-3 border-t border-gray-50">
                        <div className="flex items-end justify-between">

                            {/* Availability/Rating */}
                            <div className="flex flex-col gap-1">
                                {isInStock ? (
                                    <div className="flex items-center gap-1 text-[10px] text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full w-fit">
                                        <Check className="w-3 h-3" />
                                        <span>موجود در انبار</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                                        <span>ناموجود</span>
                                    </div>
                                )}
                            </div>

                            {/* Price */}
                            <div className="text-left">
                                {isInStock ? (
                                    product.price > 0 ? (
                                        <>
                                            {product.listPrice && product.listPrice > product.price && (
                                                <div className="text-[11px] text-gray-400 line-through decoration-red-200 mb-0.5 ml-1">
                                                    {formatPrice(product.listPrice)}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-gray-900">
                                                <span className="text-lg font-bold tracking-tight">
                                                    {formatPrice(product.price)}
                                                </span>
                                                <span className="text-[11px] text-gray-500">تومان</span>
                                            </div>
                                        </>
                                    ) : (
                                        <button className="flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                            <Phone className="w-3.5 h-3.5" />
                                            تماس بگیرید
                                        </button>
                                    )
                                ) : (
                                    <div className="text-sm font-medium text-gray-400">
                                        ---
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
