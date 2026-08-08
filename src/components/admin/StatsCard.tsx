'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    subtitle?: string;
    color?: 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'yellow';
    index?: number;
}

const colorMap = {
    blue: { bg: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20', light: 'bg-blue-50 text-blue-700 border-blue-100' },
    purple: { bg: 'from-purple-600 to-indigo-600', shadow: 'shadow-purple-500/20', light: 'bg-purple-50 text-purple-700 border-purple-100' },
    cyan: { bg: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/20', light: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    orange: { bg: 'from-amber-500 to-orange-600', shadow: 'shadow-orange-500/20', light: 'bg-orange-50 text-orange-700 border-orange-100' },
    green: { bg: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20', light: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    yellow: { bg: 'from-amber-500 to-yellow-600', shadow: 'shadow-amber-500/20', light: 'bg-amber-50 text-amber-700 border-amber-100' },
};

export default function StatsCard({
    icon: Icon,
    title,
    value,
    trend,
    trendUp,
    subtitle,
    color = 'blue',
    index = 0
}: StatsCardProps) {
    const styles = colorMap[color];

    // Check if trend is a numeric growth percentage (e.g. "+12%" or "15%")
    const isPercentage = trend && (trend.includes('%') || trend.includes('٪'));

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group min-h-[135px] flex flex-col justify-between"
        >
            {/* Background Watermark Accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${styles.bg} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none`} />

            <div className="relative flex items-start justify-between gap-3">
                <div className="flex-1 text-right">
                    <p className="text-xs font-bold text-gray-500 mb-1.5">{title}</p>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</h3>
                </div>

                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${styles.bg} ${styles.shadow} shadow-md text-white group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            {/* Footer / Status Badge / Growth Trend */}
            {trend && (
                <div className="relative mt-3 pt-2 border-t border-gray-100/80 flex items-center justify-between gap-1.5 text-xs overflow-hidden">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] md:text-[11px] whitespace-nowrap shrink-0 border ${
                        isPercentage
                            ? (trendUp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200')
                            : styles.light
                    }`}>
                        {isPercentage && (
                            <span>{trendUp ? '↑' : '↓'}</span>
                        )}
                        {!isPercentage && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 animate-pulse shrink-0" />
                        )}
                        <span>{trend}</span>
                    </span>

                    {subtitle ? (
                        <span className="text-gray-400 font-medium text-[10px] md:text-[11px] truncate whitespace-nowrap min-w-0">{subtitle}</span>
                    ) : isPercentage ? (
                        <span className="text-gray-400 font-medium text-[10px] md:text-[11px] whitespace-nowrap shrink-0">نسبت به ماه قبل</span>
                    ) : null}
                </div>
            )}
        </motion.div>
    );
}
