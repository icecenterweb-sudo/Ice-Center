'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    color?: 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'yellow';
    index?: number;
}

const colorMap = {
    blue: { bg: 'from-ocean to-royal', shadow: 'shadow-ocean/30', light: 'bg-frost text-ocean' },
    purple: { bg: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', light: 'bg-purple-50 text-purple-600' },
    cyan: { bg: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/30', light: 'bg-cyan-50 text-cyan-600' },
    orange: { bg: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/30', light: 'bg-orange-50 text-orange-600' },
    green: { bg: 'from-green-500 to-green-600', shadow: 'shadow-green-500/30', light: 'bg-green-50 text-green-600' },
    yellow: { bg: 'from-yellow-500 to-yellow-600', shadow: 'shadow-yellow-500/30', light: 'bg-yellow-50 text-yellow-600' },
};

export default function StatsCard({
    icon: Icon,
    title,
    value,
    trend,
    trendUp,
    color = 'blue',
    index = 0
}: StatsCardProps) {
    const styles = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group min-h-[140px]"
        >
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${styles.bg} opacity-5 -mr-10 -mt-10 rounded-full group-hover:scale-150 transition-transform duration-500`} />

            <div className="relative flex items-start justify-between gap-3">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight mb-3">{value}</h3>

                    {trend && (
                        <div className={`flex flex-wrap items-center gap-1 text-xs font-bold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                            <span className={`px-2 py-1 rounded-full ${trendUp ? 'bg-green-100' : 'bg-red-100'}`}>
                                {trendUp ? '↑' : '↓'} {trend}
                            </span>
                            <span className="text-gray-500 font-normal text-[10px]">نسبت به ماه قبل</span>
                        </div>
                    )}
                </div>

                <div className={`p-3 rounded-xl bg-gradient-to-br ${styles.bg} ${styles.shadow} shadow-lg text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </motion.div>
    );
}
