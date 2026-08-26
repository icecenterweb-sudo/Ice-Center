import CategoryForm from './CategoryForm';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function AddCategoryContent() {
    await connection();
    await requireRolePage('CATEGORIES');
    return <CategoryForm />;
}

export default function AddCategoryPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddCategoryContent />
        </Suspense>
    );
}

