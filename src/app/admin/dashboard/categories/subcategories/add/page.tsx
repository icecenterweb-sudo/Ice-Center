import { prisma } from '@/lib/db';
import SubcategoryForm from './SubcategoryForm';
import { connection } from 'next/server';
import { Suspense } from 'react';

async function AddSubcategoryContent({
    searchParams
}: {
    searchParams: Promise<{ categoryId?: string }>
}) {
    await connection();
    const params = await searchParams;
    const categoryId = params.categoryId ? parseInt(params.categoryId) : null;

    // Fetch all categories for the dropdown
    const categories = await prisma.category.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }]
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

export default function AddSubcategoryPage(props: { searchParams: Promise<{ categoryId?: string }> }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddSubcategoryContent {...props} />
        </Suspense>
    );
}
