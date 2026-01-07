'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { ZoomIn } from 'lucide-react';

interface ProductImageGalleryProps {
    images: string[];
    productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Prepare slides for lightbox
    const slides = images.map((src, index) => ({
        src,
        alt: `${productName} - تصویر ${index + 1}`,
    }));

    const openLightbox = () => {
        setIsLightboxOpen(true);
    };

    return (
        <>
            <div className="space-y-4">
                {/* Main Image */}
                <div
                    className="relative aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden group cursor-zoom-in"
                    onClick={openLightbox}
                >
                    <Image
                        src={images[selectedImage]}
                        alt={productName}
                        fill
                        className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                        priority
                        fetchPriority="high"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Zoom hint overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                            <ZoomIn className="w-6 h-6 text-gray-700" />
                        </div>
                    </div>
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
                                sizes="(max-width: 768px) 25vw, 12vw"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            <Lightbox
                open={isLightboxOpen}
                close={() => setIsLightboxOpen(false)}
                index={selectedImage}
                slides={slides}
                plugins={[Zoom, Thumbnails]}
                zoom={{
                    maxZoomPixelRatio: 3,
                    scrollToZoom: true,
                }}
                thumbnails={{
                    position: 'bottom',
                    width: 80,
                    height: 80,
                }}
                carousel={{
                    finite: images.length <= 1,
                }}
                controller={{
                    closeOnBackdropClick: true,
                }}
                styles={{
                    container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
                }}
                on={{
                    view: ({ index }) => setSelectedImage(index),
                }}
            />
        </>
    );
}

