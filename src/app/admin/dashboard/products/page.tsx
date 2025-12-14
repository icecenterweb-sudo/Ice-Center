import Link from 'next/link';
import { Package, Plus, Search, Filter, Eye, Edit } from 'lucide-react';
import { prisma } from '@/lib/db';
import DeleteProductButton from './DeleteProductButton';
import { formatPersianNumber } from '@/utils/persian';


export const dynamic = 'force-dynamic'; // Ensure we always get fresh data

export default async function ProductsPage() {
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
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
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
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                                <th className="px-6 py-4 font-medium">تصویر</th>
                                <th className="px-6 py-4 font-medium">نام محصول</th>
                                <th className="px-6 py-4 font-medium">برند / دسته‌بندی</th>
                                <th className="px-6 py-4 font-medium">قیمت (تومان)</th>
                                <th className="px-6 py-4 font-medium">موجودی</th>
                                <th className="px-6 py-4 font-medium">واریانت</th>
                                <th className="px-6 py-4 font-medium">وضعیت</th>
                                <th className="px-6 py-4 font-medium text-left">عملیات</th>
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
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{product.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{product.sku || '---'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div>{product.brand || '---'}</div>
                                            {product.subcategory && (
                                                <div className="text-xs text-gray-400 mt-0.5">{product.subcategory.name}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">
                                            {formatPersianNumber(product.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock > 5 ? 'bg-green-100 text-green-700' :
                                                product.stock > 0 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {product.stock} عدد
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.variants.length > 0 ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    {product.variants.length} واریانت
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">---</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}></span>
                                                <span className="text-sm text-gray-600">
                                                    {product.isActive ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/admin/dashboard/products/${product.id}`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="مشاهده جزئیات"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/dashboard/products/${product.id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
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
