import Link from 'next/link';
import { Tag, Plus, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatPersianNumber } from '@/lib/persian';
import DeleteOfferButton from './DeleteOfferButton';
import { connection } from 'next/server';
import { Suspense } from 'react';

// Helper to get offer status
function getOfferStatus(offer: { isActive: boolean; startDate: Date; endDate: Date }) {
    const now = new Date();

    if (!offer.isActive) return { label: 'غیرفعال', color: 'bg-gray-100 text-gray-600', icon: XCircle };
    if (now < offer.startDate) return { label: 'زمان‌بندی شده', color: 'bg-amber-100 text-amber-700', icon: Clock };
    if (now > offer.endDate) return { label: 'منقضی', color: 'bg-red-100 text-red-700', icon: AlertCircle };
    return { label: 'فعال', color: 'bg-green-100 text-green-700', icon: CheckCircle };
}

async function OffersContent() {
    await connection(); // Opt out of caching for this page

    const offers = await prisma.offer.findMany({
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            thumbnail: true,
                        }
                    }
                }
            },
            campaign: {
                select: {
                    id: true,
                    name: true,
                }
            }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت پیشنهادها</h1>
                    <p className="text-gray-500 text-sm mt-1">تخفیف‌ها و پیشنهادهای ویژه محصولات</p>
                </div>
                <Link
                    href="/admin/dashboard/offers/add"
                    className="flex items-center gap-2 bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    پیشنهاد جدید
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatPersianNumber(offers.filter(o => {
                                    const now = new Date();
                                    return o.isActive && now >= o.startDate && now < o.endDate;
                                }).length)}
                            </p>
                            <p className="text-xs text-gray-500">پیشنهاد فعال</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatPersianNumber(offers.filter(o => o.isActive && new Date() < o.startDate).length)}
                            </p>
                            <p className="text-xs text-gray-500">زمان‌بندی شده</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatPersianNumber(offers.filter(o => new Date() > o.endDate).length)}
                            </p>
                            <p className="text-xs text-gray-500">منقضی شده</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatPersianNumber(offers.length)}
                            </p>
                            <p className="text-xs text-gray-500">کل پیشنهادها</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Offers Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-4 py-3 font-medium">نام پیشنهاد</th>
                                <th className="px-4 py-3 font-medium">تخفیف</th>
                                <th className="px-4 py-3 font-medium">محصولات</th>
                                <th className="px-4 py-3 font-medium">زمان</th>
                                <th className="px-4 py-3 font-medium">وضعیت</th>
                                <th className="px-4 py-3 font-medium text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {offers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        هنوز پیشنهادی ثبت نشده است.
                                    </td>
                                </tr>
                            ) : (
                                offers.map((offer) => {
                                    const status = getOfferStatus(offer);
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr
                                            key={offer.id}
                                            className="group hover:bg-blue-50/30 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800">{offer.name}</p>
                                                    {offer.campaign && (
                                                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                            {offer.campaign.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-sm">
                                                    {offer.discountType === 'PERCENTAGE'
                                                        ? `${formatPersianNumber(offer.discountValue)}٪`
                                                        : `${formatPersianNumber(offer.discountValue)} تومان`
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {offer.products.slice(0, 3).map((op) => (
                                                        <div
                                                            key={op.product.id}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden"
                                                            title={op.product.name}
                                                        >
                                                            {op.product.thumbnail ? (
                                                                <img
                                                                    src={op.product.thumbnail}
                                                                    alt={op.product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                                    📦
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {offer.products.length > 3 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{formatPersianNumber(offer.products.length - 3)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        {new Date(offer.startDate).toLocaleDateString('fa-IR')}
                                                    </span>
                                                    <span>تا</span>
                                                    <span>
                                                        {new Date(offer.endDate).toLocaleDateString('fa-IR')}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/dashboard/offers/${offer.id}/edit`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        ویرایش
                                                    </Link>
                                                    <DeleteOfferButton offerId={offer.id} offerName={offer.name} />
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
        </div>
    );
}

export default function OffersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری پیشنهادها...</div>}>
            <OffersContent />
        </Suspense>
    );
}
