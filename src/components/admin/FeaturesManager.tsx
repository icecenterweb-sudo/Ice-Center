'use client';

import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface FeaturesManagerProps {
    initialFeatures?: string[];
    onChange: (features: string[]) => void;
}

export default function FeaturesManager({ initialFeatures = [], onChange }: FeaturesManagerProps) {
    const [features, setFeatures] = useState<string[]>(initialFeatures);
    const [newFeature, setNewFeature] = useState('');

    const addFeature = () => {
        if (newFeature.trim() && !features.includes(newFeature.trim())) {
            const updated = [...features, newFeature.trim()];
            setFeatures(updated);
            onChange(updated);
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        const updated = features.filter((_, i) => i !== index);
        setFeatures(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                ویژگی‌های محصول
            </label>

            {/* Feature List */}
            {features.length > 0 && (
                <div className="space-y-2">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl group hover:bg-green-100 transition-colors"
                        >
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="flex-1 text-sm text-gray-700">{feature}</span>
                            <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all text-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Feature */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="مثال: گارانتی 18 ماهه"
                    className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white transition-all outline-none text-gray-800"
                />
                <button
                    type="button"
                    onClick={addFeature}
                    disabled={!newFeature.trim()}
                    className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    افزودن
                </button>
            </div>

            <p className="text-xs text-gray-500">
                💡 ویژگی‌های کلیدی محصول را وارد کنید (مثل گارانتی، کیفیت، قدرت و...)
            </p>

            {/* Hidden input to submit features with form */}
            <input
                type="hidden"
                name="features"
                value={JSON.stringify(features)}
            />
        </div>
    );
}
