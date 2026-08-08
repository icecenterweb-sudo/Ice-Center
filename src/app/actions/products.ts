'use server';

import { prisma } from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRoleAction } from '@/lib/admin-auth';
import { recordAudit } from '@/lib/audit';
import { z } from 'zod';
import { generateUniqueSlug } from '@/lib/slugify';
import {
    notifyWishlistUsersOnPriceDrop,
    notifyWishlistUsersOnRestock,
} from '@/lib/notifications';

const CACHE_PROFILE = { expire: 600 };

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
    specifications: z.record(z.string(), z.any()).optional().nullable(),
    isActive: z.boolean().default(true),
});

const updateProductSchema = createProductSchema;

// ============================================
// Helper: Parse FormData with Validation
// ============================================

function parseJsonField(value: string | null, fallback: unknown) {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

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
        images: parseJsonField(imagesData, []),
        features: parseJsonField(featuresData, []),
        specifications: parseJsonField(specificationsData, null),
        isActive: formData.get('isActive') === 'true',
    };
}

function computeInventoryStatus(stock: number): 'IN_STOCK' | 'OUT_OF_STOCK' {
    return stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

// ============================================
// Product Actions
// ============================================

export async function createProduct(formData: FormData) {
    // Auth check
    const admin = await requireRoleAction('PRODUCTS');

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

        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                listPrice: data.listPrice,
                stock: data.stock,
                inventoryStatus: computeInventoryStatus(data.stock),
                brand: data.brand,
                sku: data.sku || undefined,
                slug,
                isActive: data.isActive,
                subcategoryId: data.subcategoryId || undefined,
                images: data.images,
                thumbnail,
                features: data.features,
                specifications: data.specifications ?? undefined,
            }
        });

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_CREATE", "Product", product.id, `ایجاد محصول جدید "${product.name}" با قیمت ${product.price}`);

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
    } catch (error) {
        console.error('Failed to create product:', error);
        throw new Error('خطا در ثبت محصول');
    }

    redirect('/admin/dashboard/products');
}

export async function updateProduct(id: number, formData: FormData) {
    // Auth check
    const admin = await requireRoleAction('PRODUCTS');

    // Parse and validate
    const raw = parseProductFormData(formData);
    const result = updateProductSchema.safeParse(raw);

    if (!result.success) {
        throw new Error(result.error.issues.map(i => i.message).join('، '));
    }

    const data = result.data;

    try {
        // Fetch current values to detect price/stock changes
        const currentProduct = await prisma.product.findUnique({
            where: { id },
            select: { price: true, stock: true, name: true, slug: true, inventoryStatus: true },
        });

        const updateData: Record<string, unknown> = {
            name: data.name,
            description: data.description,
            price: data.price,
            listPrice: data.listPrice,
            stock: data.stock,
            inventoryStatus: computeInventoryStatus(data.stock),
            brand: data.brand,
            sku: data.sku || undefined,
            isActive: data.isActive,
            subcategoryId: data.subcategoryId || null,
        };

        // Always include images/features/specs so they can be cleared
        updateData.images = data.images;
        updateData.thumbnail = data.images.length > 0 ? data.images[0] : null;
        updateData.features = data.features;
        updateData.specifications = data.specifications ?? undefined;

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_UPDATE", "Product", product.id, `بروزرسانی مشخصات محصول "${product.name}" (موجودی: ${product.stock}، قیمت: ${product.price})`);

        // Non-blocking wishlist notifications
        if (currentProduct) {
            const wasOutOfStock = currentProduct.stock === 0 || currentProduct.inventoryStatus === 'OUT_OF_STOCK';
            const nowInStock = data.stock > 0;
            const priceDropped = data.price < currentProduct.price;

            if (wasOutOfStock && nowInStock) {
                notifyWishlistUsersOnRestock(id, currentProduct.name, currentProduct.slug).catch(console.error);
            } else if (priceDropped) {
                notifyWishlistUsersOnPriceDrop(
                    id,
                    currentProduct.name,
                    currentProduct.slug,
                    currentProduct.price,
                    data.price
                ).catch(console.error);
            }
        }

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        revalidateTag(`product:${currentProduct?.slug || ''}`, CACHE_PROFILE);
    } catch (error: unknown) {
        console.error('Failed to update product:', error);
        throw new Error('خطا در ویرایش محصول');
    }

    redirect('/admin/dashboard/products');
}

export async function deleteProduct(id: number) {
    // Auth check
    const admin = await requireRoleAction('PRODUCTS');

    try {
        // Check if product has variants
        const variantCount = await prisma.productVariant.count({
            where: { productId: id }
        });

        if (variantCount > 0) {
            throw new Error('این محصول دارای واریانت است. ابتدا واریانت‌ها را حذف کنید');
        }

        const product = await prisma.product.delete({
            where: { id }
        });

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_DELETE", "Product", product.id, `حذف محصول "${product.name}"`);

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        revalidateTag(`product:${product.slug}`, CACHE_PROFILE);
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete product:', error);
        throw new Error('خطا در حذف محصول');
    }
}

export async function toggleProductStatus(id: number) {
    // Auth check
    const admin = await requireRoleAction('PRODUCTS');

    try {
        // Atomic toggle via raw SQL — prevents lost-update race where two
        // concurrent toggles both read the same value and write the same result.
        const rows = await prisma.$queryRaw<{ isActive: boolean; name: string }[]>`
            UPDATE "Product" SET "isActive" = NOT "isActive" WHERE "id" = ${id} RETURNING "isActive", "name"
        `;
        const updated = rows[0];

        if (!updated) {
            throw new Error('محصول یافت نشد');
        }

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_TOGGLE", "Product", id, `تغییر وضعیت فعال بودن محصول "${updated.name}" به ${updated.isActive}`);

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to toggle product status:', error);
        throw new Error('خطا در تغییر وضعیت محصول');
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
    await requireRoleAction('PRODUCTS');

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
                isActive: data.isActive,
            }
        });

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to create variant:', error);
        throw new Error('خطا در ایجاد واریانت');
    }
}

export async function updateProductVariant(id: number, formData: FormData) {
    // Auth check
    await requireRoleAction('PRODUCTS');

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
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update variant:', error);
        throw new Error('خطا در ویرایش واریانت');
    }
}

export async function deleteProductVariant(id: number) {
    // Auth check
    await requireRoleAction('PRODUCTS');

    try {
        await prisma.productVariant.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete variant:', error);
        throw new Error('خطا در حذف واریانت');
    }
}

export async function bulkUpdateProductsAction(
    productIds: number[],
    action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' | 'CHANGE_SUBCATEGORY',
    subcategoryId?: number
) {
    const admin = await requireRoleAction('PRODUCTS');

    if (!productIds || productIds.length === 0) {
        throw new Error('هیچ محصولی انتخاب نشده است.');
    }

    if (!productIds.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('شناسه محصولات نامعتبر است');
    }

    if (productIds.length > 100) {
        throw new Error('حداکثر ۱۰۰ محصول در هر عملیات مجاز است');
    }

    if (action === 'CHANGE_SUBCATEGORY') {
        if (typeof subcategoryId !== 'number' || !Number.isInteger(subcategoryId) || subcategoryId <= 0) {
            throw new Error('زیردسته نامعتبر است');
        }
    }

    try {
        if (action === 'ACTIVATE') {
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { isActive: true }
            });
            await recordAudit(admin.adminId, 'PRODUCT_TOGGLE', 'Product', productIds[0], `فعال‌سازی گروهی ${productIds.length} محصول (شناسه‌ها: ${productIds.join(', ')})`);
        } else if (action === 'DEACTIVATE') {
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { isActive: false }
            });
            await recordAudit(admin.adminId, 'PRODUCT_TOGGLE', 'Product', productIds[0], `غیرفعال‌سازی گروهی ${productIds.length} محصول (شناسه‌ها: ${productIds.join(', ')})`);
        } else if (action === 'DELETE') {
            // Check for products with variants (same as single delete)
            const productsWithVariants = await prisma.productVariant.groupBy({
                by: ['productId'],
                where: { productId: { in: productIds } },
            });
            const blockedIds = new Set(productsWithVariants.map(v => v.productId));
            const deletableIds = productIds.filter(id => !blockedIds.has(id));

            if (deletableIds.length === 0) {
                throw new Error('تمامی محصولات انتخاب شده دارای واریانت هستند. ابتدا واریانت‌ها را حذف کنید.');
            }

            await prisma.product.deleteMany({
                where: { id: { in: deletableIds } }
            });

            const skippedCount = productIds.length - deletableIds.length;
            const details = skippedCount > 0
                ? `حذف گروهی ${deletableIds.length} محصول (${skippedCount} محصول دارای واریانت رد شد)`
                : `حذف گروهی ${deletableIds.length} محصول (شناسه‌ها: ${deletableIds.join(', ')})`;
            await recordAudit(admin.adminId, 'PRODUCT_DELETE', 'Product', deletableIds[0], details);
        } else if (action === 'CHANGE_SUBCATEGORY') {
            if (!subcategoryId) {
                throw new Error('زیردسته جدید مشخص نشده است.');
            }
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { subcategoryId }
            });
            await recordAudit(admin.adminId, 'PRODUCT_UPDATE', 'Product', productIds[0], `تغییر گروهی زیردسته ${productIds.length} محصول به زیردسته ${subcategoryId} (شناسه‌ها: ${productIds.join(', ')})`);
        }

        revalidatePath('/admin/dashboard/products');
        revalidateTag('homepage', CACHE_PROFILE);
        revalidateTag('products', CACHE_PROFILE);
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed bulk products update:', error);
        throw new Error('خطا در عملیات گروهی محصولات');
    }
}
