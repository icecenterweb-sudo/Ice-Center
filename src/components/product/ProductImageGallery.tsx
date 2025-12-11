'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
    images: string[];
    productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden group cursor-zoom-in">
                <Image
                    src={images[selectedImage]}
                    alt={productName}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                    priority
                />
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square rounded-lg border overflow-hidden transition-all ${selectedImage === index
                            ? 'border-gray-900 shadow-sm opacity-100'
                            : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                            }`}
                    >
                        <Image
                            src={image}
                            alt={`${productName} - تصویر ${index + 1}`}
                            fill
                            className="object-contain p-1"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
