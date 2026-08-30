import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import EditCouponClient from './EditCouponClient';

interface Props {
    params: Promise<{ id: string }>;
}

async function EditCouponContent({ params }: Props) {
    await connection();
    await requireRolePage('COUPONS');
    const { id } = await params;
    return <EditCouponClient id={id} />;
}

export default function EditCouponPage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditCouponContent {...props} />
        </Suspense>
    );
}
