import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import AddCouponClient from './AddCouponClient';

async function AddCouponContent() {
    await connection();
    await requireRolePage('COUPONS');
    return <AddCouponClient />;
}

export default function AddCouponPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddCouponContent />
        </Suspense>
    );
}
