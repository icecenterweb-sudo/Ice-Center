'use client';

import { Upload, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface MultiImageUploadProps {
    currentImages?: string[];
    onImagesChange?: (urls: string[]) => void;
    maxImages?: number;
    folder?: string;
}

export default function MultiImageUpload({
    currentImages = [],
    onImagesChange,
    maxImages = 5,
    folder
}: MultiImageUploadProps) {
    const [images, setImages] = useState<string[]>(currentImages);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setError(null);

        // Check total count
        if (images.length + selectedFiles.length > maxImages) {
            setError(`حداکثر ${maxImages} تصویر می‌توانید انتخاب کنید`);
            return;
        }

        // Validate each file first
        const validFiles: File[] = [];
        for (const file of selectedFiles) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('لطفاً فقط فایل تصویری انتخاب کنید');
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('حجم هر تصویر نباید بیشتر از 5 مگابایت باشد');
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setUploadingCount(validFiles.length);

        // Upload all files in parallel
        const uploadPromises = validFiles.map(async (file) => {
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

            return result.url;
        });

        try {
            const uploadedUrls = await Promise.all(uploadPromises);
            const newImages = [...images, ...uploadedUrls];
            setImages(newImages);
            onImagesChange?.(newImages);
        } catch (err: any) {
            setError(err.message || 'خطا در آپلود تصاویر');
        } finally {
            setUploadingCount(0);
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange?.(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    تصاویر محصول (حداکثر {maxImages} تصویر)
                </label>
                <span className="text-xs text-gray-500">
                    {images.length} / {maxImages}
                </span>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                    <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                            <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                                    اصلی
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Loading placeholders */}
                {uploadingCount > 0 && [...Array(uploadingCount)].map((_, index) => (
                    <div key={`loading-${index}`} className="relative">
                        <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    </div>
                ))}

                {/* Upload Button */}
                {images.length < maxImages && uploadingCount === 0 && (
                    <label className="block border-2 border-dashed border-gray-200 rounded-xl h-32 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">افزودن تصویر</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG</p>
                        </div>
                    </label>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Hidden input to store Cloudinary URLs for form submission */}
            <input type="hidden" name="imagesData" value={JSON.stringify(images)} />

            <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span>اولین تصویر به عنوان تصویر اصلی محصول نمایش داده می‌شود. برای تغییر ترتیب، تصاویر را حذف و مجدداً اضافه کنید.</span>
            </p>
        </div>
    );
}
