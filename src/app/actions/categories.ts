'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin-auth';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const categorySchema = z.object({
    name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
    slug: z.string().min(1, 'اسلاگ الزامی است').regex(/^[a-z0-9-]+$/, 'اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره باشد'),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
});

const subcategorySchema = z.object({
    name: z.string().min(1, 'نام زیردسته الزامی است'),
    slug: z.string().min(1, 'اسلاگ الزامی است').regex(/^[a-z0-9-]+$/, 'اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره باشد'),
    description: z.string().optional(),
    categoryId: z.number().int().positive('دسته‌بندی اصلی الزامی است'),
});

// ============================================
// Category Actions
// ============================================

export async function createCategory(formData: FormData) {
    // Auth check
    await requireAdminAction();

    const raw = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: (formData.get('description') as string) || undefined,
        imageUrl: (formData.get('imageUrl') as string) || null,
    };

    const result = categorySchema.safeParse(raw);
    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        // Create category with default subcategory in a transaction
        await prisma.$transaction(async (tx) => {
            // Create the category
            const category = await tx.category.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description || undefined,
                    image: data.imageUrl || undefined
                }
            });

            // Automatically create default subcategory
            // Slug is scoped to category, so "public" can be reused across categories
            await tx.subcategory.create({
                data: {
                    name: `عمومی`,  // "Public/General"
                    slug: `public`,  // Simple, reusable (unique per category)
                    description: `زیردسته عمومی برای ${data.name}`,
                    categoryId: category.id
                }
            });
        });

        revalidatePath('/admin/dashboard/categories');
    } catch (error: unknown) {
        console.error('Failed to create category:', error);

        // Check for unique constraint violation
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            throw new Error('این اسلاگ قبلاً استفاده شده است');
        }

        throw new Error('خطا در ایجاد دسته‌بندی');
    }

    redirect('/admin/dashboard/categories');
}

export async function updateCategory(id: number, formData: FormData) {
    // Auth check
    await requireAdminAction();

    const raw = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: (formData.get('description') as string) || undefined,
        imageUrl: (formData.get('imageUrl') as string) || null,
    };

    const result = categorySchema.safeParse(raw);
    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        await prisma.category.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || undefined,
                ...(data.imageUrl && { image: data.imageUrl })
            }
        });

        revalidatePath('/admin/dashboard/categories');
    } catch (error) {
        console.error('Failed to update category:', error);
        throw new Error('خطا در ویرایش دسته‌بندی');
    }

    redirect('/admin/dashboard/categories');
}

export async function deleteCategory(id: number) {
    // Auth check
    await requireAdminAction();

    try {
        // Check if category has subcategories
        const subcategoryCount = await prisma.subcategory.count({
            where: { categoryId: id }
        });

        if (subcategoryCount > 0) {
            throw new Error('این دسته‌بندی دارای زیردسته است و نمی‌توان آن را حذف کرد');
        }

        await prisma.category.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/categories');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete category:', error);
        const message = error instanceof Error ? error.message : 'خطا در حذف دسته‌بندی';
        throw new Error(message);
    }
}

// ============================================
// Subcategory Actions
// ============================================

export async function createSubcategory(formData: FormData) {
    // Auth check
    await requireAdminAction();

    const raw = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: (formData.get('description') as string) || undefined,
        categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : 0,
    };

    const result = subcategorySchema.safeParse(raw);
    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        await prisma.subcategory.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || undefined,
                categoryId: data.categoryId,
            }
        });

        revalidatePath('/admin/dashboard/categories');
    } catch (error: unknown) {
        console.error('Failed to create subcategory:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            throw new Error(`این اسلاگ (${raw.slug}) قبلاً استفاده شده است. لطفاً اسلاگ دیگری انتخاب کنید`);
        }

        throw new Error('خطا در ایجاد زیردسته');
    }

    redirect('/admin/dashboard/categories');
}

export async function updateSubcategory(id: number, formData: FormData) {
    // Auth check
    await requireAdminAction();

    const raw = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: (formData.get('description') as string) || undefined,
        categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : 0,
    };

    const result = subcategorySchema.safeParse(raw);
    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        await prisma.subcategory.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || undefined,
                categoryId: data.categoryId,
            }
        });

        revalidatePath('/admin/dashboard/categories');
    } catch (error) {
        console.error('Failed to update subcategory:', error);
        throw new Error('خطا در ویرایش زیردسته');
    }

    redirect('/admin/dashboard/categories');
}

export async function deleteSubcategory(id: number) {
    // Auth check
    await requireAdminAction();

    try {
        // Check if subcategory has products
        const productCount = await prisma.product.count({
            where: { subcategoryId: id }
        });

        if (productCount > 0) {
            throw new Error('محصولاتی به این زیردسته متصل هستند و نمی‌توان آن را حذف کرد');
        }

        await prisma.subcategory.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/categories');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete subcategory:', error);
        const message = error instanceof Error ? error.message : 'خطا در حذف زیردسته';
        throw new Error(message);
    }
}
