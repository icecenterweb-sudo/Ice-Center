import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'مدیریت دسترسی‌ها' };

import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { requireRolePage } from '@/lib/admin-auth';
import { AdminRole } from '@prisma/client';
import AdminsClient from './AdminsClient';
import { Suspense } from 'react';

async function AdminsContent() {
    await connection(); // Opt out of cache
    const payload = await requireRolePage('ADMIN_MANAGEMENT');

    // Retrieve list of all administrators
    const admins = await prisma.admin.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <AdminsClient 
            admins={admins} 
            currentAdminPhone={payload.phone}
            currentAdminRoles={payload.roles as AdminRole[]}
        />
    );
}

export default function AdminsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری لیست مدیران...</div>}>
            <AdminsContent />
        </Suspense>
    );
}
