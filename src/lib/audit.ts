import { prisma } from '@/lib/db'

export async function recordAudit(
    adminId: number,
    action: string,
    entity: string,
    entityId: number,
    details?: string | null
) {
    try {
        const auditLogClient = prisma.auditLog;
        if (!auditLogClient) {
            console.warn('[AuditLog] Prisma client has not been regenerated with AuditLog model.');
            return;
        }

        await auditLogClient.create({
            data: {
                action,
                entity,
                entityId,
                details: details || null,
                adminId,
            },
        });
    } catch (error) {
        console.error('[AuditLog] Failed to record audit log:', error);
    }
}
