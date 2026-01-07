import Link from 'next/link';
import { Package, Plus, Search, Filter, Eye, Edit } from 'lucide-react';
import { prisma } from '@/lib/db';
import DeleteProductButton from './DeleteProductButton';
import { formatPersianNumber } from '@/utils/persian';
import { connection } from 'next/server';
import { Suspense } from 'react';

async function ProductsContent() {
    await connection(); // Opt out of caching for this page

    // Fetch products with variants
    const products = await prisma.product.findMany({
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
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت محصولات</h1>
                    <p className="text-gray-500 text-sm mt-1">لیست تمام محصولات و مدیریت موجودی</p>
                </div>
                <Link
                    href="/admin/dashboard/products/add"
                    className="flex items-center gap-2 bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    افزودن محصول جدید
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجوی نام محصول، کد یا برند..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-700 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-medium">
                        <Filter className="w-4 h-4" />
                        فیلترها
                    </button>
                    <select className="px-8 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-medium border-none outline-none cursor-pointer">
                        <option>همه دسته‌ها</option>
                        <option>بستنی ساز</option>
                        <option>یخچال صنعتی</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-3 py-3 font-medium w-14">تصویر</th>
                                <th className="px-3 py-3 font-medium max-w-[160px]">نام محصول</th>
                                <th className="px-3 py-3 font-medium w-34">برند / دسته</th>
                                <th className="px-3 py-3 font-medium w-34 whitespace-nowrap">قیمت (تومان)</th>
                                <th className="px-3 py-3 font-medium w-22">موجودی</th>
                                <th className="px-3 py-3 font-medium w-22">واریانت</th>
                                <th className="px-3 py-3 font-medium w-18">وضعیت</th>
                                <th className="px-3 py-3 font-medium w-24 text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        هنوز محصولی ثبت نشده است.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="group hover:bg-blue-50/30 transition-colors"
                                    >
                                        <td className="px-3 py-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-5 h-5 text-gray-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{product.sku || '---'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600 text-sm">
                                            <div>{product.brand || '---'}</div>
                                            {product.subcategory && (
                                                <div className="text-xs text-gray-500 mt-0.5">{product.subcategory.name}</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 font-bold text-gray-700 text-sm whitespace-nowrap">
                                            {formatPersianNumber(product.price)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 5 ? 'bg-green-100 text-green-700' :
                                                product.stock > 0 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {product.stock} عدد
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            {product.variants.length > 0 ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    {product.variants.length} واریانت
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500">---</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <span className={`inline-flex w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}></span>
                                                <span className="text-xs text-gray-600">
                                                    {product.isActive ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/admin/dashboard/products/${product.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-ocean hover:bg-frost rounded-lg transition-colors"
                                                    title="مشاهده جزئیات"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/dashboard/products/${product.id}/edit`}
                                                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="ویرایش محصول"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <DeleteProductButton
                                                    productId={product.id}
                                                    hasVariants={product.variants.length > 0}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
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
