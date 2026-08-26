'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    User,
    Phone,
    Calendar,
    Edit,
    Check,
    X,
    Lock,
    ShieldAlert,
    CheckSquare,
    Square,
    UserPlus,
    Search,
    Loader2,
} from 'lucide-react';
import { AdminRole } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateAdminRolesAction, promoteUserToAdminAction, searchUsersAction } from './actions';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusTone } from '@/components/ui/StatusBadge';

/** Role → badge tone (DS3). Colors stay distinct across the 7 roles. */
const ROLE_TONE: Record<AdminRole, StatusTone> = {
    SUPER_ADMIN: 'red',
    GENERAL_MANAGER: 'purple',
    BLOG_WRITER: 'emerald',
    SUPPORT_ADMIN: 'blue',
    INVENTORY_MANAGER: 'amber',
    ADMIN: 'gray',
    EDITOR: 'cyan',
};

interface AdminUser {
    id: number;
    phone: string;
    name: string | null;
    roles: AdminRole[];
    status: string;
    createdAt: Date;
}

interface AdminsClientProps {
    admins: AdminUser[];
    currentAdminPhone: string;
    currentAdminRoles: AdminRole[];
}

const roleConfigs: Record<AdminRole, { label: string; bg: string; text: string; desc: string }> = {
    SUPER_ADMIN: { label: 'سوپر ادمین', bg: 'bg-red-50 text-red-700 border-red-150', text: 'text-red-700', desc: 'دسترسی کامل و تام به تمامی منابع و تنظیمات سیستم' },
    GENERAL_MANAGER: { label: 'مدیر کل', bg: 'bg-purple-50 text-purple-700 border-purple-150', text: 'text-purple-700', desc: 'مدیریت کل سیستم، فروشگاه، گزارشات و تخصیص نقش‌ها' },
    BLOG_WRITER: { label: 'نویسنده وبلاگ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-150', text: 'text-emerald-700', desc: 'تولید محتوا، ویرایش مقالات مجله خبری و مدیریت دسته‌بندی‌های بلاگ' },
    SUPPORT_ADMIN: { label: 'ادمین پشتیبانی', bg: 'bg-blue-50 text-blue-700 border-blue-150', text: 'text-blue-700', desc: 'پاسخ‌گویی به چت‌های پشتیبانی آنلاین مشتریان' },
    INVENTORY_MANAGER: { label: 'انباردار', bg: 'bg-amber-50 text-amber-700 border-amber-150', text: 'text-amber-700', desc: 'ویرایش موجودی انبار محصولات و بررسی سفارشات ارسالی' },
    ADMIN: { label: 'مدیر معمولی', bg: 'bg-gray-50 text-gray-700 border-gray-150', text: 'text-gray-700', desc: 'مدیر عمومی سیستم با دسترسی‌های استاندارد' },
    EDITOR: { label: 'ویرایشگر', bg: 'bg-cyan-50 text-cyan-700 border-cyan-150', text: 'text-cyan-700', desc: 'ویرایش و به‌روزرسانی مشخصات و قیمت‌های کالاها' },
};

export default function AdminsClient({ admins, currentAdminPhone, currentAdminRoles }: AdminsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [tempRoles, setTempRoles] = useState<AdminRole[]>([]);

    // Promote user state
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; phone: string; firstName: string | null; lastName: string | null; isAdmin: boolean }>>([]);
    const [searching, setSearching] = useState(false);
    const [selectedPhone, setSelectedPhone] = useState('');
    const [promoteRoles, setPromoteRoles] = useState<AdminRole[]>(['ADMIN']);
    const [promoting, setPromoting] = useState(false);

    // Check if current user is SUPER_ADMIN or GENERAL_MANAGER
    const canManageRoles = currentAdminRoles.includes('SUPER_ADMIN') || currentAdminRoles.includes('GENERAL_MANAGER');

    const handleOpenEditModal = (admin: AdminUser) => {
        if (!canManageRoles) {
            toast.error('فقط سوپر ادمین یا مدیر کل مجاز به تغییر نقش‌ها هستند.');
            return;
        }
        setEditingAdmin(admin);
        setTempRoles([...admin.roles]);
    };

    const handleToggleRole = (role: AdminRole) => {
        setTempRoles(prev => 
            prev.includes(role) 
                ? prev.filter(r => r !== role) 
                : [...prev, role]
        );
    };

    const handleSaveRoles = async () => {
        if (!editingAdmin) return;

        if (tempRoles.length === 0) {
            toast.error('مدیر باید حداقل دارای یک نقش فعال باشد.');
            return;
        }

        // Prevent self role modification if locking out super admin status
        if (editingAdmin.phone === currentAdminPhone && editingAdmin.roles.includes('SUPER_ADMIN') && !tempRoles.includes('SUPER_ADMIN')) {
            toast.error('شما نمی‌توانید نقش سوپر ادمین را از خود سلب کنید.');
            return;
        }

        startTransition(async () => {
            const loadingToast = toast.loading('در حال به‌روزرسانی نقش‌های مدیر...');
            const res = await updateAdminRolesAction(editingAdmin.id, tempRoles);

            if (res.success) {
                toast.success('نقش‌ها با موفقیت به‌روزرسانی شدند.', { id: loadingToast });
                setEditingAdmin(null);
                router.refresh();
            } else {
                toast.error(res.error || 'خطایی رخ داد. لطفاً دوباره تلاش کنید', { id: loadingToast });
            }
        });
    };

    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length < 3) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await searchUsersAction(query);
            if (res.users) {
                setSearchResults(res.users);
            }
        } catch {
            toast.error('خطا در جستجو');
        } finally {
            setSearching(false);
        }
    };

    const handlePromote = async () => {
        if (!selectedPhone) {
            toast.error('یک کاربر انتخاب کنید');
            return;
        }
        if (promoteRoles.length === 0) {
            toast.error('حداقل یک نقش انتخاب کنید');
            return;
        }

        setPromoting(true);
        try {
            const formData = new FormData();
            formData.set('phone', selectedPhone);
            formData.set('roles', JSON.stringify(promoteRoles));
            const res = await promoteUserToAdminAction(formData);

            if (res.success) {
                toast.success('کاربر با موفقیت به ادمین ارتقا یافت');
                setShowPromoteModal(false);
                setSelectedPhone('');
                setSearchQuery('');
                setSearchResults([]);
                setPromoteRoles(['ADMIN']);
                router.refresh();
            } else {
                toast.error(res.error || 'خطا در ارتقای کاربر');
            }
        } catch {
            toast.error('خطا در ارتباط با سرور');
        } finally {
            setPromoting(false);
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        دسترسی‌های چند سطحی (مدیران پلتفرم)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        مدیریت حساب کاربری و تخصیص نقش‌های متفاوت به تیم اجرایی فروشگاه
                    </p>
                </div>
                {canManageRoles && (
                    <button
                        onClick={() => setShowPromoteModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
                    >
                        <UserPlus className="w-5 h-5" />
                        افزودن ادمین از کاربران
                    </button>
                )}
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">مدیر پلتفرم</th>
                                <th className="px-6 py-4">شماره همراه</th>
                                <th className="px-6 py-4">نقش‌های تخصیص‌یافته</th>
                                <th className="px-6 py-4">تاریخ ثبت‌نام</th>
                                <th className="px-6 py-4">وضعیت</th>
                                <th className="px-6 py-4 text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {admins.map((admin) => {
                                const isSelf = admin.phone === currentAdminPhone;
                                return (
                                    <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">
                                                        {admin.name || 'مدیر بدون نام'}
                                                        {isSelf && (
                                                            <span className="mr-2 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
                                                                خود شما
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">شناسه ادمین: {admin.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                {admin.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                                                {admin.roles.map((role) => (
                                                    <StatusBadge
                                                        key={role}
                                                        label={roleConfigs[role]?.label || role}
                                                        tone={ROLE_TONE[role] ?? 'gray'}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(admin.createdAt).toLocaleDateString('fa-IR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                admin.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                                {admin.status === 'ACTIVE' ? 'فعال' : 'مسدود'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            {canManageRoles ? (
                                                <button
                                                    onClick={() => handleOpenEditModal(admin)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold transition-all text-xs cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    تغییر نقش‌ها
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 flex items-center gap-1 justify-end font-semibold">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    فقط خواندنی
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT ROLES MODAL */}
            <AnimatePresence>
                {editingAdmin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingAdmin(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] text-right"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-bold text-gray-900">
                                        تنظیم دسترسی‌های {editingAdmin.name || editingAdmin.phone}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setEditingAdmin(null)} 
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content - Roles Checklist */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pl-1">
                                <p className="text-xs text-gray-500 mb-4 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 leading-6">
                                    هر کاربر مدیر می‌تواند همزمان چند نقش داشته باشد. سیستم دسترسی‌ها بر اساس مجموع حقوق و دسترسی‌های تخصیص‌یافته به تمام این نقش‌ها عمل خواهد کرد.
                                </p>
                                
                                {Object.entries(roleConfigs).map(([key, config]) => {
                                    const role = key as AdminRole;
                                    const isChecked = tempRoles.includes(role);
                                    return (
                                        <div 
                                            key={role}
                                            onClick={() => handleToggleRole(role)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                                isChecked 
                                                    ? 'border-blue-500 bg-blue-50/30 shadow-sm'
                                                    : 'border-gray-150 hover:border-blue-200 bg-white'
                                            }`}
                                        >
                                            <div className="mt-0.5">
                                                {isChecked ? (
                                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-extrabold text-sm text-gray-800">{config.label}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.bg}`}>
                                                        {role}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 leading-5">
                                                    {config.desc}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSaveRoles}
                                    disabled={isPending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-2xl font-bold transition-all shadow-md shadow-blue-500/10 text-sm flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    ذخیره تغییرات
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingAdmin(null)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition-colors text-sm"
                                >
                                    انصراف
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PROMOTE USER MODAL */}
            <AnimatePresence>
                {showPromoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPromoteModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] text-right"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-bold text-gray-900">
                                        افزودن ادمین جدید از کاربران
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowPromoteModal(false)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Section */}
                            <div className="shrink-0 mb-4">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                        placeholder="جستجو با شماره موبایل یا نام..."
                                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        autoFocus
                                    />
                                    {searching && (
                                        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                                    )}
                                </div>
                            </div>

                            {/* Search Results */}
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[120px]">
                                {searchResults.length === 0 && searchQuery.trim().length >= 3 && !searching ? (
                                    <p className="text-center text-sm text-gray-400 py-8">کاربری یافت نشد</p>
                                ) : searchResults.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8">حداقل ۳ کاراکتر برای جستجو وارد کنید</p>
                                ) : (
                                    searchResults.map((u) => (
                                        <div
                                            key={u.id}
                                            onClick={() => !u.isAdmin && setSelectedPhone(u.phone)}
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                                                u.isAdmin
                                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : selectedPhone === u.phone
                                                    ? 'border-blue-500 bg-blue-50/30 cursor-pointer'
                                                    : 'border-gray-150 hover:border-blue-200 cursor-pointer'
                                            }`}
                                        >
                                            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800">
                                                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'بدون نام'}
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono">{u.phone}</p>
                                            </div>
                                            {u.isAdmin ? (
                                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold">ادمین</span>
                                            ) : selectedPhone === u.phone ? (
                                                <Check className="w-5 h-5 text-blue-600" />
                                            ) : null}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Role Selection */}
                            {selectedPhone && (
                                <div className="shrink-0 border-t border-gray-100 pt-4 mb-4">
                                    <p className="text-xs font-bold text-gray-600 mb-2">انتخاب نقش‌ها:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(roleConfigs).map(([key, config]) => {
                                            const role = key as AdminRole;
                                            const isChecked = promoteRoles.includes(role);
                                            const isSuperAdminRole = role === 'SUPER_ADMIN';
                                            const canAssignSuperAdmin = currentAdminRoles.includes('SUPER_ADMIN');
                                            const disabled = isSuperAdminRole && !canAssignSuperAdmin;
                                            return (
                                                <button
                                                    key={role}
                                                    onClick={() => {
                                                        if (disabled) return;
                                                        setPromoteRoles(prev =>
                                                            prev.includes(role)
                                                                ? prev.filter(r => r !== role)
                                                                : [...prev, role]
                                                        );
                                                    }}
                                                    disabled={disabled}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        isChecked
                                                            ? config.bg + ' border'
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {config.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={handlePromote}
                                    disabled={!selectedPhone || promoteRoles.length === 0 || promoting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-2xl font-bold transition-all shadow-md shadow-blue-500/10 text-sm flex items-center justify-center gap-2"
                                >
                                    {promoting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    ارتقا به ادمین
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPromoteModal(false);
                                        setSelectedPhone('');
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setPromoteRoles(['ADMIN']);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition-colors text-sm"
                                >
                                    انصراف
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
