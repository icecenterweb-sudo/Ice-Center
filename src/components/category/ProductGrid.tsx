'use client';

import ProductCard from '@/components/product/ProductCard';

interface Product {
    id: number;
    slug: string;
    name: string;
    price: number;
    listPrice?: number;
    image: string;
    rating: number;
    reviewCount: number;
    inventoryStatus: string;
    specs?: {
        capacity?: string;
        power?: string;
        temp?: string;
    };
    isSpecialOffer?: boolean;
}

interface ProductGridProps {
    products: Product[];
    emptyMessage?: string;
}

export default function ProductGrid({ products, emptyMessage = 'محصولی یافت نشد' }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-400">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-lg">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
