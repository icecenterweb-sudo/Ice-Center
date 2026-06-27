import { Shield, Star, TruckIcon } from 'lucide-react';

interface ProductInfoProps {
    product: {
        name: string;
        nameEnglish: string;
        brand: string;
        model: string;
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
        <div className="space-y-5">
            {/* Title & Brand */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyan-600 font-bold text-xs tracking-wider uppercase">
                        {product.brand}
                    </span>
                    <span className="text-gray-300 text-xs">|</span>
                    <span className="text-gray-500 text-xs">
                        {product.model}
                    </span>
                </div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 mb-1 leading-relaxed">
                    {product.name}
                </h1>
                <p className="text-xs text-gray-400 font-mono text-left dir-ltr">
                    {product.nameEnglish}
                </p>
            </div>

            {/* Rating / Review / Recommendation */}
            <div className="flex items-center gap-4 text-xs border-b border-gray-100 pb-4">
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900 text-sm">{product.rating.toFixed(1)}</span>
                    <span className="text-gray-400">({product.reviewCount})</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-600">
                    <span className="bg-cyan-50 px-2 py-0.5 rounded text-[11px] font-medium">
                        ۸۹٪ از خریداران این کالا را پیشنهاد کرده‌اند
                    </span>
                </div>
            </div>

            {/* Colors (Mock) */}
            <div className="space-y-2">
                <div className="text-sm font-bold text-gray-800">رنگ: <span className="text-gray-500 font-normal">استیل</span></div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white ring-2 ring-cyan-500 cursor-pointer flex items-center justify-center">
                        <span className="block w-2 h-2 bg-white rounded-full"></span>
                    </div>
                </div>
            </div>

            {/* Key Advantages / Features */}
            <div className="space-y-3 pt-2">
                <div className="text-sm font-bold text-gray-800">ویژگی‌های برجسته</div>
                <ul className="grid grid-cols-1 gap-2">
                    {advantages.map((adv, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                            <div>
                                <span className="font-medium text-gray-900">{adv.title}: </span>
                                <span>{adv.description}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Short Specs / Meta */}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-4">
                <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {product.warranty}
                </div>
                <div className="flex items-center gap-1">
                    <TruckIcon className="w-4 h-4" />
                    ارسال سریع
                </div>
            </div>

        </div>
    );
}
