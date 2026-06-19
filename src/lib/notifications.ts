import { prisma } from '@/lib/db';

type NotificationType = 'ORDER' | 'PROMO' | 'PRICE' | 'STOCK' | 'SYSTEM';

/**
 * Create a notification for a specific user.
 */
export async function createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
) {
    try {
        await prisma.notification.create({
            data: { userId, type, title, message, link },
        });
    } catch (error) {
        // Notifications are non-critical; log but don't throw
        console.error('[Notification] Failed to create notification:', error);
    }
}

/**
 * Notify all users who have a product in their wishlist that the price has dropped.
 */
export async function notifyWishlistUsersOnPriceDrop(
    productId: number,
    productName: string,
    productSlug: string,
    oldPrice: number,
    newPrice: number
) {
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { productId },
            select: { userId: true },
        });

        if (wishlistItems.length === 0) return;

        const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
        const notifications = wishlistItems.map((item) => ({
            userId: item.userId,
            type: 'PRICE' as NotificationType,
            title: `قیمت ${productName} کاهش یافت! 🎉`,
            message: `این محصول در لیست علاقه‌مندی‌های شماست و قیمت آن ${discount}٪ کاهش یافت.`,
            link: `/products/${productSlug}`,
        }));

        await prisma.notification.createMany({ data: notifications });
    } catch (error) {
        console.error('[Notification] Failed to notify on price drop:', error);
    }
}

/**
 * Notify all users who have a product in their wishlist that it's back in stock.
 */
export async function notifyWishlistUsersOnRestock(
    productId: number,
    productName: string,
    productSlug: string
) {
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { productId },
            select: { userId: true },
        });

        if (wishlistItems.length === 0) return;

        const notifications = wishlistItems.map((item) => ({
            userId: item.userId,
            type: 'STOCK' as NotificationType,
            title: `${productName} موجود شد! 📦`,
            message: `محصولی که در لیست علاقه‌مندی‌های شماست دوباره موجود شده است.`,
            link: `/products/${productSlug}`,
        }));

        await prisma.notification.createMany({ data: notifications });
    } catch (error) {
        console.error('[Notification] Failed to notify on restock:', error);
    }
}

/**
 * Notify the author of a blog comment when their comment gets a reply (after admin approval).
 */
export async function notifyCommentReply(
    parentCommentId: number,
    replyAuthorName: string,
    blogPostTitle: string,
    blogPostSlug: string
) {
    try {
        const parentComment = await prisma.blogComment.findUnique({
            where: { id: parentCommentId },
            select: { userId: true },
        });

        if (!parentComment?.userId) return;

        await createNotification(
            parentComment.userId,
            'SYSTEM',
            `پاسخ جدید به نظر شما`,
            `${replyAuthorName} به نظر شما در مقاله "${blogPostTitle}" پاسخ داد.`,
            `/blog/${blogPostSlug}`
        );
    } catch (error) {
        console.error('[Notification] Failed to notify comment reply:', error);
    }
}

/**
 * Notify a user about an order status change.
 */
export async function notifyOrderStatusChange(
    userId: number,
    orderId: number,
    orderNumber: string,
    status: string
) {
    const statusMessages: Record<string, { title: string; message: string }> = {
        AWAITING_CONFIRMATION: {
            title: `سفارش ${orderNumber} در انتظار تأیید است`,
            message: 'سفارش شما ثبت شد و در انتظار تأیید کارشناس می‌باشد.',
        },
        PAID: {
            title: `پرداخت سفارش ${orderNumber} تأیید شد ✅`,
            message: 'پرداخت شما با موفقیت تأیید شد و سفارش در حال پردازش است.',
        },
        PROCESSING: {
            title: `سفارش ${orderNumber} در حال آماده‌سازی است`,
            message: 'تیم ما در حال آماده‌سازی سفارش شما است.',
        },
        PREPARING: {
            title: `سفارش ${orderNumber} در حال آماده‌سازی است 📦`,
            message: 'سفارش شما در حال آماده‌سازی و بسته‌بندی است.',
        },
        READY_FOR_DELIVERY: {
            title: `سفارش ${orderNumber} آماده تحویل است ✅`,
            message: 'سفارش شما آماده شده و در انتظار ارسال است.',
        },
        SHIPPED: {
            title: `سفارش ${orderNumber} ارسال شد 🚚`,
            message: 'سفارش شما ارسال شد و در راه است.',
        },
        HANDED_TO_CARRIER: {
            title: `سفارش ${orderNumber} به باربری تحویل شد 🚛`,
            message: 'سفارش شما به باربری تحویل داده شد. به زودی ارسال خواهد شد.',
        },
        DELIVERED: {
            title: `سفارش ${orderNumber} تحویل داده شد 📬`,
            message: 'سفارش شما با موفقیت تحویل داده شد. از خرید شما متشکریم!',
        },
        RETURNED: {
            title: `سفارش ${orderNumber} برگشت خورد ⚠️`,
            message: 'سفارش شما برگشت خورده است. لطفاً با پشتیبانی تماس بگیرید.',
        },
        CANCELLED: {
            title: `سفارش ${orderNumber} لغو شد`,
            message: 'متأسفانه سفارش شما لغو شد. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.',
        },
        NEEDS_CONTACT: {
            title: `سفارش ${orderNumber} نیاز به تماس دارد 📞`,
            message: 'برای تکمیل سفارش شما نیاز به هماهنگی است. لطفاً با ما تماس بگیرید.',
        },
    };

    const info = statusMessages[status];
    if (!info) return;

    await createNotification(userId, 'ORDER', info.title, info.message, `/profile/orders/${orderId}`);
}
