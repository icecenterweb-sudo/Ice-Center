'use client';

import Link from 'next/link';
import { Image } from 'lucide-react';

export default function AppearancePage() {
    const sections = [
        {
            title: 'بنرهای هیرو (بالای صفحه)',
            description: 'مدیریت ۳ بنر بالای صفحه اصلی (بنر عریض راست + ۲ بنر مربع وسط و چپ)',
            href: '/admin/dashboard/appearance/slides',
            icon: Image,
            color: 'bg-blue-500',
        },
        {
            title: 'بنرهای ایستاده (تبلیغاتی)',
            description: 'مدیریت ۴ بنر عمودی تبلیغاتی وسط صفحه اصلی',
            href: '/admin/dashboard/appearance/banners',
            icon: Image,
            color: 'bg-green-500',
        },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">ظاهر سایت</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                        <div className={`w-12 h-12 ${section.color} rounded-xl flex items-center justify-center mb-4`}>
                            <section.icon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">{section.title}</h2>
                        <p className="text-sm text-gray-500">{section.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
