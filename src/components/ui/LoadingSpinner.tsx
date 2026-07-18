'use client';

/**
 * Branded Loading Spinner Component
 * Full-screen blur overlay with Ice Center branding
 */
export default function LoadingSpinner() {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-[#FCFEFF]/35"
        >
            <div className="bg-midnight rounded-2xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
                {/* Spinner stacked properly */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    {/* Spinner - thicker border */}
                    <div className="w-12 h-12 border-[7px] border-white border-t-transparent rounded-full animate-spin z-10" />
                    {/* Spinner - ice */}
                    <div className="w-12 h-12 border-[6px] border-ocean rounded-full absolute" />
                </div>
                {/* Brand Name */}
                <span className="text-white font-bold text-md tracking-wide">آیس سنتر</span>
            </div>
        </div>
    );
}

