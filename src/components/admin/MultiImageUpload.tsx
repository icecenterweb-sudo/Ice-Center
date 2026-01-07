'use client';

import { Upload, X } from 'lucide-react';
import { useState } from 'react';

interface MultiImageUploadProps {
    currentImages?: string[];
    onImagesChange?: (files: File[]) => void;
    maxImages?: number;
}

export default function MultiImageUpload({
    currentImages = [],
    onImagesChange,
    maxImages = 5
}: MultiImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>(currentImages);
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        // Check total count
        if (previews.length + selectedFiles.length > maxImages) {
            alert(`حداکثر ${maxImages} تصویر می‌توانید انتخاب کنید`);
            return;
        }

        // Validate each file
        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        selectedFiles.forEach(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('لطفاً فقط فایل تصویری انتخاب کنید');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('حجم هر تصویر نباید بیشتر از 5 مگابایت باشد');
                return;
            }

            validFiles.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result as string);
                if (newPreviews.length === validFiles.length) {
                    setPreviews([...previews, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });

        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        onImagesChange?.(updatedFiles);
    };

    const removeImage = (index: number) => {
        const newPreviews = previews.filter((_, i) => i !== index);
        const newFiles = files.filter((_, i) => i !== index);

        setPreviews(newPreviews);
        setFiles(newFiles);
        onImagesChange?.(newFiles);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    تصاویر محصول (حداکثر {maxImages} تصویر)
                </label>
                <span className="text-xs text-gray-500">
                    {previews.length} / {maxImages}
                </span>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                            <img
                                src={preview}
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

                {/* Upload Button */}
                {previews.length < maxImages && (
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

            <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span>اولین تصویر به عنوان تصویر اصلی محصول نمایش داده می‌شود. برای تغییر ترتیب، تصاویر را حذف و مجدداً اضافه کنید.</span>
            </p>
        </div>
    );
}
