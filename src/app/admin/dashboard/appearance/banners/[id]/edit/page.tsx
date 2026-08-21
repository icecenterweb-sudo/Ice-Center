import { connection } from 'next/server';
import EditBannerClient from './EditBannerClient';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

interface Props {
    params: Promise<{ id: string }>;
}

async function EditBannerContent({ params }: Props) {
    await connection(); // Required for cacheComponents
    await requireRolePage('BANNERS');
    const { id } = await params;
    return <EditBannerClient id={id} />;
}

export default function EditBannerPage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditBannerContent {...props} />
        </Suspense>
    );
}
