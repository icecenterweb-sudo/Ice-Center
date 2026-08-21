import { connection } from 'next/server';
import AddBannerClient from './AddBannerClient';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function AddBannerContent() {
    await connection(); // Required for cacheComponents
    await requireRolePage('BANNERS');
    return <AddBannerClient />;
}

export default function AddBannerPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddBannerContent />
        </Suspense>
    );
}
