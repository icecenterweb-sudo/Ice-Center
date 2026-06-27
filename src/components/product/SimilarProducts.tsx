import Image from 'next/image';
import Link from 'next/link';

type SimilarProduct = {
    id: number;
    name: string;
    slug: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    inventoryStatus: string;
    brand: string | null;
};

type SimilarProductsProps = {
    products: SimilarProduct[];
};

export default function SimilarProducts({ products }: SimilarProductsProps) {
    if (products.length === 0) return null;

    return (
        <div className="bg-white rounded-lg border border-gray-200 mt-4 overflow-hidden">
            <h3 className="font-bold text-gray-900 p-3 bg-gray-50 border-b border-gray-100 text-sm">محصولات مشابه</h3>
            <div className="divide-y divide-gray-100">
                {products.map((item) => (
                    <Link
                        key={item.id}
                        href={`/products/${item.slug}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="relative w-12 h-12 flex-shrink-0 bg-white border border-gray-100 rounded-md overflow-hidden">
                            <Image
                                src={item.thumbnail || '/no-image.svg'}
                                alt={item.name}
                                fill
                                className="object-contain p-1 group-hover:scale-110 transition-transform"
                            />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-medium text-gray-700 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {item.name}
                            </h4>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-900 text-xs">
                                    {new Intl.NumberFormat('fa-IR').format(item.price)}
                                </span>
                                <span className="text-[10px] text-gray-500">تومان</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            {products.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                    <Link
                        href="/products"
                        className="block w-full text-xs text-blue-600 font-bold py-1.5 hover:bg-blue-50 rounded transition-colors text-center"
                    >
                        مشاهده موارد بیشتر
                    </Link>
                </div>
            )}
        </div>
    );
}
