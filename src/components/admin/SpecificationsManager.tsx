'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface SpecificationsManagerProps {
    initialSpecs?: Record<string, string>;
    onChange: (specs: Record<string, string>) => void;
}

export default function SpecificationsManager({ initialSpecs = {}, onChange }: SpecificationsManagerProps) {
    const [specs, setSpecs] = useState<Record<string, string>>(initialSpecs);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const addSpec = () => {
        if (newKey.trim() && newValue.trim()) {
            const updated = { ...specs, [newKey.trim()]: newValue.trim() };
            setSpecs(updated);
            onChange(updated);
            setNewKey('');
            setNewValue('');
        }
    };

    const removeSpec = (key: string) => {
        const updated = { ...specs };
        delete updated[key];
        setSpecs(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                مشخصات فنی
            </label>

            {/* Specs Table */}
            {Object.keys(specs).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {Object.entries(specs).map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg group hover:bg-blue-50 transition-colors"
                        >
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <span className="text-sm font-medium text-gray-700">{key}</span>
                                <span className="text-sm text-gray-600">{value}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSpec(key)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all text-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Spec */}
            <div className="grid grid-cols-2 gap-2">
                <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="عنوان (مثلاً: قدرت موتور)"
                    className="px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-800"
                />
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())}
                        placeholder="مقدار (مثلاً: 1 اسب بخار)"
                        className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-800"
                    />
                    <button
                        type="button"
                        onClick={addSpec}
                        disabled={!newKey.trim() || !newValue.trim()}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <p className="text-xs text-gray-500">
                🔧 مشخصات فنی محصول مانند قدرت، ابعاد، ولتاژ، ظرفیت و...
            </p>

            {/* Hidden input to submit specs with form */}
            <input
                type="hidden"
                name="specifications"
                value={JSON.stringify(specs)}
            />
        </div>
    );
}
