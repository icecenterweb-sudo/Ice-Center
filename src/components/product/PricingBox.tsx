'use client';

import { useState } from 'react';
import { CheckCircle2, Phone, Shield, Sparkles } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import InstallmentModal from '@/components/modals/InstallmentModal';

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
    const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);

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
        <>
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
                                <span className="text-emerald-600 font-medium">تامین‌کننده مستقیم</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500">انبار مرکزی</span>
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
                    <CheckCircle2 className={`w-4 h-4 ${isInStock ? 'text-ocean' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium text-gray-700">
                        {inventoryLabel}
                        {isInStock && <span className="mr-1 text-gray-400 text-[10px]">(ارسال از ۳ روز کاری آینده)</span>}
                    </span>
                </div>

                {/* Price & Buttons */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex flex-col items-end mb-4">
                        {discount > 0 && product.listPrice && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400 line-through tracking-wider tabular-nums">{formatPrice(product.listPrice)}</span>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">%{discount}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <span className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{formatPrice(product.price)}</span>
                            <span className="text-xs text-gray-500 font-medium">تومان</span>
                        </div>
                    </div>

                    {isInStock ? (
                        <AddToCartButton product={cartProduct} className="w-full" />
                    ) : (
                        <button className="w-full bg-gray-300 text-gray-500 cursor-not-allowed font-bold py-3 rounded-lg text-sm">
                            ناموجود
                        </button>
                    )}

                    {/* Installment Payment Button (Orange Pill with White Ping Dot) */}
                    <button
                        onClick={() => setIsInstallmentOpen(true)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <Sparkles size={16} />
                        <span>خرید اقساطی</span>
                    </button>

                    <a
                        href="tel:09122248917"
                        className="w-full bg-white border border-gray-300 hover:border-ocean text-gray-700 hover:text-ocean font-semibold py-2.5 rounded-lg transition-colors text-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Phone className="w-4 h-4 text-ocean" />
                        <span>مشاوره رایگان خرید</span>
                    </a>
                </div>
            </div>

            {/* Installment Modal Popup */}
            <InstallmentModal
                isOpen={isInstallmentOpen}
                onClose={() => setIsInstallmentOpen(false)}
            />
        </>
    );
}

