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
            <div className="relative aspect-square bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-lg">
                <Image
                    src={images[selectedImage]}
                    alt={productName}
                    fill
                    className="object-contain p-8"
                    priority
                />
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${selectedImage === index
                                ? 'border-blue-500 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <Image
                            src={image}
                            alt={`${productName} - تصویر ${index + 1}`}
                            fill
                            className="object-contain p-2"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
