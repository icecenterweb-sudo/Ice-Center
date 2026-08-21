'use server';

import { prisma } from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireRoleAction } from '@/lib/admin-auth';
import { z } from 'zod';
import { ActionResult } from '@/lib/action-result';

export type { ActionResult };

const CACHE_PROFILE = { expire: 600 };

const slugRegex = /^[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\-]+$/;

// ============================================
// Validation Schemas
// ============================================

const categorySchema = z.object({
    name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
    slug: z.string().min(1, 'اسلاگ الزامی است').regex(slugRegex, 'اسلاگ فقط شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد'),
    description: z.string().optional(),
    imageUrl: z.string().min(1).optional().nullable(),
    order: z.coerce.number().int('ترتیب باید یک عدد صحیح باشد').default(0),
});

const subcategorySchema = z.object({
    name: z.string().min(1, 'نام زیردسته الزامی است'),
    slug: z.string().min(1, 'اسلاگ الزامی است').regex(slugRegex, 'اسلاگ فقط شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد'),
    description: z.string().optional(),
    categoryId: z.number().int().positive('دسته‌بندی اصلی الزامی است'),
    order: z.coerce.number().int('ترتیب باید یک عدد صحیح باشد').default(0),
});

// ============================================
// Category Actions
// ============================================

export async function createCategory(formData: FormData): Promise<ActionResult<{ id: number }>> {
    try {
        // Auth check
        await requireRoleAction('CATEGORIES');

        const raw = {
            name: (formData.get('name') as string) || '',
            slug: (formData.get('slug') as string) || '',
            description: (formData.get('description') as string) || undefined,
            imageUrl: (formData.get('imageUrl') as string) || null,
            order: formData.get('order') ?? 0,
        };

        const result = categorySchema.safeParse(raw);
        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // Create category with default subcategory in a transaction
        const createdCategory = await prisma.$transaction(async (tx) => {
            // Check for duplicate category slug
            const existing = await tx.category.findUnique({
                where: { slug: data.slug }
            });
            if (existing) {
                const err = new Error('این اسلاگ قبلاً استفاده شده است');
                (err as { isSlugError?: boolean }).isSlugError = true;
                throw err;
            }

            // Create the category
            const category = await tx.category.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description || undefined,
                    image: data.imageUrl || undefined,
                    order: data.order,
                }
            });

            // Automatically create default subcategory
            await tx.subcategory.create({
                data: {
                    name: `عمومی`,
                    slug: `public`,
                    description: `زیردسته عمومی برای ${data.name}`,
                    categoryId: category.id,
                    order: 0,
                }
            });

            return category;
        });

        revalidatePath('/admin/dashboard/categories');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('categories', CACHE_PROFILE);

        return { success: true, data: { id: createdCategory.id } };
    } catch (error: unknown) {
        console.error('Failed to create category:', error);

        if ((error && typeof error === 'object' && 'code' in error && error.code === 'P2002') || (error && typeof error === 'object' && 'isSlugError' in error)) {
            return {
                success: false,
                error: 'این اسلاگ قبلاً استفاده شده است',
                fieldErrors: { slug: ['این اسلاگ قبلاً استفاده شده است'] },
            };
        }

        const message = error instanceof Error && error.message ? error.message : 'خطا در ایجاد دسته‌بندی';
        return { success: false, error: message };
    }
}

export async function updateCategory(id: number, formData: FormData): Promise<ActionResult> {
    try {
        // Auth check
        await requireRoleAction('CATEGORIES');

        const raw = {
            name: (formData.get('name') as string) || '',
            slug: (formData.get('slug') as string) || '',
            description: (formData.get('description') as string) || undefined,
            imageUrl: (formData.get('imageUrl') as string) || null,
            order: formData.get('order') ?? 0,
        };

        const result = categorySchema.safeParse(raw);
        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // Check if slug is taken by another category
        const existing = await prisma.category.findFirst({
            where: { slug: data.slug, id: { not: id } }
        });
        if (existing) {
            return {
                success: false,
                error: 'این اسلاگ قبلاً استفاده شده است',
                fieldErrors: { slug: ['این اسلاگ قبلاً استفاده شده است'] },
            };
        }

        await prisma.category.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || undefined,
                order: data.order,
                ...(data.imageUrl ? { image: data.imageUrl } : { image: null })
            }
        });

        revalidatePath('/admin/dashboard/categories');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('categories', CACHE_PROFILE);
        revalidateTag(`category:${id}`, CACHE_PROFILE);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update category:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return { success: false, error: 'این اسلاگ قبلاً استفاده شده است' };
        }

        const message = error instanceof Error && error.message ? error.message : 'خطا در ویرایش دسته‌بندی';
        return { success: false, error: message };
    }
}

export async function deleteCategory(id: number): Promise<ActionResult> {
    try {
        // Auth check
        await requireRoleAction('CATEGORIES');

        // Check if category has subcategories other than the automatic 'public' or if subcategories have products
        const subcategories = await prisma.subcategory.findMany({
            where: { categoryId: id },
            include: { _count: { select: { products: true } } }
        });

        const hasProducts = subcategories.some(s => s._count.products > 0);
        if (hasProducts) {
            return { success: false, error: 'محصولاتی به این دسته‌بندی متصل هستند و نمی‌توان آن را حذف کرد' };
        }

        // Check if there are user-created subcategories
        if (subcategories.length > 1 || (subcategories.length === 1 && subcategories[0].slug !== 'public')) {
            return { success: false, error: 'این دسته‌بندی دارای زیردسته است. ابتدا زیردسته‌ها را حذف کنید' };
        }

        // Delete default subcategory and category in transaction
        await prisma.$transaction([
            prisma.subcategory.deleteMany({ where: { categoryId: id } }),
            prisma.category.delete({ where: { id } })
        ]);

        revalidatePath('/admin/dashboard/categories');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('categories', CACHE_PROFILE);
        revalidateTag(`category:${id}`, CACHE_PROFILE);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete category:', error);
        const message = error instanceof Error && error.message ? error.message : 'خطا در حذف دسته‌بندی';
        return { success: false, error: message };
    }
}

// ============================================
// Subcategory Actions
// ============================================

export async function createSubcategory(formData: FormData): Promise<ActionResult<{ id: number }>> {
    try {
        // Auth check
        await requireRoleAction('CATEGORIES');

        const raw = {
            name: (formData.get('name') as string) || '',
            slug: (formData.get('slug') as string) || '',
            description: (formData.get('description') as string) || undefined,
            categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : 0,
            order: formData.get('order') ?? 0,
        };

        const result = subcategorySchema.safeParse(raw);
        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // Check if subcategory slug exists under this category
        const existing = await prisma.subcategory.findFirst({
            where: { categoryId: data.categoryId, slug: data.slug }
        });
        if (existing) {
            return {
                success: false,
                error: `این اسلاگ (${raw.slug}) قبلاً در این دسته‌بندی استفاده شده است`,
                fieldErrors: { slug: [`این اسلاگ قبلاً در این دسته‌بندی استفاده شده است`] },
            };
        }

        const subcategory = await prisma.subcategory.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || undefined,
                categoryId: data.categoryId,
                order: data.order,
            }
        });

        revalidatePath('/admin/dashboard/categories');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('categories', CACHE_PROFILE);
        revalidateTag(`subcategories:${data.categoryId}`, CACHE_PROFILE);
        revalidateTag(`products:category:${data.categoryId}`, CACHE_PROFILE);

        return { success: true, data: { id: subcategory.id } };
    } catch (error: unknown) {
        console.error('Failed to create subcategory:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return {
                success: false,
                error: `این اسلاگ قبلاً استفاده شده است`,
                fieldErrors: { slug: ['این اسلاگ قبلاً استفاده شده است'] },
            };
        }

        const message = error instanceof Error && error.message ? error.message : 'خطا در ایجاد زیردسته';
        return { success: false, error: message };
    }
}

export async function updateSubcategory(id: number, formData: FormData): Promise<ActionResult> {
    try {
        // Auth check
        await requireRoleAction('CATEGORIES');

        const raw = {
            name: (formData.get('name') as string) || '',
            slug: (formData.get('slug') as string) || '',
            description: (formData.get('description') as string) || undefined,
            categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : 0,
            order: formData.get('order') ?? 0,
        };

        const result = subcategorySchema.safeParse(raw);
        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // Check if subcategory slug exists under this category
        const existing = await prisma.subcategory.findFirst({
            where: { categoryId: data.categoryId, slug: data.slug, id: { not: id } }
        });
        if (existing) {
            return {
                success: false,
                error: `این اسلاگ (${raw.slug}) قبلاً در این دسته‌بندی استفاده شده است`,
                fieldErrors: { slug: [`این اسلاگ قبلاً در این دسته‌بندی استفاده شده است`] },
            };
        }

        await prisma.subcategory.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || undefined,
                categoryId: data.categoryId,
                order: data.order,
            }
        });

        revalidatePath('/admin/dashboard/categories');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('categories', CACHE_PROFILE);
        revalidateTag(`subcategories:${data.categoryId}`, CACHE_PROFILE);
        revalidateTag(`products:category:${data.categoryId}`, CACHE_PROFILE);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update subcategory:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return { success: false, error: `این اسلاگ قبلاً استفاده شده است` };
        }

        const message = error instanceof Error && error.message ? error.message : 'خطا در ویرایش زیردسته';
        return { success: false, error: message };
    }
}

export async function deleteSubcategory(id: number): Promise<ActionResult> {
    try {
        // Auth check
        await requireRoleAction('CATEGORIES');

        // Check if subcategory has products
        const productCount = await prisma.product.count({
            where: { subcategoryId: id }
        });

        if (productCount > 0) {
            return { success: false, error: 'محصولاتی به این زیردسته متصل هستند و نمی‌توان آن را حذف کرد' };
        }

        await prisma.subcategory.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/categories');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('categories', CACHE_PROFILE);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete subcategory:', error);
        const message = error instanceof Error && error.message ? error.message : 'خطا در حذف زیردسته';
        return { success: false, error: message };
    }
}
