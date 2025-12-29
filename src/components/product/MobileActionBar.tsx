'use client';

import AddToCartButton from '@/components/cart/AddToCartButton';

interface MobileActionBarProps {
    product: {
        id: number;
        slug: string;
        name: string;
        price: number;
        listPrice?: number | null;
        inventoryStatus: string;
        thumbnail?: string | null;
        stock: number;
    };
}

export default function MobileActionBar({ product }: MobileActionBarProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const isInStock = product.inventoryStatus === 'IN_STOCK';

    // Build cart product object
    const cartProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        listPrice: product.listPrice || null,
        thumbnail: product.thumbnail || null,
        stock: product.stock,
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 lg:hidden z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {isInStock ? (
                <AddToCartButton
                    product={cartProduct}
                    variant="small"
                    className="flex-1 py-3 ml-4 shadow-md"
                />
            ) : (
                <button className="flex-1 bg-gray-300 text-gray-500 cursor-not-allowed font-bold py-3 rounded-lg text-sm ml-4">
                    ناموجود
                </button>
            )}
            <div className="flex flex-col items-end">
                {product.listPrice && product.listPrice > product.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                        {formatPrice(product.listPrice)}
                    </span>
                )}
                <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
                    <span className="text-[10px] text-gray-500">تومان</span>
                </div>
            </div>
        </div>
    );
}

