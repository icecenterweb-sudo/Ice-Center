'use client';

import { Upload, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
    currentImage?: string | null;
    onImageChange?: (url: string | null) => void;
    folder?: string;
}

export default function ImageUpload({ currentImage, onImageChange, folder }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);

        if (!file) {
            setPreview(null);
            onImageChange?.(null);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('لطفاً فقط فایل تصویری انتخاب کنید');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('حجم تصویر نباید بیشتر از 5 مگابایت باشد');
            return;
        }

        // Create local preview immediately for UX
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (folder) {
                formData.append('folder', folder);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'خطا در آپلود تصویر');
            }

            // Update preview with Cloudinary URL
            setPreview(result.url);
            onImageChange?.(result.url);
        } catch (err: any) {
            setError(err.message || 'خطا در آپلود تصویر');
            setPreview(null);
            onImageChange?.(null);
        } finally {
            setIsUploading(false);
            // Revoke the local object URL
            URL.revokeObjectURL(localPreview);
        }
    };

    const clearImage = () => {
        setPreview(null);
        setError(null);
        onImageChange?.(null);
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">تصویر دسته‌بندی</label>

            {preview ? (
                <div className="relative">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
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
                        disabled={isUploading}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
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
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG تا حجم 5 مگابایت</p>
                </label>
            )}

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Hidden input to store Cloudinary URL for form submission */}
            <input type="hidden" name="imageUrl" value={preview || ''} />

            <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span>تصویر برای نمایش در لیست دسته‌بندی‌ها - اختیاری</span>
            </p>
        </div>
    );
}
