'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BarChart2, Check, Phone } from 'lucide-react';
import WishlistButton from './WishlistButton';

interface ProductCardProps {
    product: {
        id: number;
        slug: string;
        name: string;
        price: number;
        listPrice?: number | null;
        image?: string | null;
        thumbnail?: string | null;
        rating?: number;
        reviewCount?: number;
        inventoryStatus?: string;
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

    const isInStock = (product.inventoryStatus || 'IN_STOCK') === 'IN_STOCK' || product.inventoryStatus === 'LOW_STOCK';
    const imageSrc = product.thumbnail || product.image || '';

    const discount = product.listPrice && product.listPrice > product.price
        ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
        : 0;

    return (
        <Link href={`/products/${product.slug}`} className="block h-full group">
            <div className="bg-white rounded-xl border border-gray-100 h-full flex flex-col relative overflow-hidden interactive-card-hover">

                {/* Special Offer or Discount Badge */}
                {product.isSpecialOffer ? (
                    <div className="absolute top-2.5 right-2.5 z-10 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                        پیشنهاد ویژه
                    </div>
                ) : discount > 0 ? (
                    <div className="absolute top-2.5 right-2.5 z-10 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                        ٪{discount}
                    </div>
                ) : null}

                {/* Action Buttons (Wishlist) */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
                    <WishlistButton productId={product.id} size="sm" />
                </div>

                {/* Image Container */}
                <div className="relative aspect-square mb-3 bg-gray-50/40 overflow-hidden w-full p-2 flex items-center justify-center">
                    {imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            className="object-contain p-2 image-zoom-hover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                            تصویر ندارد
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col px-3 pb-3">
                    {/* Title */}
                    <h3 className="text-xs sm:text-[13px] leading-5 font-bold text-slate-800 mb-2 min-h-[2.5rem] line-clamp-2 group-hover:text-ocean transition-colors">
                        {product.name}
                    </h3>

                    {/* Key Specs Preview (B2B Feature) */}
                    {product.specs && (
                        <div className="mb-3 space-y-1">
                             {product.specs.capacity && (
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-ocean/20"></span>
                                    <span className="text-gray-400">ظرفیت:</span>
                                    <span className="font-medium text-gray-600">{product.specs.capacity}</span>
                                </div>
                            )}
                            {product.specs.power && (
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-ocean/20"></span>
                                    <span className="text-gray-400">توان:</span>
                                    <span className="font-medium text-gray-600">{product.specs.power}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Footer: Price & Actions */}
                    <div className="pt-2.5 border-t border-gray-100">
                        <div className="flex items-end justify-between">

                            {/* Availability */}
                            <div className="flex flex-col gap-1">
                                {isInStock ? (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                                        <Check className="w-3 h-3" />
                                        <span>موجود</span>
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
                                                <div className="text-[11px] text-gray-400 line-through mb-0.5 ml-1 tabular-nums">
                                                    {formatPrice(product.listPrice)}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-gray-900">
                                                <span className="text-base sm:text-lg font-extrabold tracking-tight tabular-nums">
                                                    {formatPrice(product.price)}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-medium">تومان</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-1 text-ocean text-xs font-bold bg-ocean/10 px-2.5 py-1 rounded-lg">
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>تماس بگیرید</span>
                                        </div>
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
