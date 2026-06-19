import { prisma } from '@/lib/db';

export async function logSystemError(
    error: Error | string | unknown, 
    path?: string, 
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'ERROR'
) {
    try {
        let message = 'خطای ناشناخته';
        let stack: string | null = null;

        if (error instanceof Error) {
            message = error.message;
            stack = error.stack || null;
        } else if (typeof error === 'string') {
            message = error;
        } else if (error && typeof error === 'object') {
            message = JSON.stringify(error);
        }

        await prisma.errorLog.create({
            data: {
                message,
                stack,
                path: path || null,
                severity,
            }
        });
    } catch (err) {
        console.error('Failed to write system error to database:', err);
    }
}
