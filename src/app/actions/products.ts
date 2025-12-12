'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const brand = formData.get('brand') as string;
    const sku = formData.get('sku') as string;
    // const categoryId = parseInt(formData.get('category') as string); // Need to fix schema/seed first

    // Basic validation
    if (!name || isNaN(price)) {
        return { error: 'لطفاً نام و قیمت را وارد کنید' };
    }

    try {
        // Generate a simple slug
        const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

        await prisma.product.create({
            data: {
                name,
                description,
                price,
                stock,
                brand,
                sku: sku || undefined,
                slug,
                isActive: true,
                // Temporary hardcoded default until category selection is robust
                // subcategoryId: categoryId || undefined 
            }
        });

        revalidatePath('/admin/dashboard/products');
    } catch (error) {
        console.error('Failed to create product:', error);
        return { error: 'خطا در ثبت محصول' };
    }

    redirect('/admin/dashboard/products');
}
