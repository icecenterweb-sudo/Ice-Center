import { connection } from 'next/server';
import AddOfferClient from './AddOfferClient';
import { Suspense } from 'react';

async function AddOfferContent() {
    await connection();
    return <AddOfferClient />;
}

export default function AddOfferPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddOfferContent />
        </Suspense>
    );
}

