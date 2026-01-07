import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditSubcategoryForm from './EditSubcategoryForm';
import { connection } from 'next/server';
import { Suspense } from 'react';

interface EditSubcategoryPageProps {
    params: Promise<{ id: string }>;
}

async function EditSubcategoryContent({ params }: EditSubcategoryPageProps) {
    await connection();
    const { id } = await params;
    const subcategoryId = parseInt(id);

    const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId },
        include: {
            category: true
        }
    });

    if (!subcategory) {
        notFound();
    }

    // Get all categories for the dropdown
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    return <EditSubcategoryForm subcategory={subcategory} categories={categories} />;
}

export default function EditSubcategoryPage(props: EditSubcategoryPageProps) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditSubcategoryContent {...props} />
        </Suspense>
    );
}
