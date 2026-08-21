'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    /** Whether the dialog is visible */
    open: boolean;
    /** Bold heading shown next to the icon */
    title: string;
    /** Body text / node describing the consequence of confirming */
    message: ReactNode;
    /** Label for the confirm button (defaults to «تأیید») */
    confirmText?: string;
    /** Label for the cancel button (defaults to «انصراف») */
    cancelText?: string;
    /** When true, both buttons are disabled and the confirm button shows a busy label */
    isPending?: boolean;
    /** Colour scheme — «danger» (red, default) for destructive actions, «primary» (ocean) otherwise */
    variant?: 'danger' | 'primary';
    /** Called when the user confirms */
    onConfirm: () => void;
    /** Called when the user cancels (button, overlay click, or Escape) */
    onClose: () => void;
}

/**
 * Reusable styled confirmation dialog for the admin dashboard.
 * Replaces native window.confirm() so admins get a consistent, RTL,
 * on-brand modal instead of a browser popup. Presentation-only:
 * the caller owns the async work and passes `isPending` for busy state.
 */
export default function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'تأیید',
    cancelText = 'انصراف',
    isPending = false,
    variant = 'danger',
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    // Close on Escape — but never while an action is mid-flight.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, isPending, onClose]);

    if (!open) return null;

    const confirmClasses =
        variant === 'danger'
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
            : 'bg-ocean hover:bg-royal shadow-ocean/20';
    const iconClasses =
        variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-frost text-ocean';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
            dir="rtl"
            onClick={(e) => {
                // Only dismiss when the backdrop itself is clicked, not the card.
                if (e.target === e.currentTarget && !isPending) onClose();
            }}
        >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scaleUp">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClasses}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-sm text-gray-600 leading-relaxed">{message}</div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ${confirmClasses}`}
                    >
                        {isPending ? 'در حال انجام...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
