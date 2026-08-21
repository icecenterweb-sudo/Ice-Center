import { connection } from 'next/server';
import BannersListClient from './BannersListClient';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function BannersContent() {
    await connection();
    await requireRolePage('BANNERS');
    return <BannersListClient />;
}

export default function BannersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <BannersContent />
        </Suspense>
    );
}

