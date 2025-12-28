'use client';

import { CheckCircle2, Phone, Shield } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';

interface PricingBoxProps {
    product: {
        id: number;
        slug: string;
        name: string;
        inventoryStatus: string;
        price: number;
        listPrice?: number | null;
        warranty: string;
        thumbnail?: string | null;
        stock: number;
    };
}

export default function PricingBox({ product }: PricingBoxProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const discount = product.listPrice
        ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
        : 0;

    const isInStock = product.inventoryStatus === 'IN_STOCK';
    const inventoryLabel = isInStock ? 'موجود در انبار' : 'ناموجود';

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
        <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-4 space-y-4">

            {/* Seller Info */}
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="mb-2">
                    <span className="font-bold text-gray-800 text-sm">فروشنده</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <Phone className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">آیس سنتر ایران</div>
                        <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-green-600">۸۵٪ رضایت خریداران</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500">عملکرد عالی</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guarantee */}
            <div className="flex items-center gap-2 px-1">
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">{product.warranty}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center gap-2 px-1">
                <CheckCircle2 className={`w-4 h-4 ${isInStock ? 'text-cyan-600' : 'text-gray-400'}`} />
                <span className="text-xs font-medium text-gray-700">
                    {inventoryLabel}
                    {isInStock && <span className="mr-1 text-gray-400 text-[10px]">(ارسال از ۳ روز کاری آینده)</span>}
                </span>
            </div>


            {/* Price & Button */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col items-end mb-4">
                    {discount > 0 && product.listPrice && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 line-through tracking-wider">{formatPrice(product.listPrice)}</span>
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">%{discount}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">{formatPrice(product.price)}</span>
                        <span className="text-xs text-gray-500 font-medium">تومان</span>
                    </div>
                </div>

                {isInStock ? (
                    <AddToCartButton product={cartProduct} className="mb-2" />
                ) : (
                    <button className="w-full bg-gray-300 text-gray-500 cursor-not-allowed font-bold py-3 rounded-lg text-sm mb-2">
                        ناموجود
                    </button>
                )}
                <button className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm">
                    مشاوره رایگان خرید
                </button>
            </div>
        </div>
    );
}

