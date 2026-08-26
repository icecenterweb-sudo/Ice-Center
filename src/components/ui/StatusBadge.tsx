'use client';

import type { ComponentType } from 'react';

/**
 * Shared status badge (DS3 fix).
 * Canonical visual style mirrors the config-object badges previously defined in
 * src/app/admin/dashboard/orders/OrdersClient.tsx:
 *   inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border
 *   bg-{tone}-50 text-{tone}-700 border-{tone}-100
 *
 * Tone classes are written out literally (no string interpolation) so Tailwind's
 * scanner keeps every variant in the build.
 */

export type StatusTone =
    | 'yellow'
    | 'amber'
    | 'cyan'
    | 'emerald'
    | 'indigo'
    | 'blue'
    | 'sky'
    | 'purple'
    | 'violet'
    | 'green'
    | 'rose'
    | 'red'
    | 'orange'
    | 'gray';

const TONE_CLASSES: Record<StatusTone, string> = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
};

interface StatusBadgeProps {
    label: string;
    /** Semantic color key resolved against TONE_CLASSES. Ignored when `className` is provided. */
    tone?: StatusTone;
    /** Full override (escape hatch for legacy one-off styles during migration). */
    className?: string;
    /** Optional lucide icon rendered before the label. */
    icon?: ComponentType<{ className?: string }>;
}

export default function StatusBadge({ label, tone = 'gray', className, icon: Icon }: StatusBadgeProps) {
    const colorClasses = className ?? TONE_CLASSES[tone];

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClasses}`}
        >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}
