'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Specification {
    label: string;
    value: string;
}

interface SpecCategory {
    title: string;
    specs: Specification[];
}

interface ProductSpecificationsProps {
    categories: SpecCategory[];
}

export default function ProductSpecifications({ categories }: ProductSpecificationsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldCollapse = categories.length > 2; // Only collapse if there are many categories

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 border-r-4 border-red-500 pr-3">مشخصات فنی</h2>
                {shouldCollapse && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-cyan-600 text-sm font-medium flex items-center gap-1 hover:text-cyan-700 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <span>کمتر</span>
                                <ChevronUp className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                <span>مشاهده کامل</span>
                                <ChevronDown className="w-4 h-4" />
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className={`px-6 py-6 space-y-8 transition-all duration-500 ease-in-out ${!isExpanded && shouldCollapse ? 'max-h-[500px] overflow-hidden relative' : ''}`}>

                {categories.map((category, catIndex) => (
                    <div key={catIndex}>
                        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                            <span>{category.title}</span>
                        </h3>

                        <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
                            {category.specs.map((spec, specIndex) => (
                                <div
                                    key={specIndex}
                                    className="flex flex-col md:flex-row group hover:bg-gray-50 transition-colors"
                                >
                                    <div className="md:w-1/4 p-3 md:py-4 md:px-5 text-gray-500 font-medium text-sm flex items-center bg-gray-50/30 group-hover:bg-gray-50/50">
                                        {spec.label}
                                    </div>
                                    <div className="md:w-3/4 p-3 md:py-4 md:px-5 text-gray-800 font-medium text-sm leading-relaxed">
                                        {spec.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Gradient Fade if collapsed */}
                {!isExpanded && shouldCollapse && (
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-4">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full shadow-sm text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            مشاهده تمام مشخصات
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
