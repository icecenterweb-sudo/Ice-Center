/**
 * Single source of truth for OrderStatus labels/colors/icons (DS4 fix).
 *
 * Before this file existed, the same enum was mapped independently in 5 files
 * with conflicting colors (PAID: emerald vs blue; PROCESSING: indigo vs purple;
 * SHIPPED: purple vs indigo). Every consumer must render order status through
 * ORDER_STATUS_META + <StatusBadge /> so one status = one color everywhere.
 *
 * Icons come from lucide-react; tones are keys of StatusBadge's TONE map and
 * are visually distinct across the full set of 12 statuses.
 */

import type { OrderStatus } from '@prisma/client';
import type { LucideIcon } from 'lucide-react';
import {
    Clock,
    Hourglass,
    BadgeCheck,
    Package,
    Boxes,
    PackageOpen,
    Truck,
    Warehouse,
    CheckCircle,
    RotateCcw,
    XCircle,
    Phone,
} from 'lucide-react';
import type { StatusTone } from '@/components/ui/StatusBadge';

export interface OrderStatusMeta {
    label: string;
    tone: StatusTone;
    icon: LucideIcon;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
    PENDING: { label: 'در انتظار پرداخت', tone: 'yellow', icon: Clock },
    AWAITING_CONFIRMATION: { label: 'در انتظار تأیید', tone: 'cyan', icon: Hourglass },
    PAID: { label: 'پرداخت شده', tone: 'emerald', icon: BadgeCheck },
    PROCESSING: { label: 'در حال پردازش', tone: 'indigo', icon: Package },
    PREPARING: { label: 'آماده‌سازی', tone: 'blue', icon: Boxes },
    READY_FOR_DELIVERY: { label: 'آماده تحویل', tone: 'sky', icon: PackageOpen },
    SHIPPED: { label: 'ارسال شده', tone: 'purple', icon: Truck },
    HANDED_TO_CARRIER: { label: 'تحویل به باربری', tone: 'violet', icon: Warehouse },
    DELIVERED: { label: 'تحویل شده', tone: 'green', icon: CheckCircle },
    RETURNED: { label: 'برگشت خورده', tone: 'rose', icon: RotateCcw },
    CANCELLED: { label: 'لغو شده', tone: 'red', icon: XCircle },
    NEEDS_CONTACT: { label: 'نیازمند تماس', tone: 'orange', icon: Phone },
};

/** Safe lookup for statuses stored as free strings (e.g. JSON payloads). */
export function getOrderStatusMeta(status: string): OrderStatusMeta {
    return ORDER_STATUS_META[status as OrderStatus] ?? ORDER_STATUS_META.PENDING;
}
