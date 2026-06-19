'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/admin-auth';

export async function deleteErrorLogAction(id: number) {
    await requireAdminAction();
    try {
        await prisma.errorLog.delete({ where: { id } });
        revalidatePath('/admin/dashboard/errors');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete error log:', error);
        throw new Error('خطا در حذف لاگ خطا');
    }
}

export async function bulkDeleteErrorLogsAction(ids: number[]) {
    await requireAdminAction();
    if (!ids || ids.length === 0) {
        throw new Error('هیچ خطایی انتخاب نشده است.');
    }
    try {
        await prisma.errorLog.deleteMany({
            where: { id: { in: ids } }
        });
        revalidatePath('/admin/dashboard/errors');
        return { success: true };
    } catch (error) {
        console.error('Failed to bulk delete error logs:', error);
        throw new Error('خطا در حذف گروهی لاگ‌های خطا');
    }
}

export async function clearAllErrorLogsAction() {
    await requireAdminAction();
    try {
        await prisma.errorLog.deleteMany();
        revalidatePath('/admin/dashboard/errors');
        return { success: true };
    } catch (error) {
        console.error('Failed to clear error logs:', error);
        throw new Error('خطا در پاک کردن تمامی لاگ‌ها');
    }
}
