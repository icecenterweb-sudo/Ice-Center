'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin-auth';
import { z } from 'zod';
import { generateUniqueSlug } from '@/lib/slugify';

// ============================================
// Validation Schemas
// ============================================

const createProductSchema = z.object({
    name: z.string().min(1, 'نام محصول الزامی است'),
    description: z.string().optional(),
    price: z.number().positive('قیمت باید عدد مثبت باشد'),
    listPrice: z.number().positive().optional().nullable(),
    stock: z.number().int().min(0).default(0),
    brand: z.string().optional(),
    sku: z.string().optional(),
    subcategoryId: z.number().int().positive().optional().nullable(),
    images: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    specifications: z.any().optional().nullable(),
});

const updateProductSchema = createProductSchema.extend({
    isActive: z.boolean().default(true),
});

// ============================================
// Helper: Parse FormData with Validation
// ============================================

function parseProductFormData(formData: FormData) {
    const imagesData = formData.get('imagesData') as string | null;
    const featuresData = formData.get('features') as string | null;
    const specificationsData = formData.get('specifications') as string | null;

    return {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        price: parseFloat(formData.get('price') as string),
        listPrice: formData.get('listPrice') ? parseFloat(formData.get('listPrice') as string) : null,
        stock: parseInt(formData.get('stock') as string) || 0,
        brand: (formData.get('brand') as string) || undefined,
        sku: (formData.get('sku') as string) || undefined,
        subcategoryId: formData.get('subcategoryId') ? parseInt(formData.get('subcategoryId') as string) : null,
        images: imagesData ? JSON.parse(imagesData) : [],
        features: featuresData ? JSON.parse(featuresData) : [],
        specifications: specificationsData ? JSON.parse(specificationsData) : null,
        isActive: formData.get('isActive') === 'true',
    };
}

// ============================================
// Product Actions
// ============================================

export async function createProduct(formData: FormData) {
    // Auth check
    await requireAdminAction();

    // Parse and validate
    const raw = parseProductFormData(formData);
    const result = createProductSchema.safeParse(raw);

    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        // Generate a clean, unique slug
        const slug = await generateUniqueSlug(data.name, 'product');
        const thumbnail = data.images.length > 0 ? data.images[0] : null;

        await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                listPrice: data.listPrice,
                stock: data.stock,
                brand: data.brand,
                sku: data.sku || undefined,
                slug,
                isActive: true,
                subcategoryId: data.subcategoryId || undefined,
                images: data.images,
                thumbnail,
                features: data.features,
                specifications: data.specifications,
            }
        });

        revalidatePath('/admin/dashboard/products');
    } catch (error) {
        console.error('Failed to create product:', error);
        throw new Error('خطا در ثبت محصول');
    }

    redirect('/admin/dashboard/products');
}

export async function updateProduct(id: number, formData: FormData) {
    // Auth check
    await requireAdminAction();

    // Parse and validate
    const raw = parseProductFormData(formData);
    const result = updateProductSchema.safeParse(raw);

    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        const updateData: Record<string, unknown> = {
            name: data.name,
            description: data.description,
            price: data.price,
            listPrice: data.listPrice,
            stock: data.stock,
            brand: data.brand,
            sku: data.sku || undefined,
            isActive: data.isActive,
            subcategoryId: data.subcategoryId || null,
        };

        if (data.images.length > 0) {
            updateData.images = data.images;
            updateData.thumbnail = data.images[0];
        }

        if (data.features.length > 0) {
            updateData.features = data.features;
        }

        if (data.specifications) {
            updateData.specifications = data.specifications;
        }

        await prisma.product.update({
            where: { id },
            data: updateData,
        });

        revalidatePath('/admin/dashboard/products');
    } catch (error: unknown) {
        console.error('Failed to update product:', error);
        const message = error instanceof Error ? error.message : 'خطا در ویرایش محصول';
        throw new Error(message);
    }

    redirect('/admin/dashboard/products');
}

export async function deleteProduct(id: number) {
    // Auth check
    await requireAdminAction();

    try {
        // Check if product has variants
        const variantCount = await prisma.productVariant.count({
            where: { productId: id }
        });

        if (variantCount > 0) {
            throw new Error('این محصول دارای واریانت است. ابتدا واریانت‌ها را حذف کنید');
        }

        await prisma.product.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete product:', error);
        const message = error instanceof Error ? error.message : 'خطا در حذف محصول';
        throw new Error(message);
    }
}

export async function toggleProductStatus(id: number) {
    // Auth check
    await requireAdminAction();

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { isActive: true }
        });

        if (!product) {
            throw new Error('محصول یافت نشد');
        }

        await prisma.product.update({
            where: { id },
            data: { isActive: !product.isActive }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to toggle product status:', error);
        const message = error instanceof Error ? error.message : 'خطا در تغییر وضعیت محصول';
        throw new Error(message);
    }
}

// ============================================
// Product Variant Actions
// ============================================

const variantSchema = z.object({
    name: z.string().min(1, 'نام واریانت الزامی است'),
    sku: z.string().optional(),
    capacity: z.string().optional(),
    phase: z.number().int().optional().nullable(),
    voltage: z.string().optional(),
    price: z.number().positive('قیمت باید عدد مثبت باشد'),
    stock: z.number().int().min(0).default(0),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

function parseVariantFormData(formData: FormData) {
    return {
        name: formData.get('name') as string,
        sku: (formData.get('sku') as string) || undefined,
        capacity: (formData.get('capacity') as string) || undefined,
        phase: formData.get('phase') ? parseInt(formData.get('phase') as string) : null,
        voltage: (formData.get('voltage') as string) || undefined,
        price: parseFloat(formData.get('price') as string),
        stock: parseInt(formData.get('stock') as string) || 0,
        isDefault: formData.get('isDefault') === 'true',
        isActive: formData.get('isActive') === 'true',
    };
}

export async function createProductVariant(productId: number, formData: FormData) {
    // Auth check
    await requireAdminAction();

    const raw = parseVariantFormData(formData);
    const result = variantSchema.safeParse(raw);

    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        await prisma.productVariant.create({
            data: {
                productId,
                name: data.name,
                sku: data.sku || undefined,
                capacity: data.capacity || undefined,
                phase: data.phase || undefined,
                voltage: data.voltage || undefined,
                price: data.price,
                stock: data.stock,
                isDefault: data.isDefault,
                isActive: true,
            }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to create variant:', error);
        const message = error instanceof Error ? error.message : 'خطا در ایجاد واریانت';
        throw new Error(message);
    }
}

export async function updateProductVariant(id: number, formData: FormData) {
    // Auth check
    await requireAdminAction();

    const raw = parseVariantFormData(formData);
    const result = variantSchema.safeParse(raw);

    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        await prisma.productVariant.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku || undefined,
                capacity: data.capacity || undefined,
                phase: data.phase || undefined,
                voltage: data.voltage || undefined,
                price: data.price,
                stock: data.stock,
                isDefault: data.isDefault,
                isActive: data.isActive,
            }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update variant:', error);
        const message = error instanceof Error ? error.message : 'خطا در ویرایش واریانت';
        throw new Error(message);
    }
}

export async function deleteProductVariant(id: number) {
    // Auth check
    await requireAdminAction();

    try {
        await prisma.productVariant.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete variant:', error);
        const message = error instanceof Error ? error.message : 'خطا در حذف واریانت';
        throw new Error(message);
    }
}
