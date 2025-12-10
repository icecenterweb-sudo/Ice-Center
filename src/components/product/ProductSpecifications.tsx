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
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900">مشخصات فنی</h2>
            </div>

            <div className="divide-y divide-gray-100">
                {categories.map((category, catIndex) => (
                    <div key={catIndex} className="px-6 py-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            {category.title}
                        </h3>

                        <div className="space-y-3">
                            {category.specs.map((spec, specIndex) => (
                                <div
                                    key={specIndex}
                                    className="grid grid-cols-2 gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded px-3"
                                >
                                    <div className="text-gray-600 font-medium">{spec.label}</div>
                                    <div className="text-gray-900 font-semibold">{spec.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
