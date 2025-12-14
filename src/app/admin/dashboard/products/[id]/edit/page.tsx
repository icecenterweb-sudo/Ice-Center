import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import VariantManager from './VariantManager';
import EditProductForm from './EditProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        notFound();
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            subcategory: true,
            variants: {
                orderBy: { isDefault: 'desc' }
            }
        }
    });

    if (!product) {
        notFound();
    }

    const subcategories = await prisma.subcategory.findMany({
        include: {
            category: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard/products"
                    className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">ویرایش محصول</h1>
                    <p className="text-gray-500 text-sm mt-1">{product.name}</p>
                </div>
            </div>

            {/* Edit Form */}
            <EditProductForm product={product} subcategories={subcategories} />

            {/* Variant Manager */}
            <VariantManager productId={productId} variants={product.variants} />
        </div>
    );
}
