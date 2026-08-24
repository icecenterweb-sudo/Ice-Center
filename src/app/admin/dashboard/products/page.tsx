import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import ProductsTableClient from './ProductsTableClient';

async function ProductsContent() {
    await connection(); // Opt out of caching for this page
    await requireRolePage('PRODUCTS');

    // Fetch products and categories in parallel
    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            include: {
                variants: {
                    select: {
                        id: true
                    }
                },
                subcategory: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.category.findMany({
            select: {
                id: true,
                name: true,
                subcategories: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })
    ]);

    // Format products to match the expected interface in ProductsTableClient
    const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        brand: product.brand,
        price: Number(product.price),
        stock: product.stock,
        inventoryStatus: product.inventoryStatus,
        isActive: product.isActive,
        thumbnail: product.thumbnail,
        subcategoryId: product.subcategoryId,
        variants: product.variants,
        subcategory: product.subcategory ? { name: product.subcategory.name } : null
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مدیریت محصولات</h1>
                    <p className="text-gray-500 text-sm mt-1">لیست تمام محصولات و مدیریت موجودی</p>
                </div>
                <Link
                    href="/admin/dashboard/products/add"
                    className="flex items-center gap-2 bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-ocean/20 transition-all transform hover:scale-105 text-sm"
                >
                    <Plus className="w-5 h-5" />
                    افزودن محصول جدید
                </Link>
            </div>

            {/* Client-side Table with Filter and Checkboxes */}
            <ProductsTableClient 
                initialProducts={formattedProducts} 
                categories={categories} 
            />
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری محصولات...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
