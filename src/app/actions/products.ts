'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ============================================
// Product Actions
// ============================================

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const listPrice = formData.get('listPrice') ? parseFloat(formData.get('listPrice') as string) : null;
    const stock = parseInt(formData.get('stock') as string) || 0;
    const brand = formData.get('brand') as string;
    const sku = formData.get('sku') as string;
    const subcategoryId = formData.get('subcategoryId') as string;
    const imagesData = formData.get('imagesData') as string | null;
    const featuresData = formData.get('features') as string | null;
    const specificationsData = formData.get('specifications') as string | null;

    // Basic validation
    if (!name || isNaN(price)) {
        throw new Error('لطفاً نام و قیمت را وارد کنید');
    }

    try {
        // Generate a simple slug
        const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

        // Parse images array
        const images = imagesData ? JSON.parse(imagesData) : [];
        const thumbnail = images.length > 0 ? images[0] : null;

        // Parse features and specifications
        const features = featuresData ? JSON.parse(featuresData) : [];
        const specifications = specificationsData ? JSON.parse(specificationsData) : null;

        await prisma.product.create({
            data: {
                name,
                description,
                price,
                listPrice,
                stock,
                brand,
                sku: sku || undefined,
                slug,
                isActive: true,
                subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
                images: images,
                thumbnail: thumbnail,
                features: features,
                specifications: specifications
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
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const listPrice = formData.get('listPrice') ? parseFloat(formData.get('listPrice') as string) : null;
    const stock = parseInt(formData.get('stock') as string) || 0;
    const brand = formData.get('brand') as string;
    const sku = formData.get('sku') as string;
    const subcategoryId = formData.get('subcategoryId') as string;
    const isActive = formData.get('isActive') === 'true';
    const imagesData = formData.get('imagesData') as string | null;
    const featuresData = formData.get('features') as string | null;
    const specificationsData = formData.get('specifications') as string | null;

    if (!name || isNaN(price)) {
        throw new Error('لطفاً نام و قیمت را وارد کنید');
    }

    try {
        // Parse images array if new images uploaded
        const updateData: any = {
            name,
            description: description || undefined,
            price,
            listPrice,
            stock,
            brand: brand || undefined,
            sku: sku || undefined,
            isActive,
            subcategoryId: subcategoryId ? parseInt(subcategoryId) : null
        };

        if (imagesData) {
            const images = JSON.parse(imagesData);
            updateData.images = images;
            updateData.thumbnail = images.length > 0 ? images[0] : null;
        }

        // Update features and specifications
        if (featuresData) {
            updateData.features = JSON.parse(featuresData);
        }
        if (specificationsData) {
            updateData.specifications = JSON.parse(specificationsData);
        }

        await prisma.product.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/admin/dashboard/products');
    } catch (error) {
        console.error('Failed to update product:', error);
        throw new Error('خطا در ویرایش محصول');
    }

    redirect('/admin/dashboard/products');
}

export async function deleteProduct(id: number) {
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
    } catch (error: any) {
        console.error('Failed to delete product:', error);
        throw new Error(error.message || 'خطا در حذف محصول');
    }
}

export async function toggleProductStatus(id: number) {
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
    } catch (error: any) {
        console.error('Failed to toggle product status:', error);
        throw new Error(error.message || 'خطا در تغییر وضعیت محصول');
    }
}

// ============================================
// Product Variant Actions
// ============================================

export async function createProductVariant(productId: number, formData: FormData) {
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const capacity = formData.get('capacity') as string;
    const phase = formData.get('phase') as string;
    const voltage = formData.get('voltage') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string) || 0;
    const isDefault = formData.get('isDefault') === 'true';

    if (!name || isNaN(price)) {
        throw new Error('لطفاً نام و قیمت را وارد کنید');
    }

    try {
        await prisma.productVariant.create({
            data: {
                productId,
                name,
                sku: sku || undefined,
                capacity: capacity || undefined,
                phase: phase ? parseInt(phase) : undefined,
                voltage: voltage || undefined,
                price,
                stock,
                isDefault,
                isActive: true
            }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error) {
        console.error('Failed to create variant:', error);
        throw new Error('خطا در ایجاد واریانت');
    }
}

export async function updateProductVariant(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const capacity = formData.get('capacity') as string;
    const phase = formData.get('phase') as string;
    const voltage = formData.get('voltage') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string) || 0;
    const isDefault = formData.get('isDefault') === 'true';
    const isActive = formData.get('isActive') === 'true';

    if (!name || isNaN(price)) {
        throw new Error('لطفاً نام و قیمت را وارد کنید');
    }

    try {
        await prisma.productVariant.update({
            where: { id },
            data: {
                name,
                sku: sku || undefined,
                capacity: capacity || undefined,
                phase: phase ? parseInt(phase) : undefined,
                voltage: voltage || undefined,
                price,
                stock,
                isDefault,
                isActive
            }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error) {
        console.error('Failed to update variant:', error);
        throw new Error('خطا در ویرایش واریانت');
    }
}

export async function deleteProductVariant(id: number) {
    try {
        await prisma.productVariant.delete({
            where: { id }
        });

        revalidatePath('/admin/dashboard/products');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete variant:', error);
        throw new Error(error.message || 'خطا در حذف واریانت');
    }
}
