'use server';

import { prisma } from '@/lib/db';
import { requireRoleAction } from '@/lib/admin-auth';
import { recordAudit } from '@/lib/audit';
import { z } from 'zod';
import { generateUniqueSlug } from '@/lib/slugify';
import {
    notifyWishlistUsersOnPriceDrop,
    notifyWishlistUsersOnRestock,
} from '@/lib/notifications';
import type { ActionResult } from '@/lib/action-result';
import { invalidateProductCache } from '@/lib/cache/invalidation';

const productSlugRegex = /^[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\-]+$/;

/** Prisma unique-constraint violation (e.g. duplicate slug/SKU under a race). */
function isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error
        && (error as { code?: unknown }).code === 'P2002';
}

// ============================================
// Validation Schemas
// ============================================

const createProductSchema = z.object({
    name: z.string().min(1, 'نام محصول الزامی است'),
    description: z.string().optional().nullable(),
    price: z.number().positive('قیمت باید عدد مثبت باشد'),
    listPrice: z.number().positive('قیمت خط‌خورده باید عدد مثبت باشد').optional().nullable(),
    stock: z.number().int().min(0, 'موجودی نمی‌تواند منفی باشد').default(0),
    brand: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    slug: z.string()
        .min(1, 'اسلاگ الزامی است')
        .regex(productSlugRegex, 'اسلاگ فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد')
        .optional(),
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
    } catch (error) {
        // Malformed payload must not silently wipe the stored field (#29)
        console.error('[parseJsonField] Malformed JSON, using fallback:', error);
        return fallback;
    }
}

function parseProductFormData(formData: FormData) {
    const imagesData = formData.get('imagesData') as string | null;
    const featuresData = formData.get('features') as string | null;
    const specificationsData = formData.get('specifications') as string | null;
    const slugRaw = (formData.get('slug') as string) || '';

    const descRaw = formData.get('description') as string | null;
    const brandRaw = formData.get('brand') as string | null;
    const skuRaw = formData.get('sku') as string | null;

    return {
        name: formData.get('name') as string,
        description: descRaw !== null && descRaw !== undefined ? (descRaw.trim() || null) : null,
        price: parseFloat(formData.get('price') as string),
        listPrice: formData.get('listPrice') ? parseFloat(formData.get('listPrice') as string) : null,
        stock: parseInt(formData.get('stock') as string) || 0,
        brand: brandRaw !== null && brandRaw !== undefined ? (brandRaw.trim() || null) : null,
        sku: skuRaw !== null && skuRaw !== undefined ? (skuRaw.trim() || null) : null,
        slug: slugRaw.trim() || undefined,
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

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        // Parse and validate
        const raw = parseProductFormData(formData);
        const result = createProductSchema.safeParse(raw);

        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // Generate or use provided slug
        let slug = data.slug;
        if (!slug) {
            slug = await generateUniqueSlug(data.name, 'product');
        } else {
            const existing = await prisma.product.findUnique({ where: { slug } });
            if (existing) {
                return {
                    success: false,
                    error: 'این اسلاگ قبلاً استفاده شده است',
                    fieldErrors: { slug: ['این اسلاگ قبلاً استفاده شده است'] },
                };
            }
        }

        const thumbnail = data.images.length > 0 ? data.images[0] : null;

        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                price: data.price,
                listPrice: data.listPrice ?? null,
                stock: data.stock,
                inventoryStatus: computeInventoryStatus(data.stock),
                brand: data.brand ?? null,
                sku: data.sku ? data.sku.trim() : null,
                slug,
                isActive: data.isActive,
                subcategoryId: data.subcategoryId ?? null,
                images: data.images,
                thumbnail,
                features: data.features,
                specifications: data.specifications ?? undefined,
            }
        });

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_CREATE", "Product", product.id, `ایجاد محصول جدید "${product.name}" با قیمت ${product.price}`);

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateProductCache({
            id: product.id,
            slug: product.slug,
            subcategoryId: product.subcategoryId,
        });

        return { success: true, data: { id: product.id, slug: product.slug } };
    } catch (error: unknown) {
        console.error('Failed to create product:', error);
        if (isUniqueConstraintError(error)) {
            return {
                success: false,
                error: 'این اسلاگ یا کد محصول (SKU) قبلاً استفاده شده است',
                fieldErrors: { slug: ['این اسلاگ یا کد محصول (SKU) قبلاً استفاده شده است'] },
            };
        }
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در ثبت محصول. لطفاً دوباره تلاش کنید';
        return { success: false, error: errorMsg };
    }
}

export async function updateProduct(id: number, formData: FormData): Promise<ActionResult> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        // Parse and validate
        const raw = parseProductFormData(formData);
        const result = updateProductSchema.safeParse(raw);

        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // Fetch current values to detect changes and for invalidation
        const currentProduct = await prisma.product.findUnique({
            where: { id },
            select: { price: true, stock: true, name: true, slug: true, inventoryStatus: true, subcategoryId: true },
        });

        if (!currentProduct) {
            return { success: false, error: 'محصول مورد نظر یافت نشد' };
        }

        // Validate slug uniqueness if changed
        if (data.slug && data.slug !== currentProduct.slug) {
            const existingWithSlug = await prisma.product.findFirst({
                where: { slug: data.slug, id: { not: id } }
            });
            if (existingWithSlug) {
                return {
                    success: false,
                    error: 'این اسلاگ قبلاً برای محصول دیگری استفاده شده است',
                    fieldErrors: { slug: ['این اسلاگ قبلاً برای محصول دیگری استفاده شده است'] },
                };
            }
        }

        // #14 fix: Nullable fields must be explicitly passed as null when cleared
        const updateData: Record<string, unknown> = {
            name: data.name,
            description: data.description ?? null,
            price: data.price,
            listPrice: data.listPrice ?? null,
            stock: data.stock,
            inventoryStatus: computeInventoryStatus(data.stock),
            brand: data.brand ?? null,
            sku: data.sku ? data.sku.trim() : null,
            isActive: data.isActive,
            subcategoryId: data.subcategoryId ?? null,
        };

        if (data.slug) {
            updateData.slug = data.slug;
        }

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
        await recordAudit(admin.adminId, "PRODUCT_UPDATE", "Product", product.id, `به‌روزرسانی مشخصات محصول "${product.name}" (موجودی: ${product.stock}، قیمت: ${product.price})`);

        // Non-blocking wishlist notifications
        const wasOutOfStock = currentProduct.stock === 0 || currentProduct.inventoryStatus === 'OUT_OF_STOCK';
        const nowInStock = data.stock > 0;
        const currentPriceNum = Number(currentProduct.price);
        const priceDropped = data.price < currentPriceNum;

        if (wasOutOfStock && nowInStock) {
            notifyWishlistUsersOnRestock(id, currentProduct.name, currentProduct.slug).catch(console.error);
        } else if (priceDropped) {
            notifyWishlistUsersOnPriceDrop(
                id,
                currentProduct.name,
                currentProduct.slug,
                currentPriceNum,
                data.price
            ).catch(console.error);
        }

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateProductCache({
            id: product.id,
            slug: product.slug,
            oldSlug: currentProduct.slug,
            subcategoryId: product.subcategoryId,
            oldSubcategoryId: currentProduct.subcategoryId,
        });

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update product:', error);
        if (isUniqueConstraintError(error)) {
            return { success: false, error: 'این اسلاگ یا کد محصول (SKU) قبلاً استفاده شده است' };
        }
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در ویرایش محصول. لطفاً دوباره تلاش کنید';
        return { success: false, error: errorMsg };
    }
}

export async function deleteProduct(id: number): Promise<ActionResult> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        // Check if product has variants
        const variantCount = await prisma.productVariant.count({
            where: { productId: id }
        });

        if (variantCount > 0) {
            return { success: false, error: 'این محصول دارای واریانت است. ابتدا واریانت‌ها را حذف کنید' };
        }

        const product = await prisma.product.delete({
            where: { id },
            select: { id: true, name: true, slug: true, subcategoryId: true }
        });

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_DELETE", "Product", product.id, `حذف محصول "${product.name}"`);

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateProductCache({
            id: product.id,
            slug: product.slug,
            subcategoryId: product.subcategoryId,
        });

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete product:', error);
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در حذف محصول. لطفاً دوباره تلاش کنید';
        return { success: false, error: errorMsg };
    }
}

export async function toggleProductStatus(id: number): Promise<ActionResult<{ isActive: boolean }>> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        // Atomic toggle via raw SQL
        const rows = await prisma.$queryRaw<{ id: number; isActive: boolean; name: string; slug: string; subcategoryId: number | null }[]>`
            UPDATE "Product" SET "isActive" = NOT "isActive", "updatedAt" = NOW() WHERE "id" = ${id} RETURNING "id", "isActive", "name", "slug", "subcategoryId"
        `;
        const updated = rows[0];

        if (!updated) {
            return { success: false, error: 'محصول مورد نظر یافت نشد' };
        }

        // Record Audit log
        await recordAudit(admin.adminId, "PRODUCT_TOGGLE", "Product", id, `تغییر وضعیت فعال بودن محصول "${updated.name}" به ${updated.isActive}`);

        // Centralized cache invalidation (#5, #6, B2)
        await invalidateProductCache({
            id: updated.id,
            slug: updated.slug,
            subcategoryId: updated.subcategoryId,
        });

        return { success: true, data: { isActive: updated.isActive } };
    } catch (error: unknown) {
        console.error('Failed to toggle product status:', error);
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در تغییر وضعیت محصول';
        return { success: false, error: errorMsg };
    }
}

// ============================================
// Product Variant Actions
// ============================================

const variantSchema = z.object({
    name: z.string().min(1, 'نام واریانت الزامی است'),
    sku: z.string().optional().nullable(),
    capacity: z.string().optional().nullable(),
    phase: z.number().int().optional().nullable(),
    voltage: z.string().optional().nullable(),
    price: z.number().positive('قیمت باید عدد مثبت باشد'),
    stock: z.number().int().min(0, 'موجودی نمی‌تواند منفی باشد').default(0),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

function parseVariantFormData(formData: FormData) {
    const skuRaw = formData.get('sku') as string | null;
    const capRaw = formData.get('capacity') as string | null;
    const voltRaw = formData.get('voltage') as string | null;

    return {
        name: formData.get('name') as string,
        sku: skuRaw !== null && skuRaw !== undefined ? (skuRaw.trim() || null) : null,
        capacity: capRaw !== null && capRaw !== undefined ? (capRaw.trim() || null) : null,
        phase: formData.get('phase') ? parseInt(formData.get('phase') as string) : null,
        voltage: voltRaw !== null && voltRaw !== undefined ? (voltRaw.trim() || null) : null,
        price: parseFloat(formData.get('price') as string),
        stock: parseInt(formData.get('stock') as string) || 0,
        isDefault: formData.get('isDefault') === 'true',
        isActive: formData.get('isActive') === 'true',
    };
}

export async function createProductVariant(productId: number, formData: FormData): Promise<ActionResult> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        const raw = parseVariantFormData(formData);
        const result = variantSchema.safeParse(raw);

        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        await prisma.productVariant.create({
            data: {
                productId,
                name: data.name,
                sku: data.sku ? data.sku.trim() : null,
                capacity: data.capacity ?? null,
                phase: data.phase ?? null,
                voltage: data.voltage ?? null,
                price: data.price,
                stock: data.stock,
                isDefault: data.isDefault,
                isActive: data.isActive,
            }
        });

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, slug: true, subcategoryId: true },
        });

        if (product) {
            await invalidateProductCache({
                id: product.id,
                slug: product.slug,
                subcategoryId: product.subcategoryId,
            });
        }

        recordAudit(admin.adminId, 'VARIANT_CREATE', 'ProductVariant', productId, `ایجاد واریانت "${data.name}" برای محصول #${productId}`);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to create variant:', error);
        if (isUniqueConstraintError(error)) {
            return {
                success: false,
                error: 'این کد واریانت (SKU) قبلاً استفاده شده است',
                fieldErrors: { sku: ['این کد واریانت (SKU) قبلاً استفاده شده است'] },
            };
        }
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در ایجاد واریانت';
        return { success: false, error: errorMsg };
    }
}

export async function updateProductVariant(id: number, formData: FormData): Promise<ActionResult> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        const raw = parseVariantFormData(formData);
        const result = variantSchema.safeParse(raw);

        if (!result.success) {
            return {
                success: false,
                error: result.error.issues.map(i => i.message).join('، '),
                fieldErrors: result.error.flatten().fieldErrors,
            };
        }

        const data = result.data;

        // #14 fix: Nullable fields explicitly set to null when cleared
        const variant = await prisma.productVariant.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku ? data.sku.trim() : null,
                capacity: data.capacity ?? null,
                phase: data.phase ?? null,
                voltage: data.voltage ?? null,
                price: data.price,
                stock: data.stock,
                isDefault: data.isDefault,
                isActive: data.isActive,
            },
            include: {
                product: { select: { id: true, slug: true, subcategoryId: true } },
            },
        });

        if (variant.product) {
            await invalidateProductCache({
                id: variant.product.id,
                slug: variant.product.slug,
                subcategoryId: variant.product.subcategoryId,
            });
        }

        recordAudit(admin.adminId, 'VARIANT_UPDATE', 'ProductVariant', id, `ویرایش واریانت "${data.name}" (#${id})`);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update variant:', error);
        if (isUniqueConstraintError(error)) {
            return { success: false, error: 'این کد واریانت (SKU) قبلاً استفاده شده است' };
        }
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در ویرایش واریانت';
        return { success: false, error: errorMsg };
    }
}

export async function deleteProductVariant(id: number): Promise<ActionResult> {
    try {
        // Auth check
        const admin = await requireRoleAction('PRODUCTS');

        const variant = await prisma.productVariant.delete({
            where: { id },
            include: {
                product: { select: { id: true, slug: true, subcategoryId: true } },
            },
        });

        if (variant.product) {
            await invalidateProductCache({
                id: variant.product.id,
                slug: variant.product.slug,
                subcategoryId: variant.product.subcategoryId,
            });
        }

        recordAudit(admin.adminId, 'VARIANT_DELETE', 'ProductVariant', id, `حذف واریانت #${id}`);

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete variant:', error);
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در حذف واریانت';
        return { success: false, error: errorMsg };
    }
}

export async function bulkUpdateProductsAction(
    productIds: number[],
    action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' | 'CHANGE_SUBCATEGORY',
    subcategoryId?: number
): Promise<ActionResult> {
    try {
        const admin = await requireRoleAction('PRODUCTS');

        if (!productIds || productIds.length === 0) {
            return { success: false, error: 'هیچ محصولی انتخاب نشده است' };
        }

        if (!productIds.every(id => Number.isInteger(id) && id > 0)) {
            return { success: false, error: 'شناسه محصولات نامعتبر است' };
        }

        if (productIds.length > 100) {
            return { success: false, error: 'حداکثر ۱۰۰ محصول در هر عملیات مجاز است' };
        }

        if (action === 'CHANGE_SUBCATEGORY') {
            if (typeof subcategoryId !== 'number' || !Number.isInteger(subcategoryId) || subcategoryId <= 0) {
                return { success: false, error: 'زیردسته نامعتبر است' };
            }
        }

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
            // Check for products with variants
            const productsWithVariants = await prisma.productVariant.groupBy({
                by: ['productId'],
                where: { productId: { in: productIds } },
            });
            const blockedIds = new Set(productsWithVariants.map(v => v.productId));
            const deletableIds = productIds.filter(id => !blockedIds.has(id));

            if (deletableIds.length === 0) {
                return { success: false, error: 'تمامی محصولات انتخاب شده دارای واریانت هستند. ابتدا واریانت‌ها را حذف کنید.' };
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
                return { success: false, error: 'زیردسته جدید مشخص نشده است' };
            }
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { subcategoryId }
            });
            await recordAudit(admin.adminId, 'PRODUCT_UPDATE', 'Product', productIds[0], `تغییر گروهی زیردسته ${productIds.length} محصول به زیردسته ${subcategoryId} (شناسه‌ها: ${productIds.join(', ')})`);
        }

        // Invalidate product caches
        if (productIds.length > 0) {
            await invalidateProductCache({
                id: productIds[0],
                subcategoryId: subcategoryId,
            });
        }

        return { success: true };
    } catch (error: unknown) {
        console.error('Failed bulk products update:', error);
        const errorMsg = error instanceof Error && error.message ? error.message : 'خطا در عملیات گروهی محصولات';
        return { success: false, error: errorMsg };
    }
}
