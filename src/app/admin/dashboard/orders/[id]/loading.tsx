'use client';

export default function OrderDetailLoading() {
    return (
        <div className="space-y-6 animate-pulse p-4 md:p-6" dir="rtl">
            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-4" />
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-48" />

            {/* Order summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-28 flex flex-col justify-between">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-7 bg-gray-200 rounded w-1/3" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order items table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-32" />
                    <div className="space-y-4 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100">
                                <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-20" />
                                <div className="h-4 bg-gray-200 rounded w-16" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer / shipping info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-24" />
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-20" />
                                <div className="h-4 bg-gray-200 rounded w-28" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-16" />
                                <div className="h-4 bg-gray-200 rounded w-32" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-24" />
                                <div className="h-4 bg-gray-200 rounded w-24" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-28" />
                        <div className="space-y-3 pt-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-20" />
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                </div>
                            ))}
                            <div className="flex justify-between pt-3 border-t border-gray-100">
                                <div className="h-5 bg-gray-200 rounded w-16" />
                                <div className="h-5 bg-gray-200 rounded w-28" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
