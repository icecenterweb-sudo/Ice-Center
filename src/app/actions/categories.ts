'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ============================================
// Category Actions
// ============================================

export async function createCategory(formData: FormData) {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string | null;

    if (!name || !slug) {
        throw new Error('نام و اسلاگ الزامی است');
    }

    try {
        // Create category with default subcategory in a transaction
        await prisma.$transaction(async (tx) => {
            // Create the category
            const category = await tx.category.create({
                data: {
                    name,
                    slug,
                    description: description || undefined,
                    image: imageUrl || undefined
                }
            });

            // Automatically create default subcategory
            // Slug is scoped to category, so "public" can be reused across categories
            await tx.subcategory.create({
                data: {
                    name: `عمومی`,  // "Public/General"
                    slug: `public`,  // Simple, reusable (unique per category)
                    description: `زیردسته عمومی برای ${name}`,
                    categoryId: category.id
                }
            });
        });

        revalidatePath('/admin/dashboard/categories');
    } catch (error: any) {
        console.error('Failed to create category:', error);

        // Check for unique constraint violation
        if (error.code === 'P2002') {
            throw new Error('این اسلاگ قبلاً استفاده شده است');
        }

        throw new Error('خطا در ایجاد دسته‌بندی');
    }

    redirect('/admin/dashboard/categories');
}

export async function updateCategory(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string | null;

    if (!name || !slug) {
        throw new Error('نام و اسلاگ الزامی است');
    }

    try {
        await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description: description || undefined,
                ...(imageUrl && { image: imageUrl })
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
    } catch (error: any) {
        console.error('Failed to delete category:', error);
        throw new Error(error.message || 'خطا در حذف دسته‌بندی');
    }
}

// ============================================
// Subcategory Actions
// ============================================

export async function createSubcategory(formData: FormData) {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;

    if (!name || !slug || !categoryId) {
        throw new Error('نام، اسلاگ و دسته‌بندی اصلی الزامی است');
    }

    try {
        await prisma.subcategory.create({
            data: {
                name,
                slug,
                description: description || undefined,
                categoryId: parseInt(categoryId)
            }
        });

        revalidatePath('/admin/dashboard/categories');
    } catch (error: any) {
        console.error('Failed to create subcategory:', error);

        // Check for unique constraint violation
        if (error.code === 'P2002') {
            throw new Error(`این اسلاگ (${slug}) قبلاً استفاده شده است. لطفاً اسلاگ دیگری انتخاب کنید`);
        }

        throw new Error('خطا در ایجاد زیردسته');
    }

    redirect('/admin/dashboard/categories');
}

export async function updateSubcategory(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;

    if (!name || !slug || !categoryId) {
        throw new Error('نام، اسلاگ و دسته‌بندی اصلی الزامی است');
    }

    try {
        await prisma.subcategory.update({
            where: { id },
            data: {
                name,
                slug,
                description: description || undefined,
                categoryId: parseInt(categoryId)
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
    } catch (error: any) {
        console.error('Failed to delete subcategory:', error);
        throw new Error(error.message || 'خطا در حذف زیردسته');
    }
}
