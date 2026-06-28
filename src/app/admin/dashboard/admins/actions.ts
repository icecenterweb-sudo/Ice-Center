'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdminAction, hasAdminRole } from '@/lib/admin-auth';
import { AdminRole } from '@prisma/client';
import { recordAudit } from '@/lib/audit';

export async function updateAdminRolesAction(adminId: number, roles: AdminRole[]) {
    try {
        const adminPayload = await requireAdminAction();
        
        // Security check: Only SUPER_ADMIN or GENERAL_MANAGER can manage roles
        if (!hasAdminRole(adminPayload, ['SUPER_ADMIN', 'GENERAL_MANAGER'])) {
            throw new Error('دسترسی غیرمجاز. فقط مدیران ارشد مجاز به تغییر نقش‌ها هستند.');
        }

        // Retrieve admin first
        const adminToUpdate = await prisma.admin.findUnique({
            where: { id: adminId },
            select: { id: true, name: true, phone: true }
        });

        if (!adminToUpdate) {
            throw new Error('مدیر مورد نظر یافت نشد.');
        }

        // Update database roles array
        await prisma.admin.update({
            where: { id: adminId },
            data: { roles }
        });

        // Log the change in system audits
        await recordAudit(
            adminPayload.adminId,
            'ADMIN_UPDATE',
            'Admin',
            adminId,
            `تغییر نقش‌های مدیر ${adminToUpdate.name || adminToUpdate.phone} به: [${roles.join(', ')}]`
        );

        revalidatePath('/admin/dashboard/admins');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update admin roles:', error);
        return { error: error instanceof Error ? error.message : 'خطا در به‌روزرسانی نقش‌ها' };
    }
}
