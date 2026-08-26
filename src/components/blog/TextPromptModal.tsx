'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface TextPromptModalProps {
    title: string;
    placeholder?: string;
    initialValue?: string;
    confirmText?: string;
    onClose: () => void;
    /** Receives the entered (trimmed) value — may be empty if the user confirmed blank. */
    onSubmit: (value: string) => void;
}

/**
 * Small single-text-input modal used by the blog editor toolbar
 * (image URL / link URL / product slug+name). Replaces native
 * window.prompt so input collection matches the project's RTL modal
 * conventions (same shell as ConfirmDialog).
 *
 * Mount-on-demand: the parent renders this only while a prompt is active,
 * so state initialises fresh per open and no sync-effects are needed.
 */
export default function TextPromptModal({
    title,
    placeholder,
    initialValue = '',
    confirmText = 'تأیید',
    onClose,
    onSubmit,
}: TextPromptModalProps) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useBodyScrollLock(true);

    // Escape closes (never submits)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="text-prompt-title"
            dir="rtl"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scaleUp">
                <div className="flex items-center justify-between">
                    <h3 id="text-prompt-title" className="text-lg font-bold text-gray-800">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = value.trim();
                        onClose();
                        onSubmit(trimmed);
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        dir="ltr"
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-ocean focus:bg-white transition-colors"
                    />

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-ocean hover:bg-royal text-white rounded-xl text-sm font-bold shadow-lg shadow-ocean/20 transition-colors cursor-pointer"
                        >
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
