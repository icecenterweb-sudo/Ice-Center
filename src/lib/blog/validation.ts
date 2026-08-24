import { z } from 'zod';
import { CANONICAL_SLUG_REGEX } from '@/lib/slugify-client';

// Post Status
export const PostStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']);
export type PostStatus = z.infer<typeof PostStatusEnum>;

// Block types for Tiptap content
export type BlockType =
    | 'paragraph'
    | 'heading'
    | 'image'
    | 'bulletList'
    | 'orderedList'
    | 'listItem'        // List item wrapper
    | 'blockquote'
    | 'codeBlock'
    | 'horizontalRule'
    | 'text'            // Inline text node
    | 'productBlock'    // Custom: embed product cards
    | 'faqBlock'        // Future: FAQ accordion
    | 'galleryBlock'    // Future: image gallery
    | 'quoteBlock';     // Future: styled quotes

export interface ContentBlock {
    type: string; // Using string for flexibility with Tiptap
    attrs?: Record<string, unknown>;
    content?: ContentBlock[];
    text?: string; // For text nodes
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

// ProductBlock uses slug for SEO consistency
export interface ProductBlockAttrs {
    productSlug: string;
    productName?: string;
    productImage?: string;
    productPrice?: number;
}

export interface BlogContent {
    type: 'doc';
    content: ContentBlock[];
}

// Create post validation
const optionalUrl = z.preprocess(
    (value) => {
        if (typeof value === 'string' && value.trim() === '') {
            return null;
        }
        return value;
    },
    z.string().url().optional().nullable()
);

export const createPostSchema = z.object({
    title: z.string().min(1, 'عنوان الزامی است').max(200, 'عنوان حداکثر ۲۰۰ کاراکتر'),
    slug: z.string()
        .min(1, 'اسلاگ الزامی است')
        .regex(CANONICAL_SLUG_REGEX, 'اسلاگ باید فقط شامل حروف، اعداد و خط تیره باشد'),
    summary: z.string().max(160, 'خلاصه حداکثر ۱۶۰ کاراکتر').optional().nullable(),
    coverImage: optionalUrl,
    thumbnail: optionalUrl,
    content: z.any(), // JSON block data
    seoTitle: z.string().max(60, 'عنوان سئو حداکثر ۶۰ کاراکتر').optional().nullable(),
    seoDescription: z.string().max(160, 'توضیحات سئو حداکثر ۱۶۰ کاراکتر').optional().nullable(),
    keywords: z.array(z.string()).optional().default([]),
    status: PostStatusEnum.optional().default('DRAFT'),
    publishedAt: z.coerce.date().optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    tagIds: z.array(z.number().int().positive()).optional().default([]),
    authorId: z.number().int().positive().optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Update post validation
export const updatePostSchema = createPostSchema.partial();
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// List posts query params
export const listPostsQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    status: PostStatusEnum.optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    categorySlug: z.string().optional(),
    tagSlug: z.string().optional(),
    search: z.string().optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

// Blog category validation
export const createCategorySchema = z.object({
    name: z.string().min(1, 'نام الزامی است'),
    slug: z.string()
        .min(1, 'اسلاگ الزامی است')
        .regex(CANONICAL_SLUG_REGEX, 'اسلاگ باید فقط شامل حروف، اعداد و خط تیره باشد'),
    description: z.string().optional().nullable(),
    image: z.string().url().optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Blog tag validation
export const createTagSchema = z.object({
    name: z.string().min(1, 'نام الزامی است'),
    slug: z.string()
        .min(1, 'اسلاگ الزامی است')
        .regex(CANONICAL_SLUG_REGEX, 'اسلاگ باید فقط شامل حروف، اعداد و خط تیره باشد'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

// API Response types
export interface BlogPostWithRelations {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    coverImage: string | null;
    thumbnail: string | null;
    content: BlogContent;
    seoTitle: string | null;
    seoDescription: string | null;
    keywords: string[];
    status: PostStatus;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
    tags: {
        id: number;
        name: string;
        slug: string;
    }[];
    author: {
        id: number;
        name: string | null;
    } | null;
}
