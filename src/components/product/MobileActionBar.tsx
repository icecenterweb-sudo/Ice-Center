'use client';

interface MobileActionBarProps {
    product: {
        price: number;
        listPrice?: number | null;
        inventoryStatus: string;
    };
}

export default function MobileActionBar({ product }: MobileActionBarProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 lg:hidden z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm ml-4 shadow-md">
                افزودن به سبد خرید
            </button>
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
