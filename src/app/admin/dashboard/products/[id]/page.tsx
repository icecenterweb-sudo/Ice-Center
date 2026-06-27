import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Edit } from 'lucide-react';
import { connection } from 'next/server';
import { Suspense } from 'react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
};

async function ProductDetailContent({ params }: { params: Promise<{ id: string }> }) {
    await connection();
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        notFound();
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            variants: true,
            subcategory: {
                include: {
                    category: true
                }
            }
        }
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/dashboard/products"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
                        <p className="text-gray-500 text-sm mt-1">جزئیات محصول</p>
                    </div>
                </div>
                <Link
                    href={`/admin/dashboard/products/${product.id}/edit`}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all"
                >
                    <Edit className="w-5 h-5" />
                    ویرایش محصول
                </Link>
            </div>

            {/* Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">اطلاعات اصلی</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">نام محصول</label>
                                <p className="font-bold text-gray-800 mt-1">{product.name}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">کد محصول (SKU)</label>
                                <p className="font-bold text-gray-800 mt-1">{product.sku || '---'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">برند</label>
                                <p className="font-bold text-gray-800 mt-1">{product.brand || '---'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">دسته‌بندی</label>
                                <p className="font-bold text-gray-800 mt-1">
                                    {product.subcategory ? `${product.subcategory.category.name} / ${product.subcategory.name}` : '---'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">توضیحات</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>
                    )}

                    {/* Variants */}
                    {product.variants.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">واریانت‌ها ({product.variants.length})</h2>
                            <div className="space-y-3">
                                {product.variants.map((variant) => (
                                    <div key={variant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-800">{variant.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {variant.capacity && `ظرفیت: ${variant.capacity}`}
                                                {variant.phase && ` • فاز: ${variant.phase}`}
                                                {variant.voltage && ` • ولتاژ: ${variant.voltage}`}
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800">{formatCurrency(variant.price)} تومان</p>
                                            <p className="text-sm text-gray-500 mt-1">موجودی: {variant.stock} عدد</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Price & Stock */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">قیمت و موجودی</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">قیمت پایه</label>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(product.price)} تومان</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">موجودی کل</label>
                                <p className="text-xl font-bold text-gray-800 mt-1">{product.stock} عدد</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">وضعیت</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    <span className="font-bold text-gray-800">{product.isActive ? 'فعال' : 'غیرفعال'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">اطلاعات تکمیلی</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">تاریخ ایجاد</span>
                                <span className="font-bold text-gray-800">
                                    {new Date(product.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">آخرین بروزرسانی</span>
                                <span className="font-bold text-gray-800">
                                    {new Date(product.updatedAt).toLocaleDateString('fa-IR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری جزئیات محصول...</div>}>
            <ProductDetailContent {...props} />
        </Suspense>
    );
}
