import { CheckCircle2, Phone, Shield } from 'lucide-react';

interface PricingBoxProps {
    product: {
        availability: string;
        price: number;
        originalPrice: number;
        warranty: string;
    };
}

export default function PricingBox({ product }: PricingBoxProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return (
        <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-4 space-y-4">

            {/* Seller Info */}
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800 text-sm">فروشنده</span>
                    <span className="text-blue-500 text-xs font-medium cursor-pointer">4 فروشنده دیگر</span>
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
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                <span className="text-xs font-medium text-gray-700">
                    {product.availability}
                    <span className="mr-1 text-gray-400 text-[10px]">(ارسال از ۳ روز کاری آینده)</span>
                </span>
            </div>


            {/* Price & Button */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col items-end mb-4">
                    {discount > 0 && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 line-through tracking-wider">{formatPrice(product.originalPrice)}</span>
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">%{discount}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">{formatPrice(product.price)}</span>
                        <span className="text-xs text-gray-500 font-medium">تومان</span>
                    </div>
                </div>

                <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors shadow-md text-sm mb-2">
                    افزودن به سبد خرید
                </button>
                <button className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm">
                    مشاوره رایگان خرید
                </button>
            </div>
        </div>
    );
}
