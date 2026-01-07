import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditCategoryForm from './EditCategoryForm';
import { connection } from 'next/server';
import { Suspense } from 'react';

interface EditCategoryPageProps {
    params: Promise<{ id: string }>;
}

async function EditCategoryContent({ params }: EditCategoryPageProps) {
    await connection();
    const { id } = await params;
    const categoryId = parseInt(id);

    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if (!category) {
        notFound();
    }

    return <EditCategoryForm category={category} />;
}

export default function EditCategoryPage(props: EditCategoryPageProps) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditCategoryContent {...props} />
        </Suspense>
    );
}
