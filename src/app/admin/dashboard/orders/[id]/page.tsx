import { notFound } from 'next/navigation';
import { getOrderDetails } from '../actions';
import OrderDetailClient from './OrderDetailClient';
import { requireRolePage } from '@/lib/admin-auth';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireRolePage('ORDERS');
    const { id } = await params;

    // Parse ID safely
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
        notFound();
    }

    const { order, error } = await getOrderDetails(orderId);

    if (error || !order) {
        notFound();
    }

    return <OrderDetailClient order={order} />;
}
