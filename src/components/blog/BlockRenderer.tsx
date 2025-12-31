'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { BlogContent, ContentBlock } from '@/lib/blog/validation';

interface ProductBlockData {
    productSlug: string;
    productName?: string;
    productImage?: string;
    productPrice?: number;
}

// Render a single block based on its type
function renderBlock(block: ContentBlock, index: number): React.ReactNode {
    switch (block.type) {
        case 'paragraph':
            return (
                <p key={index} className="mb-4 leading-8 text-gray-700">
                    {block.content?.map((child, i) => renderInlineContent(child, i))}
                </p>
            );

        case 'heading': {
            const level = (block.attrs?.level as number) || 2;
            const headingClasses: Record<number, string> = {
                1: 'text-3xl font-bold mb-6 mt-8 text-black',
                2: 'text-2xl font-bold mb-4 mt-6 text-black',
                3: 'text-xl font-semibold mb-3 mt-5 text-black',
                4: 'text-lg font-semibold mb-2 mt-4 text-black',
                5: 'text-base font-medium mb-2 mt-3 text-black',
                6: 'text-sm font-medium mb-2 mt-3 text-black',
            };
            const className = headingClasses[level] || headingClasses[2];
            const children = block.content?.map((child, i) => renderInlineContent(child, i));

            switch (level) {
                case 1: return <h1 key={index} className={className}>{children}</h1>;
                case 2: return <h2 key={index} className={className}>{children}</h2>;
                case 3: return <h3 key={index} className={className}>{children}</h3>;
                case 4: return <h4 key={index} className={className}>{children}</h4>;
                case 5: return <h5 key={index} className={className}>{children}</h5>;
                case 6: return <h6 key={index} className={className}>{children}</h6>;
                default: return <h2 key={index} className={className}>{children}</h2>;
            }
        }

        case 'image':
            return (
                <figure key={index} className="my-6">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        <Image
                            src={block.attrs?.src as string}
                            alt={(block.attrs?.alt as string) || ''}
                            fill
                            className="object-cover"
                        />
                    </div>
                    {block.attrs?.title ? (
                        <figcaption className="text-center text-sm text-gray-500 mt-2">
                            {String(block.attrs.title)}
                        </figcaption>
                    ) : null}
                </figure>
            );

        case 'bulletList':
            return (
                <ul key={index} className="list-disc mr-6 mb-4 space-y-2">
                    {block.content?.map((item, i) => (
                        <li key={i} className="text-gray-700 leading-8">
                            {/* Render list item content inline - extract text from nested paragraphs */}
                            {item.content?.map((child, j) => {
                                if (child.type === 'paragraph') {
                                    return child.content?.map((c, k) => renderInlineContent(c, k));
                                }
                                return renderInlineContent(child, j);
                            })}
                        </li>
                    ))}
                </ul>
            );

        case 'orderedList':
            return (
                <ol key={index} className="list-decimal mr-6 mb-4 space-y-2">
                    {block.content?.map((item, i) => (
                        <li key={i} className="text-gray-700 leading-8">
                            {/* Render list item content inline - extract text from nested paragraphs */}
                            {item.content?.map((child, j) => {
                                if (child.type === 'paragraph') {
                                    return child.content?.map((c, k) => renderInlineContent(c, k));
                                }
                                return renderInlineContent(child, j);
                            })}
                        </li>
                    ))}
                </ol>
            );

        case 'blockquote':
            return (
                <blockquote
                    key={index}
                    className="border-r-4 border-ocean bg-frost pr-4 py-3 my-4 rounded-l-lg"
                >
                    {block.content?.map((child, i) => renderBlock(child, i))}
                </blockquote>
            );

        case 'codeBlock':
            return (
                <pre key={index} className="bg-midnight text-white p-4 rounded-xl my-4 overflow-x-auto" dir="ltr">
                    <code className="text-sm font-mono">
                        {block.content?.map((child) =>
                            child.type === 'text' ? (child.attrs?.text as string) : ''
                        ).join('')}
                    </code>
                </pre>
            );

        case 'horizontalRule':
            return <hr key={index} className="my-8 border-gray-200" />;

        case 'productBlock': {
            const productData = block.attrs as unknown as ProductBlockData;
            return (
                <div
                    key={index}
                    className="my-6 p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow"
                >
                    <Link href={`/products/${productData.productSlug}`} className="flex items-center gap-4">
                        {productData.productImage && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={productData.productImage}
                                    alt={productData.productName || ''}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 hover:text-ocean transition-colors">
                                {productData.productName || 'محصول'}
                            </h4>
                            {productData.productPrice && (
                                <p className="text-ocean font-bold mt-1">
                                    {productData.productPrice.toLocaleString('fa-IR')} تومان
                                </p>
                            )}
                        </div>
                        <span className="text-sm text-ocean">مشاهده محصول ←</span>
                    </Link>
                </div>
            );
        }

        default:
            // Handle unknown block types gracefully
            if (block.content) {
                return (
                    <div key={index}>
                        {block.content.map((child, i) => renderBlock(child, i))}
                    </div>
                );
            }
            return null;
    }
}

// Render inline content (text with marks)
function renderInlineContent(block: ContentBlock, index: number): React.ReactNode {
    // Handle hardBreak (line breaks)
    if (block.type === 'hardBreak') {
        return <br key={index} />;
    }

    if (block.type === 'text') {
        // Tiptap stores text in block.text, NOT block.attrs.text
        let content: React.ReactNode = block.text || '';
        // Tiptap stores marks in block.marks, NOT block.attrs.marks
        const marks = block.marks;

        if (marks) {
            marks.forEach((mark) => {
                switch (mark.type) {
                    case 'bold':
                        content = <strong key={`bold-${index}`}>{content}</strong>;
                        break;
                    case 'italic':
                        content = <em key={`italic-${index}`}>{content}</em>;
                        break;
                    case 'underline':
                        content = <u key={`underline-${index}`}>{content}</u>;
                        break;
                    case 'strike':
                        content = <s key={`strike-${index}`}>{content}</s>;
                        break;
                    case 'code':
                        content = (
                            <code key={`code-${index}`} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                                {content}
                            </code>
                        );
                        break;
                    case 'link':
                        content = (
                            <Link
                                key={`link-${index}`}
                                href={(mark.attrs?.href as string) || '#'}
                                className="text-ocean hover:text-royal underline"
                                target={mark.attrs?.target as string}
                            >
                                {content}
                            </Link>
                        );
                        break;
                }
            });
        }
        return <React.Fragment key={index}>{content}</React.Fragment>;
    }
    return renderBlock(block, index);
}

interface BlockRendererProps {
    content: BlogContent | null;
}

export default function BlockRenderer({ content }: BlockRendererProps) {
    if (!content || !content.content) {
        return <p className="text-gray-500">محتوایی موجود نیست.</p>;
    }

    return (
        <article className="prose prose-lg max-w-none" dir="rtl">
            {content.content.map((block, index) => renderBlock(block, index))}
        </article>
    );
}
