import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ProductBlockView from './ProductBlockView';

export const ProductBlock = Node.create({
    name: 'productBlock',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            productSlug: {
                default: null,
            },
            productName: {
                default: 'محصول',
            },
            productImage: {
                default: null,
            },
            productPrice: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'product-block',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['product-block', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ProductBlockView);
    },
});
