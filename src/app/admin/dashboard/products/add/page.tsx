import { prisma } from '@/lib/db';
import AddProductForm from './AddProductForm';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function AddProductContent() {
    await connection();
    await requireRolePage('PRODUCTS');
    // Fetch subcategories with their categories
    const subcategories = await prisma.subcategory.findMany({
        include: {
            category: true
        },
        orderBy: {
            category: {
                name: 'asc'
            }
        }
    });

    return <AddProductForm subcategories={subcategories} />;
}

export default function AddProductPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddProductContent />
        </Suspense>
    );
}
