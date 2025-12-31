'use client';

import React from 'react';
import './editor.css'; // Direct CSS import for editor styles
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    ImageIcon,
    LinkIcon,
    AlignRight,
    AlignCenter,
    AlignLeft,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Minus,
    ShoppingBag,
} from 'lucide-react';
import { ProductBlock } from './extensions/ProductExtension';

interface BlogEditorProps {
    content?: object;
    onChange: (content: object) => void;
    placeholder?: string;
}

export default function BlogEditor({
    content,
    onChange,
    placeholder = 'محتوای پست خود را اینجا بنویسید...',
}: BlogEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-ocean underline',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            ProductBlock,
        ],
        content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 text-gray-900',
                dir: 'rtl',
            },
        },
    });

    if (!editor) {
        return (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
            </div>
        );
    }

    const addImage = () => {
        const url = window.prompt('آدرس تصویر را وارد کنید:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addLink = () => {
        const url = window.prompt('آدرس لینک را وارد کنید:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addProduct = async () => {
        const slug = window.prompt('اسلاگ محصول را وارد کنید (مثال: bar-seft-kon):');
        if (!slug) return;

        try {
            // Fetch product data from API by slug
            const response = await fetch(`/api/products/slug/${slug}`);
            if (response.ok) {
                const product = await response.json();
                editor.chain().focus().insertContent({
                    type: 'productBlock',
                    attrs: {
                        productSlug: slug,
                        productName: product.name || 'محصول',
                        productImage: product.thumbnail || product.images?.[0] || '',
                        productPrice: product.price || 0,
                    },
                }).run();
            } else {
                // Product not found, use manual entry
                const name = window.prompt('محصول یافت نشد. نام محصول را وارد کنید:') || 'محصول';
                editor.chain().focus().insertContent({
                    type: 'productBlock',
                    attrs: {
                        productSlug: slug,
                        productName: name,
                        productImage: '',
                        productPrice: 0,
                    },
                }).run();
            }
        } catch {
            // Fallback to manual entry on error
            const name = window.prompt('خطا در دریافت اطلاعات محصول. نام محصول را وارد کنید:') || 'محصول';
            editor.chain().focus().insertContent({
                type: 'productBlock',
                attrs: {
                    productSlug: slug,
                    productName: name,
                    productImage: '',
                    productPrice: 0,
                },
            }).run();
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
                {/* Undo/Redo */}
                <div className="flex gap-1 border-l border-gray-300 pl-2 ml-2">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="برگرداندن"
                    >
                        <Undo className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="بازگردانی"
                    >
                        <Redo className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Headings */}
                <div className="flex gap-1 border-l border-gray-300 pl-2 ml-2">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="عنوان ۱"
                    >
                        <Heading1 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="عنوان ۲"
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive('heading', { level: 3 })}
                        title="عنوان ۳"
                    >
                        <Heading3 className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Text formatting */}
                <div className="flex gap-1 border-l border-gray-300 pl-2 ml-2">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="درشت"
                    >
                        <Bold className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="کج"
                    >
                        <Italic className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive('strike')}
                        title="خط‌خورده"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        active={editor.isActive('code')}
                        title="کد"
                    >
                        <Code className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Lists */}
                <div className="flex gap-1 border-l border-gray-300 pl-2 ml-2">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="لیست نقطه‌ای"
                    >
                        <List className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="لیست شماره‌ای"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive('blockquote')}
                        title="نقل قول"
                    >
                        <Quote className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Alignment */}
                <div className="flex gap-1 border-l border-gray-300 pl-2 ml-2">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        active={editor.isActive({ textAlign: 'right' })}
                        title="راست‌چین"
                    >
                        <AlignRight className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        active={editor.isActive({ textAlign: 'center' })}
                        title="وسط‌چین"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        active={editor.isActive({ textAlign: 'left' })}
                        title="چپ‌چین"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Media */}
                <div className="flex gap-1">
                    <ToolbarButton onClick={addImage} title="افزودن تصویر">
                        <ImageIcon className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={addLink} title="افزودن لینک">
                        <LinkIcon className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="خط افقی"
                    >
                        <Minus className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={addProduct} title="افزودن محصول">
                        <ShoppingBag className="w-4 h-4" />
                    </ToolbarButton>
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} className="min-h-[400px]" />
        </div>
    );
}

// Toolbar button component - uses onMouseDown to prevent focus loss
function ToolbarButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                if (!disabled) {
                    onClick();
                }
            }}
            disabled={disabled}
            title={title}
            className={`p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${active ? 'bg-ocean text-white hover:bg-royal' : 'text-gray-700'
                }`}
        >
            {children}
        </button>
    );
}
