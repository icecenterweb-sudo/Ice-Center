'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Check, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface MediaItem {
    url: string;
    filename: string;
    folder: string;
    size: number;
    updatedAt: string;
}

interface MediaGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    title?: string;
    targetSize?: string; // e.g. "1920x400", "768x180", "1600x200", "800x200", "768x256"
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaGalleryModal({
    isOpen,
    onClose,
    onSelect,
    title = 'گالری تصاویر و بنرها',
    targetSize,
}: MediaGalleryModalProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('all');
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});

    // Parse target width and height if targetSize is provided (e.g., "1920x400")
    const targetW = targetSize ? parseInt(targetSize.toLowerCase().split('x')[0] || '0', 10) : 0;
    const targetH = targetSize ? parseInt(targetSize.toLowerCase().split('x')[1] || '0', 10) : 0;
    const targetRatio = targetW > 0 && targetH > 0 ? targetW / targetH : 0;

    const loadMedia = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/media');
            const data = await res.json();
            if (data.success) {
                setMedia(data.media);
            }
        } catch (error) {
            console.error('Failed to load media gallery:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadMedia();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Get unique folders
    const folders = ['all', ...Array.from(new Set(media.map((m) => m.folder)))];

    // Filter media
    const filteredMedia = media.filter((item) => {
        const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.url.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = selectedFolder === 'all' || item.folder === selectedFolder;
        return matchesSearch && matchesFolder;
    });

    const handleConfirmSelect = (url: string) => {
        onSelect(url);
        onClose();
    };

    const handleImageLoad = (url: string, naturalWidth: number, naturalHeight: number) => {
        if (naturalWidth && naturalHeight) {
            setImageDimensions((prev) => ({
                ...prev,
                [url]: { width: naturalWidth, height: naturalHeight },
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ocean/10 text-ocean flex items-center justify-center">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                            <p className="text-xs text-gray-500">
                                {filteredMedia.length} تصویر یافت شد
                                {targetSize && (
                                    <span className="mr-2 text-ocean font-semibold">
                                        (اندازه پیشنهادی: {targetSize.replace('x', '×')} پیکسل)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadMedia}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                            title="بروزرسانی لیست"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجو در نام فایل..."
                            className="w-full pr-9 pl-4 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-ocean/20 outline-none text-gray-900"
                        />
                    </div>

                    {/* Folder Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                        {folders.map((folder) => (
                            <button
                                key={folder}
                                onClick={() => setSelectedFolder(folder)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                                    selectedFolder === folder
                                        ? 'bg-ocean text-white font-bold shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {folder === 'all' ? 'همه پوشه‌ها' : folder}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Media Grid Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="w-8 h-8 text-ocean animate-spin mb-3" />
                            <span className="text-xs">در حال دریافت گالری تصاویر...</span>
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">تصویری یافت نشد</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredMedia.map((item) => {
                                const isSelected = selectedUrl === item.url;
                                const dims = imageDimensions[item.url];

                                // Check size/dimension matching logic
                                let isMatch = false;
                                if (dims && targetW > 0 && targetH > 0) {
                                    const exactMatch = dims.width === targetW && dims.height === targetH;
                                    const ratio = dims.width / dims.height;
                                    const ratioMatch = Math.abs(ratio - targetRatio) < 0.25;
                                    isMatch = exactMatch || ratioMatch;
                                }

                                return (
                                    <div
                                        key={item.url}
                                        onClick={() => setSelectedUrl(item.url)}
                                        onDoubleClick={() => handleConfirmSelect(item.url)}
                                        className={`group relative rounded-2xl overflow-hidden bg-white border-2 transition-all cursor-pointer select-none flex flex-col justify-between aspect-square ${
                                            isSelected
                                                ? 'border-ocean ring-4 ring-ocean/10 shadow-md scale-[0.98]'
                                                : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {/* Image Preview */}
                                        <div className="relative w-full flex-1 bg-gray-100 overflow-hidden">
                                            <Image
                                                src={item.url}
                                                alt={item.filename}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 50vw, 200px"
                                                onLoad={(e) => {
                                                    const img = e.currentTarget;
                                                    handleImageLoad(item.url, img.naturalWidth, img.naturalHeight);
                                                }}
                                            />

                                            {/* Top-Right Selection Checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-ocean text-white flex items-center justify-center shadow-md">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}

                                            {/* Bottom-Left Image Size Badge */}
                                            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 pointer-events-none" dir="ltr">
                                                {dims ? (
                                                    <span
                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 transition-all ${
                                                            isMatch
                                                                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/60 shadow-emerald-500/30'
                                                                : 'bg-black/65 backdrop-blur-md text-white/95 border border-white/15'
                                                        }`}
                                                    >
                                                        {isMatch && <Sparkles className="w-3 h-3 text-white fill-white animate-pulse" />}
                                                        {dims.width} × {dims.height}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-black/65 backdrop-blur-md text-white/90 border border-white/15">
                                                        {formatFileSize(item.size)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Name & Folder details */}
                                        <div className="p-2.5 bg-white text-right border-t border-gray-50">
                                            <p className="text-[11px] font-bold text-gray-800 truncate" title={item.filename}>
                                                {item.filename}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                {item.folder}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
                    <p className="text-xs text-gray-500 hidden sm:block">
                        {selectedUrl ? `تصویر انتخاب شده: ${selectedUrl}` : 'تصویر مورد نظر خود را دوبار کلیک یا انتخاب کنید.'}
                    </p>

                    <div className="flex items-center gap-3 mr-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-xs font-medium"
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            disabled={!selectedUrl}
                            onClick={() => selectedUrl && handleConfirmSelect(selectedUrl)}
                            className="px-5 py-2 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <Check className="w-4 h-4" />
                            انتخاب تصویر
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
