import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Sanitize a string for CSV to prevent formula injection.
 * Fields starting with =, +, -, @, \t, or \r are prefixed with a single-quote
 * so Excel won't interpret them as formulas.
 * Also escapes internal double-quotes.
 */
function csvSafe(value: string | null | undefined): string {
    if (!value) return ''
    let sanitized = value.replace(/"/g, '""') // escape internal quotes
    if (/^[=+\-@\t\r]/.test(sanitized)) {
        sanitized = `'${sanitized}`
    }
    return sanitized
}

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
        return auth.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'orders'

        let csvContent = ''
        let filename = 'export.csv'

        if (type === 'orders') {
            const orders = await prisma.order.findMany({
                orderBy: { createdAt: 'desc' },
                include: { items: true }
            })
            filename = `orders-${Date.now()}.csv`
            // \ufeff is the UTF-8 Byte Order Mark (BOM) to force Excel to read Persian characters correctly
            csvContent = '\ufeffشماره سفارش,مشتری,تلفن,مبلغ کل,وضعیت,تاریخ ثبت,تعداد اقلام\n'
            orders.forEach(o => {
                const dateStr = new Date(o.createdAt).toLocaleDateString('fa-IR')
                csvContent += `"${csvSafe(o.orderNumber)}","${csvSafe(o.customerName)}","${csvSafe(o.customerPhone)}",${o.total},"${csvSafe(o.status)}","${dateStr}",${o.items.length}\n`
            })
        } else if (type === 'customers') {
            const users = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
            })
            filename = `customers-${Date.now()}.csv`
            csvContent = '\ufeffشناسه,نام,نام خانوادگی,تلفن,تاریخ عضویت,وضعیت\n'
            users.forEach(u => {
                const dateStr = new Date(u.createdAt).toLocaleDateString('fa-IR')
                csvContent += `${u.id},"${csvSafe(u.firstName)}","${csvSafe(u.lastName)}","${csvSafe(u.phone)}","${dateStr}","${csvSafe(u.status)}"\n`
            })
        } else if (type === 'products') {
            const products = await prisma.product.findMany({
                orderBy: { createdAt: 'desc' },
            })
            filename = `products-${Date.now()}.csv`
            csvContent = '\ufeffشناسه,نام کالا,کد کالا (SKU),برند,قیمت,موجودی,وضعیت نمایش\n'
            products.forEach(p => {
                csvContent += `${p.id},"${csvSafe(p.name)}","${csvSafe(p.sku)}","${csvSafe(p.brand)}",${p.price},${p.stock},"${p.isActive ? 'فعال' : 'غیرفعال'}"\n`
            })
        } else {
            return NextResponse.json({ error: 'نوع خروجی نامعتبر است' }, { status: 400 })
        }

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            }
        })
    } catch (error) {
        console.error('[Export] Failed to export data:', error)
        return NextResponse.json({ error: 'خطا در خروجی فایل' }, { status: 500 })
    }
}
