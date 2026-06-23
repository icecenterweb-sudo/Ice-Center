'use client';

import { Upload, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface MultiImageUploadProps {
    currentImages?: string[];
    onImagesChange?: (urls: string[]) => void;
    maxImages?: number;
    folder?: string;
}

export default function MultiImageUpload({
    currentImages,
    onImagesChange,
    maxImages = 5,
    folder
}: MultiImageUploadProps) {
    const [images, setImages] = useState<string[]>(() => currentImages ?? []);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([]);
    const [blobPreviews, setBlobPreviews] = useState<Record<string, string>>({});
    const objectUrlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        setImages(currentImages ?? []);
    }, [currentImages]);

    // Clean up object URLs on unmount
    useEffect(() => {
        const objectUrls = objectUrlsRef.current;
        return () => {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
            objectUrls.clear();
        };
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setError(null);

        // Check total count
        if (images.length + pendingPreviewUrls.length + selectedFiles.length > maxImages) {
            setError(`حداکثر ${maxImages} تصویر می‌توانید انتخاب کنید`);
            e.target.value = '';
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

        if (validFiles.length === 0) {
            e.target.value = '';
            return;
        }

        setUploadingCount(validFiles.length);

        // Create local object URLs for instant previews
        const tempBlobPreviews = validFiles.map(file => ({
            file,
            blobUrl: URL.createObjectURL(file)
        }));
        tempBlobPreviews.forEach(({ blobUrl }) => objectUrlsRef.current.add(blobUrl));
        setPendingPreviewUrls(prev => [
            ...prev,
            ...tempBlobPreviews.map(({ blobUrl }) => blobUrl),
        ]);

        const newBlobPreviews: Record<string, string> = {};

        // Upload all files in parallel
        const uploadPromises = tempBlobPreviews.map(async ({ file, blobUrl }) => {
            const formData = new FormData();
            formData.append('file', file);
            if (folder) {
                formData.append('folder', folder);
            }

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json().catch(() => ({ message: 'Upload failed' }));

                if (!response.ok || !result?.success || !result.url) {
                    URL.revokeObjectURL(blobUrl);
                    objectUrlsRef.current.delete(blobUrl);
                    throw new Error(result.message || 'خطا در آپلود تصویر');
                }

                newBlobPreviews[result.url] = blobUrl;
                return result.url;
            } catch (err) {
                URL.revokeObjectURL(blobUrl);
                objectUrlsRef.current.delete(blobUrl);
                throw err;
            }
        });

        const uploadResults = await Promise.allSettled(uploadPromises);
        const uploadedUrls = uploadResults
            .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
            .map(result => result.value);

        if (uploadedUrls.length > 0) {
            setBlobPreviews(prev => ({ ...prev, ...newBlobPreviews }));
            setImages(prev => {
                const newImages = [...prev, ...uploadedUrls];
                onImagesChange?.(newImages);
                return newImages;
            });
        }

        const failedUpload = uploadResults.find(
            (result): result is PromiseRejectedResult => result.status === 'rejected'
        );

        if (failedUpload) {
            const message = failedUpload.reason instanceof Error ? failedUpload.reason.message : 'Upload failed';
            setError(message);
        }

        setPendingPreviewUrls(prev => prev.filter(
            url => !tempBlobPreviews.some(({ blobUrl }) => blobUrl === url)
        ));
        setUploadingCount(prev => Math.max(0, prev - validFiles.length));
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        const imageUrl = images[index];
        if (blobPreviews[imageUrl]) {
            URL.revokeObjectURL(blobPreviews[imageUrl]);
            objectUrlsRef.current.delete(blobPreviews[imageUrl]);
            setBlobPreviews(prev => {
                const updated = { ...prev };
                delete updated[imageUrl];
                return updated;
            });
        }
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
                    {images.length + pendingPreviewUrls.length} / {maxImages}
                </span>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                    <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                            <img
                                src={blobPreviews[image] || image}
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

                {/* Uploading previews */}
                {pendingPreviewUrls.map((url, index) => (
                    <div key={`uploading-${url}-${index}`} className="relative">
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                            <img
                                src={url}
                                alt={`Uploading product ${index + 1}`}
                                className="w-full h-full object-cover opacity-70"
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
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
