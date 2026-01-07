import { connection } from 'next/server';
import BannersListClient from './BannersListClient';
import { Suspense } from 'react';

async function BannersContent() {
    await connection();
    return <BannersListClient />;
}

export default function BannersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <BannersContent />
        </Suspense>
    );
}

