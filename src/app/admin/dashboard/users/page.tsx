import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import UsersContentClient from './UsersContentClient';

async function getUsers() {
    await connection(); // Opt out of caching
    return prisma.user.findMany({
        include: {
            _count: {
                select: {
                    cartItems: true,
                    addresses: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function UsersContent() {
    await requireRolePage('USERS');
    const users = await getUsers();
    return <UsersContentClient initialUsers={users} />;
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری کاربران...</div>}>
            <UsersContent />
        </Suspense>
    );
}
