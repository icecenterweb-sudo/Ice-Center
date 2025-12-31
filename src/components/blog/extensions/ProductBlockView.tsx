'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Image from 'next/image';

export default function ProductBlockView(props: NodeViewProps) {
    const { productSlug, productName, productImage, productPrice } = props.node.attrs;

    return (
        <NodeViewWrapper className="product-block-component my-6">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                {productImage ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                        <Image
                            src={productImage}
                            alt={productName}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                        تصویر
                    </div>
                )}

                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{productName || 'نام محصول'}</h4>
                    <p className="text-sm text-gray-500 mt-1">Slug: {productSlug}</p>
                    {productPrice && (
                        <p className="text-ocean font-bold mt-1">
                            {Number(productPrice).toLocaleString('fa-IR')} تومان
                        </p>
                    )}
                </div>

                <button
                    onClick={props.deleteNode}
                    className="text-red-500 text-sm hover:bg-red-50 p-2 rounded"
                    title="حذف"
                >
                    حذف
                </button>
            </div>
        </NodeViewWrapper>
    );
}
