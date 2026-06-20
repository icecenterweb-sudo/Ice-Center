'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as string[],
    isActive: true
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'products');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const data = await res.json();

        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        } else {
          alert(`خطا در آپلود ${file.name}: ${data.message || 'Unknown error'}`);
        }
      } catch {
        alert(`خطا در آپلود ${file.name}`);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));

    setUploading(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock)
      })
    });

    const data = await res.json();

    if (data.success) {
      alert('محصول با موفقیت اضافه شد!');
      router.push('/admin/products');
    } else {
      alert('خطا: ' + data.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">افزودن دستگاه جدید</h1>
          <Link
            href="/admin/products"
            className="text-blue-600 hover:underline"
          >
            ← بازگشت به لیست
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">

          <div>
            <label className="block font-bold mb-2">نام دستگاه *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="مثال: دستگاه بستنی ساز صنعتی"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Slug (نام انگلیسی) *</label>
            <input
              type="text"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="مثال: industrial-ice-cream-maker"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">توضیحات</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              rows={4}
              placeholder="مشخصات فنی، قابلیت‌ها و ویژگی‌های دستگاه..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">قیمت (تومان) *</label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2"
                placeholder="25000000"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">موجودی *</label>
              <input
                type="number"
                name="stock"
                required
                value={formData.stock}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2">دسته‌بندی</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
            >
              <option value="">انتخاب کنید</option>
              <option value="بستنی‌ساز">دستگاه بستنی‌ساز</option>
              <option value="آبمیوه‌گیری">دستگاه آبمیوه‌گیری</option>
              <option value="یخ‌ساز">دستگاه یخ‌ساز</option>
              <option value="فریزر">فریزر صنعتی</option>
              <option value="یخچال">یخچال صنعتی</option>
            </select>
          </div>

          {/* بخش آپلود تصویر */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="block font-bold mb-2">تصاویر محصول 📸</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full border rounded px-4 py-2 mb-2"
            />
            {uploading && (
              <p className="text-blue-600 mt-2 animate-pulse">⏳ در حال آپلود تصاویر...</p>
            )}
            <p className="text-sm text-gray-500">می‌توانید چند تصویر انتخاب کنید</p>
          </div>

          {/* نمایش تصاویر آپلود شده */}
          {formData.images.length > 0 && (
            <div>
              <p className="font-bold mb-2">تصاویر آپلود شده ({formData.images.length}):</p>
              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`تصویر ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="حذف تصویر"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        تصویر اصلی
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="ml-2"
            />
            <label>محصول فعال باشد</label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ذخیره...' : uploading ? 'صبر کنید...' : '✓ ذخیره محصول'}
            </button>

            <Link
              href="/admin/products"
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 text-center flex items-center justify-center"
            >
              انصراف
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}