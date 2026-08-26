import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import VariantManager from './VariantManager';
import EditProductForm from './EditProductForm';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
    await connection();
    await requireRolePage('PRODUCTS');
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
            <VariantManager
                productId={productId}
                variants={product.variants.map((v) => ({
                    id: v.id,
                    name: v.name,
                    sku: v.sku,
                    capacity: v.capacity,
                    phase: v.phase,
                    voltage: v.voltage,
                    price: Number(v.price),
                    stock: v.stock,
                    isDefault: v.isDefault,
                    isActive: v.isActive,
                }))}
            />
        </div>
    );
}

export default function EditProductPage(props: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditProductContent {...props} />
        </Suspense>
    );
}
