import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import CouponsClient from './CouponsClient';

export const metadata: Metadata = { title: 'کوپن‌ها' };

async function CouponsContent() {
    await connection(); // Opt out of caching for this page
    await requireRolePage('COUPONS');
    return <CouponsClient />;
}

export default function CouponsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری کوپن‌ها...</div>}>
            <CouponsContent />
        </Suspense>
    );
}
