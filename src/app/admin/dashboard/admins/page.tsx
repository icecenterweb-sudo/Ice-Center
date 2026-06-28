import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/jwt';
import { redirect } from 'next/navigation';
import { AdminRole } from '@prisma/client';
import AdminsClient from './AdminsClient';
import { Suspense } from 'react';

async function AdminsContent() {
    await connection(); // Opt out of cache

    // Extract current authenticated admin's details
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
        redirect('/admin/login');
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
        redirect('/admin/login');
    }

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
