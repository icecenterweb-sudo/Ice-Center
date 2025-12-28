'use client';

import Image from 'next/image';

interface MiniPricingBoxProps {
    product: {
        name: string;
        price: number;
        listPrice?: number | null;
        images: string[];
        inventoryStatus: string;
    };
}

export default function MiniPricingBox({ product }: MiniPricingBoxProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const isInStock = product.inventoryStatus === 'IN_STOCK';
    const inventoryLabel = isInStock ? 'موجود' : 'ناموجود';

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            {/* Product Tiny Summary */}
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                <div className="relative w-16 h-16 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed mb-1" title={product.name}>
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${isInStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-[10px] text-gray-500">{inventoryLabel}</span>
                    </div>
                </div>
            </div>

            {/* Price & Action */}
            <div>
                <div className="flex flex-col items-end mb-3">
                    {product.listPrice && product.listPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through tracking-wider mb-0.5">
                            {formatPrice(product.listPrice)}
                        </span>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-900 tracking-tight">{formatPrice(product.price)}</span>
                        <span className="text-xs text-gray-500">تومان</span>
                    </div>
                </div>

                <button className={`w-full font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm ${isInStock ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                    {isInStock ? 'افزودن به سبد' : 'ناموجود'}
                </button>
            </div>
        </div>
    );
}
