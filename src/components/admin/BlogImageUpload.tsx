'use client';

import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { useState, useRef } from 'react';

interface BlogImageUploadProps {
    label: string;
    hint: string;
    value: string;
    onChange: (url: string) => void;
    aspectRatio?: 'video' | 'square' | 'thumbnail';
}

export default function BlogImageUpload({
    label,
    hint,
    value,
    onChange,
    aspectRatio = 'video',
}: BlogImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const aspectClasses = {
        video: 'aspect-video',
        square: 'aspect-square',
        thumbnail: 'w-32 h-24',
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'blog');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.url) {
                onChange(data.url);
            } else {
                alert(data.message || 'خطا در آپلود تصویر');
            }
        } catch {
            alert('خطا در آپلود تصویر');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            onChange(urlInput.trim());
            setUrlInput('');
            setShowUrlInput(false);
        }
    };

    const clearImage = () => {
        onChange('');
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            <div className="space-y-3">
                {value ? (
                    <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${aspectRatio === 'thumbnail' ? aspectClasses.thumbnail : aspectClasses[aspectRatio]}`}>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Upload Button */}
                        <label className={`block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-ocean hover:bg-frost/30 transition-all cursor-pointer group ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={uploading}
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-ocean animate-spin mb-2" />
                                    <p className="text-sm text-gray-500">در حال آپلود...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-frost text-ocean rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="font-medium text-gray-700 text-sm">آپلود تصویر</p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG تا 5MB</p>
                                </>
                            )}
                        </label>

                        {/* URL Input Toggle */}
                        {!showUrlInput ? (
                            <button
                                type="button"
                                onClick={() => setShowUrlInput(true)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-ocean transition-colors"
                            >
                                <LinkIcon className="w-3 h-3" />
                                یا از طریق لینک
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={handleUrlSubmit}
                                    className="px-3 py-2 bg-ocean text-white rounded-lg text-sm hover:bg-royal transition-colors"
                                >
                                    تایید
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(false)}
                                    className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    لغو
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-xs text-gray-500">{hint}</p>
            </div>
        </div>
    );
}
