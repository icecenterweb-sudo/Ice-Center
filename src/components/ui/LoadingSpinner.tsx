'use client';

/**
 * Branded Loading Spinner Component
 * Full-screen blur overlay with Ice Center branding
 */
export default function LoadingSpinner() {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(252, 254, 255, 0.35)' }}
        >
            <div className="bg-[#1E549F] rounded-2xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
                {/* Spinner - thicker border */}
                <div className="w-12 h-12 border-[7px] border-white border-t-transparent rounded-full animate-spin z-10" />
                {/* Spinner - ice */}
                <div className="w-12 h-12 border-[6px] border-[#2E79BA] rounded-full absolute text-white text-xl flex items-center justify-center" />
                {/* Brand Name */}
                <span className="text-white font-bold text-md tracking-wide">آیس سنتر</span>
            </div>
        </div>
    );
}

