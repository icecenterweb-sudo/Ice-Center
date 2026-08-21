import { connection } from 'next/server';
import SlidesListClient from './SlidesListClient';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function SlidesContent() {
    await connection();
    await requireRolePage('SLIDES');
    return <SlidesListClient />;
}

export default function SlidesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <SlidesContent />
        </Suspense>
    );
}

