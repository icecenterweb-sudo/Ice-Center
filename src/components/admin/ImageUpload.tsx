'use client';

import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
    currentImage?: string | null;
    onImageChange?: (file: File | null) => void;
}

export default function ImageUpload({ currentImage, onImageChange }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            setPreview(null);
            onImageChange?.(null);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('لطفاً فقط فایل تصویری انتخاب کنید');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم تصویر نباید بیشتر از 5 مگابایت باشد');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        onImageChange?.(file);
    };

    const clearImage = () => {
        setPreview(null);
        onImageChange?.(null);
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">تصویر دسته‌بندی</label>

            {preview ? (
                <div className="relative">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                        <Image
                            src={preview}
                            alt="Category preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className="block border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-gray-700">کلیک کنید یا تصویر را اینجا رها کنید</p>
                    <p className="text-sm text-gray-400 mt-2">PNG, JPG تا حجم 5 مگابایت</p>
                </label>
            )}

            <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span>تصویر برای نمایش در لیست دسته‌بندی‌ها - اختیاری</span>
            </p>
        </div>
    );
}
