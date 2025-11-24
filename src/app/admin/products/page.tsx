'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.data || []);
    setLoading(false);
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;
    
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.success) {
      alert('محصول حذف شد');
      fetchProducts();
    } else {
      alert('خطا در حذف');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">مدیریت محصولات</h1>
          
          <Link 
            href="/admin/products/new"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            + افزودن محصول جدید
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right">تصویر</th>
                <th className="px-6 py-3 text-right">نام</th>
                <th className="px-6 py-3 text-right">قیمت</th>
                <th className="px-6 py-3 text-right">موجودی</th>
                <th className="px-6 py-3 text-right">دسته</th>
                <th className="px-6 py-3 text-right">وضعیت</th>
                <th className="px-6 py-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => (
                <tr key={product._id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400">📦</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4">
                    {product.price.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">{product.category || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      product.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="text-blue-600 hover:underline ml-4"
                    >
                      ویرایش
                    </Link>
                    <button
                      onClick={() => deleteProduct(product._id, product.name)}
                      className="text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            هیچ محصولی وجود ندارد
          </p>
        )}
      </div>
    </div>
  );
}