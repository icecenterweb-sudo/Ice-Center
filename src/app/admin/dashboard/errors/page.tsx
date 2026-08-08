import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import ErrorsView from './ErrorsView';

async function ErrorsContent() {
    await connection(); // Make it fully dynamic
    await requireRolePage('ERRORS');

    // Retrieve the last 200 error logs to render in the client panel
    const logs = await prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200
    });

    return <ErrorsView initialLogs={logs} />;
}

export default function ErrorsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری لاگ خطاهای سیستم...</div>}>
            <ErrorsContent />
        </Suspense>
    );
}
