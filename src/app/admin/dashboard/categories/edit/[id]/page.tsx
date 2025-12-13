import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditCategoryForm from './EditCategoryForm';

interface EditCategoryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
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
