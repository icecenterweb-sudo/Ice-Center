import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const runtime = 'nodejs'; // Ensure Prisma uses the Node binary engine in this route.

// دریافت یک محصول
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'شناسه محصول نامعتبر است'
      }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'محصول یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('خطا در دریافت محصول:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت محصول'
    }, { status: 500 });
  }
}

// ویرایش محصول
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'شناسه محصول نامعتبر است'
      }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: body
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error('خطا در ویرایش محصول:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: 'محصول یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      message: error.message || 'خطا در ویرایش محصول'
    }, { status: 400 });
  }
}

// حذف محصول
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'شناسه محصول نامعتبر است'
      }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      success: true,
      message: 'محصول حذف شد'
    });
  } catch (error: any) {
    console.error('خطا در حذف محصول:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: 'محصول یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      message: 'خطا در حذف محصول'
    }, { status: 500 });
  }
}
