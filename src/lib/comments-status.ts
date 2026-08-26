import type { StatusTone } from '@/components/ui/StatusBadge';

export const COMMENT_TONE: Record<string, StatusTone> = {
    APPROVED: 'green',
    PENDING: 'yellow',
    REJECTED: 'red',
};

export const COMMENT_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
    APPROVED: { label: 'تایید شده', tone: 'green' },
    PENDING: { label: 'در انتظار بررسی', tone: 'yellow' },
    REJECTED: { label: 'رد شده', tone: 'red' },
};

export function getCommentStatusLabel(status: string): string {
    switch (status) {
        case 'APPROVED':
            return 'تایید شده';
        case 'PENDING':
            return 'در انتظار بررسی';
        case 'REJECTED':
            return 'رد شده';
        default:
            return status;
    }
}

export function getCommentDisplayName(
    user?: { firstName?: string | null; lastName?: string | null; phone?: string | null } | null,
    authorName?: string | null
): string {
    if (user) {
        const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (full) return full;
    }
    return authorName?.trim() || 'کاربر';
}
