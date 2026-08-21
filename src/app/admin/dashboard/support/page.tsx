import { Metadata } from 'next';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';
import SupportClient from './SupportClient';
import { connection } from 'next/server';

export const metadata: Metadata = {
    title: 'پشتیبانی آنلاین | پنل مدیریت آیس سنتر',
    description: 'مدیریت تیکت‌ها و پیام‌های پشتیبانی آنلاین کاربران',
};

async function SupportContent() {
    await connection();
    await requireRolePage('SUPPORT');
    return <SupportClient />;
}

export default function AdminSupportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری پشتیبانی...</div>}>
            <SupportContent />
        </Suspense>
    );
}
