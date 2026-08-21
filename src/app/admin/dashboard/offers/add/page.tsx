import { connection } from 'next/server';
import AddOfferClient from './AddOfferClient';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function AddOfferContent() {
    await connection();
    await requireRolePage('OFFERS');
    return <AddOfferClient />;
}

export default function AddOfferPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddOfferContent />
        </Suspense>
    );
}

