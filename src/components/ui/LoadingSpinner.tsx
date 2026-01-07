'use client';

/**
 * Branded Loading Spinner Component
 * Full-screen blur overlay with Ice Center branding
 */
export default function LoadingSpinner() {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(252, 254, 255, 0.85)' }}
        >
            <div className="bg-[#5FC9F3] rounded-2xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
                {/* Spinner */}
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                {/* Brand Name */}
                <span className="text-white font-bold text-sm tracking-wide">آیس سنتر</span>
            </div>
        </div>
    );
}
