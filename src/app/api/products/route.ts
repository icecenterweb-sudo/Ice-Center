import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const runtime = 'nodejs'; // Prisma requires the Node.js runtime so the binary engine can run.

// دریافت همه محصولات
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('خطا در دریافت محصولات:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت محصولات'
    }, { status: 500 });
  }
}

// ساخت محصول جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: body
    });

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 });
  } catch (error: any) {
    console.error('خطا در ساخت محصول:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'خطا در ساخت محصول'
    }, { status: 400 });
  }
}
