'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    AlertOctagon, 
    AlertTriangle, 
    Info, 
    Trash2, 
    Search, 
    X, 
    ChevronLeft, 
    Copy,
    Check,
    Terminal,
    Trash,
    CheckSquare,
    Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { toPersianNumber } from '@/utils/persian';
import { deleteErrorLogAction, bulkDeleteErrorLogsAction, clearAllErrorLogsAction } from './actions';

interface ErrorLog {
    id: number;
    message: string;
    stack: string | null;
    path: string | null;
    severity: string;
    createdAt: Date;
}

interface ErrorsViewProps {
    initialLogs: ErrorLog[];
}

const severityConfig: Record<string, { label: string; color: string; cardBg: string; text: string; icon: any }> = {
    CRITICAL: { label: 'بحرانی', color: 'bg-red-50 text-red-700 border-red-150', cardBg: 'bg-red-50/50', text: 'text-red-600', icon: AlertOctagon },
    ERROR: { label: 'خطا', color: 'bg-orange-50 text-orange-700 border-orange-150', cardBg: 'bg-orange-50/50', text: 'text-orange-600', icon: AlertOctagon },
    WARNING: { label: 'هشدار', color: 'bg-yellow-50 text-yellow-700 border-yellow-150', cardBg: 'bg-yellow-50/50', text: 'text-yellow-600', icon: AlertTriangle },
    INFO: { label: 'اطلاعات', color: 'bg-blue-50 text-blue-700 border-blue-150', cardBg: 'bg-blue-50/50', text: 'text-blue-600', icon: Info },
};

export default function ErrorsView({ initialLogs }: ErrorsViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedLogForDetail, setSelectedLogForDetail] = useState<ErrorLog | null>(null);
    const [copied, setCopied] = useState(false);

    // Grouping stats
    const stats = useMemo(() => {
        const total = initialLogs.length;
        const critical = initialLogs.filter(l => l.severity === 'CRITICAL').length;
        const error = initialLogs.filter(l => l.severity === 'ERROR').length;
        const warning = initialLogs.filter(l => l.severity === 'WARNING').length;
        const info = initialLogs.filter(l => l.severity === 'INFO').length;

        return { total, critical, error, warning, info };
    }, [initialLogs]);

    // Handle single row checkbox toggle
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Filter logs list
    const filteredLogs = useMemo(() => {
        return initialLogs.filter(log => {
            const matchesSearch = 
                log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.path && log.path.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (log.stack && log.stack.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesSeverity = 
                selectedSeverity === 'all' || 
                log.severity === selectedSeverity;

            return matchesSearch && matchesSeverity;
        });
    }, [initialLogs, searchTerm, selectedSeverity]);

    // Checkbox select all/deselect all
    const handleSelectAll = () => {
        const filteredIds = filteredLogs.map(l => l.id);
        const allFilteredSelected = filteredIds.every(id => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const newSelection = [...prev];
                filteredIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    const isAllSelected = filteredLogs.length > 0 && filteredLogs.every(l => selectedIds.includes(l.id));
    const isSomeSelected = filteredLogs.length > 0 && filteredLogs.some(l => selectedIds.includes(l.id)) && !isAllSelected;

    // Delete single error log
    const handleDeleteSingle = async (id: number) => {
        if (!confirm('آیا از حذف این لاگ خطا مطمئن هستید؟')) return;

        startTransition(async () => {
            const loadingToast = toast.loading('در حال حذف لاگ...');
            try {
                const res = await deleteErrorLogAction(id);
                if (res.success) {
                    toast.success('لاگ خطا حذف شد.', { id: loadingToast });
                    setSelectedIds(prev => prev.filter(item => item !== id));
                    router.refresh();
                }
            } catch (err: any) {
                toast.error(err.message || 'خطا رخ داد.', { id: loadingToast });
            }
        });
    };

    // Bulk deletion
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`آیا از حذف گروهی ${toPersianNumber(selectedIds.length)} لاگ خطا مطمئن هستید؟`)) return;

        startTransition(async () => {
            const loadingToast = toast.loading('در حال حذف گروهی لاگ‌ها...');
            try {
                const res = await bulkDeleteErrorLogsAction(selectedIds);
                if (res.success) {
                    toast.success('حذف گروهی با موفقیت انجام شد.', { id: loadingToast });
                    setSelectedIds([]);
                    router.refresh();
                }
            } catch (err: any) {
                toast.error(err.message || 'خطا رخ داد.', { id: loadingToast });
            }
        });
    };

    // Clear all error logs
    const handleClearAll = async () => {
        if (!confirm('آیا از پاک کردن تمامی لاگ‌های خطا مطمئن هستید؟ این عمل کل دیتابیس خطاها را تخلیه می‌کند.')) return;

        startTransition(async () => {
            const loadingToast = toast.loading('در حال پاک‌سازی کل لاگ‌ها...');
            try {
                const res = await clearAllErrorLogsAction();
                if (res.success) {
                    toast.success('تمامی لاگ‌ها با موفقیت پاک شدند.', { id: loadingToast });
                    setSelectedIds([]);
                    router.refresh();
                }
            } catch (err: any) {
                toast.error(err.message || 'خطا رخ داد.', { id: loadingToast });
            }
        });
    };

    // Copy stack trace to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('کپی شد!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 p-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Terminal className="w-6 h-6 text-red-500" />
                        مدیریت و مانیتورینگ خطاها
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        رهگیری و مدیریت خطاهای پیش‌آمده در لایه‌های مختلف فروشگاه
                    </p>
                </div>
                {initialLogs.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        disabled={isPending}
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-2xl font-bold text-xs transition-all border border-red-150"
                    >
                        <Trash className="w-4.5 h-4.5" />
                        پاک‌سازی کل خطاها (Clear All)
                    </button>
                )}
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div onClick={() => setSelectedSeverity('all')} className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedSeverity === 'all' ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                    <div className="text-2xl font-extrabold text-gray-900">{toPersianNumber(stats.total)}</div>
                    <div className="text-xs text-gray-400 font-bold mt-1">کل خطاها</div>
                </div>

                <div onClick={() => setSelectedSeverity('CRITICAL')} className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedSeverity === 'CRITICAL' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                    <div className="text-2xl font-extrabold text-red-600">{toPersianNumber(stats.critical)}</div>
                    <div className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                        بحرانی
                    </div>
                </div>

                <div onClick={() => setSelectedSeverity('ERROR')} className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedSeverity === 'ERROR' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                    <div className="text-2xl font-extrabold text-orange-600">{toPersianNumber(stats.error)}</div>
                    <div className="text-xs text-gray-500 font-bold mt-1">خطا سرور/کلاینت</div>
                </div>

                <div onClick={() => setSelectedSeverity('WARNING')} className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedSeverity === 'WARNING' ? 'border-yellow-500 bg-yellow-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                    <div className="text-2xl font-extrabold text-yellow-600">{toPersianNumber(stats.warning)}</div>
                    <div className="text-xs text-gray-500 font-bold mt-1">هشدارها</div>
                </div>

                <div onClick={() => setSelectedSeverity('INFO')} className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedSeverity === 'INFO' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                    <div className="text-2xl font-extrabold text-blue-600">{toPersianNumber(stats.info)}</div>
                    <div className="text-xs text-gray-500 font-bold mt-1">اطلاعات سیستم</div>
                </div>
            </div>

            {/* Filter Search */}
            <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجو در پیام، آدرس یا استک خطا..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-700 text-sm placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <button 
                                        type="button"
                                        onClick={handleSelectAll} 
                                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare className="w-5 h-5 text-blue-600" />
                                        ) : isSomeSelected ? (
                                            <span className="inline-block w-4 h-4 bg-blue-100 border border-blue-500 rounded flex items-center justify-center">
                                                <span className="block w-2 h-0.5 bg-blue-600 rounded" />
                                            </span>
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-4 w-24">شدت</th>
                                <th className="px-4 py-4">آدرس مسیر (Path)</th>
                                <th className="px-4 py-4">پیام خطا</th>
                                <th className="px-4 py-4 w-40">زمان وقوع</th>
                                <th className="px-4 py-4 w-24 text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        هیچ لاگ خطایی یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const isRowSelected = selectedIds.includes(log.id);
                                    const cfg = severityConfig[log.severity] || severityConfig.ERROR;
                                    const SeverityIcon = cfg.icon;
                                    return (
                                        <tr 
                                            key={log.id} 
                                            className={`transition-colors group hover:bg-gray-50/50 ${
                                                isRowSelected ? 'bg-blue-50/20' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectRow(log.id)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                                >
                                                    {isRowSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-300 group-hover:border-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.color}`}>
                                                    <SeverityIcon className="w-3.5 h-3.5" />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[200px] truncate" title={log.path || 'سمت سرور / سراسری'}>
                                                {log.path || '---'}
                                            </td>
                                            <td 
                                                className="px-4 py-3 font-bold text-gray-800 text-xs cursor-pointer hover:text-blue-600 transition-colors max-w-[320px] truncate"
                                                onClick={() => setSelectedLogForDetail(log)}
                                                title="برای مشاهده جزئیات کلیک کنید"
                                            >
                                                {log.message}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs font-medium">
                                                {new Date(log.createdAt).toLocaleDateString('fa-IR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-left">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setSelectedLogForDetail(log)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold transition-all"
                                                    >
                                                        جزئیات
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSingle(log.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="حذف لاگ"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FLOATING ACTION BAR FOR ERROR LOGS */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4"
                    >
                        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md bg-opacity-95">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center bg-blue-500 text-white text-xs font-extrabold w-6 h-6 rounded-full">
                                    {toPersianNumber(selectedIds.length)}
                                </span>
                                <span className="text-sm font-bold text-slate-300">خطای انتخاب شده است</span>
                                <button 
                                    onClick={() => setSelectedIds([])}
                                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="لغو انتخاب"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleBulkDelete}
                                disabled={isPending}
                                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف لاگ‌های انتخاب شده
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ERROR DETAILS MODAL */}
            <AnimatePresence>
                {selectedLogForDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLogForDetail(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] text-right"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-gray-150 mb-4 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-extrabold ${
                                        severityConfig[selectedLogForDetail.severity]?.color || 'bg-red-50 text-red-700'
                                    }`}>
                                        {severityConfig[selectedLogForDetail.severity]?.label || 'خطا'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900">جزئیات کامل لاگ خطا</h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedLogForDetail(null)} 
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">پیام خطا:</div>
                                    <div className="bg-red-50/30 border border-red-100 rounded-2xl p-4 text-sm font-extrabold text-red-700 leading-6 font-mono select-all">
                                        {selectedLogForDetail.message}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">مسیر درخواست (Path):</div>
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 select-all truncate">
                                            {selectedLogForDetail.path || 'سمت سرور / سراسری'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">زمان وقوع خطا:</div>
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-medium text-gray-700">
                                            {new Date(selectedLogForDetail.createdAt).toLocaleString('fa-IR')}
                                        </div>
                                    </div>
                                </div>

                                {selectedLogForDetail.stack && (
                                    <div className="flex flex-col flex-1 min-h-0">
                                        <div className="flex items-center justify-between mb-1 shrink-0">
                                            <div className="text-xs font-bold text-gray-400">ردیابی استک (Stack Trace):</div>
                                            <button
                                                onClick={() => copyToClipboard(selectedLogForDetail.stack || '')}
                                                className="flex items-center gap-1.5 text-[10px] bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors font-bold"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copied ? 'کپی شد!' : 'کپی استک'}
                                            </button>
                                        </div>
                                        <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto overflow-y-auto max-h-[350px] leading-5 text-left select-all shrink-0">
                                            {selectedLogForDetail.stack}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 mt-4 shrink-0">
                                <button
                                    onClick={() => {
                                        const id = selectedLogForDetail.id;
                                        setSelectedLogForDetail(null);
                                        handleDeleteSingle(id);
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-2xl font-bold text-xs transition-colors border border-red-150 flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-4.5 h-4.5" />
                                    حذف این لاگ
                                </button>
                                <button
                                    onClick={() => setSelectedLogForDetail(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold text-xs transition-colors"
                                >
                                    بستن پنجره
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
