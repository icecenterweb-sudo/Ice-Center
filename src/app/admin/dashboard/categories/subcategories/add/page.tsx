import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import SubcategoryForm from './SubcategoryForm';

export default async function AddSubcategoryPage({
    searchParams
}: {
    searchParams: Promise<{ categoryId?: string }>
}) {
    const params = await searchParams;
    const categoryId = params.categoryId ? parseInt(params.categoryId) : null;

    // Fetch all categories for the dropdown
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    if (categories.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">ابتدا دسته‌بندی ایجاد کنید</h1>
                <p className="text-gray-600">برای افزودن زیردسته، ابتدا باید حداقل یک دسته‌بندی اصلی داشته باشید.</p>
            </div>
        );
    }

    return <SubcategoryForm categories={categories} defaultCategoryId={categoryId} />;
}
