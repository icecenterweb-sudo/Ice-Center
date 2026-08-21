import { connection } from 'next/server';
import EditOfferClient from './EditOfferClient';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

interface Props {
    params: Promise<{ id: string }>;
}

async function EditOfferContent({ params }: Props) {
    await connection();
    await requireRolePage('OFFERS');
    const { id } = await params;
    return <EditOfferClient id={id} />;
}

export default function EditOfferPage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditOfferContent {...props} />
        </Suspense>
    );
}

