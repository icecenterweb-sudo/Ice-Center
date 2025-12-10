import { Shield, Award, Star, TruckIcon } from 'lucide-react';

interface ProductInfoProps {
    product: {
        name: string;
        nameEnglish: string;
        brand: string;
        rating: number;
        reviewCount: number;
        warranty: string;
        seller: string;
    };
    advantages: Array<{
        icon: any;
        title: string;
        description: string;
    }>;
}

export default function ProductInfo({ product, advantages }: ProductInfoProps) {
    return (
        <div className="space-y-3">
            {/* Product Name */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1.5 leading-snug">
                    {product.name}
                </h1>
                <p className="text-xs text-gray-600">
                    {product.nameEnglish}
                </p>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < Math.floor(product.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                        {product.rating.toFixed(1)}
                    </span>
                </div>
                <div className="text-xs text-gray-600">
                    ({product.reviewCount} نظر)
                </div>
            </div>

            {/* Warranty & Seller Info */}
            <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-xs font-bold text-gray-900">
                            {product.warranty}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                            شامل نصب، آموزش و پشتیبانی فنی
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                    <TruckIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div className="text-xs text-gray-900">
                        {product.seller}
                    </div>
                </div>
            </div>

            {/* Brand Badge */}
            <div className="pt-2.5 border-t border-gray-200">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md text-xs font-medium">
                    <Award className="w-3.5 h-3.5" />
                    برند: {product.brand}
                </div>
            </div>

            {/* Key Advantages */}
            <div className="pt-3 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2.5">ویژگی‌های کلیدی</h3>
                <div className="grid grid-cols-2 gap-2">
                    {advantages.map((adv, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                            <adv.icon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="text-xs font-bold text-gray-900">{adv.title}</div>
                                <div className="text-[11px] text-gray-600">{adv.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
