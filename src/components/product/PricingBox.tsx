import { CheckCircle2, Phone } from 'lucide-react';

interface PricingBoxProps {
    product: {
        availability: string;
        price: number;
        originalPrice: number;
    };
}

export default function PricingBox({ product }: PricingBoxProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return (
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2.5 border-b border-gray-200">
                قیمت و خرید
            </h3>

            {/* Availability Status */}
            <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">
                        {product.availability}
                    </span>
                </div>
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">تخفیف ویژه</span>
                        <span className="bg-red-500 text-white px-2.5 py-1 rounded-md font-bold text-xs">
                            {discount}%
                        </span>
                    </div>
                </div>
            )}

            {/* Pricing */}
            <div className="mb-4 pb-4 border-b border-gray-200">
                {product.originalPrice > product.price && (
                    <div className="text-xs text-gray-500 line-through mb-1.5">
                        {formatPrice(product.originalPrice)} تومان
                    </div>
                )}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-600">تومان</span>
                </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm">
                    درخواست مشاوره خرید
                </button>
                <button className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-2.5 rounded-lg transition-colors text-sm">
                    تماس با فروشنده
                </button>
            </div>

            {/* Contact Info */}
            <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    <span>مشاوره رایگان:</span>
                    <span className="font-bold text-gray-900 dir-ltr">021-12345678</span>
                </div>
            </div>
        </div>
    );
}
