'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireRoleAction } from '@/lib/admin-auth';
import { AdminRole } from '@prisma/client';
import { recordAudit } from '@/lib/audit';
import { z } from 'zod';

const promoteSchema = z.object({
    phone: z.string().regex(/^(0?9\d{9})$/, 'شماره موبایل معتبر نیست'),
    roles: z.array(z.nativeEnum(AdminRole)).min(1, 'حداقل یک نقش باید انتخاب شود'),
});

export async function updateAdminRolesAction(adminId: number, roles: AdminRole[]) {
    try {
        const adminPayload = await requireRoleAction('ADMIN_MANAGEMENT');

        // Prevent non-SUPER_ADMIN from creating SUPER_ADMIN
        if (roles.includes('SUPER_ADMIN') && !adminPayload.roles.includes('SUPER_ADMIN')) {
            throw new Error('فقط سوپر ادمین می‌تواند نقش سوپر ادمین اختصاص دهد.');
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

export async function promoteUserToAdminAction(formData: FormData) {
    try {
        const adminPayload = await requireRoleAction('ADMIN_MANAGEMENT');

        const raw = {
            phone: (formData.get('phone') as string || '').trim(),
            roles: JSON.parse(formData.get('roles') as string || '[]'),
        };

        // Normalize phone: strip +98, ensure 0 prefix
        let phone = raw.phone.replace(/\s/g, '');
        if (phone.startsWith('+98')) phone = '0' + phone.slice(3);
        else if (phone.startsWith('98') && phone.length === 12) phone = '0' + phone.slice(2);
        raw.phone = phone;

        const result = promoteSchema.safeParse(raw);
        if (!result.success) {
            throw new Error(result.error.issues[0].message);
        }

        const { roles } = result.data;
        const normalizedPhone = result.data.phone.startsWith('0')
            ? result.data.phone
            : '0' + result.data.phone;

        // Prevent non-SUPER_ADMIN from assigning SUPER_ADMIN
        if (roles.includes('SUPER_ADMIN') && !adminPayload.roles.includes('SUPER_ADMIN')) {
            throw new Error('فقط سوپر ادمین می‌تواند نقش سوپر ادمین اختصاص دهد.');
        }

        // Find the user by phone
        const user = await prisma.user.findUnique({
            where: { phone: normalizedPhone },
            select: { id: true, phone: true, firstName: true, lastName: true },
        });

        if (!user) {
            throw new Error('کاربری با این شماره یافت نشد. کاربر ابتدا باید در سایت ثبت‌نام کند.');
        }

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { phone: normalizedPhone },
        });

        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

        if (existingAdmin) {
            // Update existing admin
            await prisma.admin.update({
                where: { phone: normalizedPhone },
                data: { roles, status: 'ACTIVE' },
            });
            await recordAudit(
                adminPayload.adminId,
                'ADMIN_PROMOTE',
                'Admin',
                existingAdmin.id,
                `ارتقای کاربر ${normalizedPhone} به ادمین با نقش‌ها: [${roles.join(', ')}]`
            );
        } else {
            // Create new admin from user
            await prisma.admin.create({
                data: {
                    phone: normalizedPhone,
                    name,
                    roles,
                    status: 'ACTIVE',
                },
            });
            await recordAudit(
                adminPayload.adminId,
                'ADMIN_PROMOTE',
                'Admin',
                user.id,
                `ایجاد ادمین جدید از کاربر ${normalizedPhone} با نقش‌ها: [${roles.join(', ')}]`
            );
        }

        revalidatePath('/admin/dashboard/admins');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to promote user:', error);
        return { error: error instanceof Error ? error.message : 'خطا در ارتقای کاربر' };
    }
}

export async function searchUsersAction(query: string) {
    try {
        await requireRoleAction('ADMIN_MANAGEMENT');

        if (!query || query.trim().length < 3) {
            return { users: [] };
        }

        const trimmed = query.trim();
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { phone: { contains: trimmed } },
                    { firstName: { contains: trimmed } },
                    { lastName: { contains: trimmed } },
                ],
            },
            select: {
                id: true,
                phone: true,
                firstName: true,
                lastName: true,
            },
            take: 10,
        });

        // Check which users are already admins
        const phones = users.map(u => u.phone);
        const existingAdmins = await prisma.admin.findMany({
            where: { phone: { in: phones } },
            select: { phone: true },
        });
        const adminPhones = new Set(existingAdmins.map(a => a.phone));

        return {
            users: users.map(u => ({
                ...u,
                isAdmin: adminPhones.has(u.phone),
            })),
        };
    } catch (error: unknown) {
        console.error('Failed to search users:', error);
        return { error: 'خطا در جستجوی کاربران' };
    }
}

