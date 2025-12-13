import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditSubcategoryForm from './EditSubcategoryForm';

interface EditSubcategoryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditSubcategoryPage({ params }: EditSubcategoryPageProps) {
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
