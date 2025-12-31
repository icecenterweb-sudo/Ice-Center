import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET product by slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const product = await prisma.product.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                listPrice: true,
                thumbnail: true,
                images: true,
                description: true,
                brand: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: 'محصول یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Failed to fetch product by slug:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت محصول' },
            { status: 500 }
        );
    }
}
