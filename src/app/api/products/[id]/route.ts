import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

function getErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// دریافت یک محصول
export async function GET(
  _request: NextRequest,
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
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

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
  } catch (error: unknown) {
    console.error('خطا در ویرایش محصول:', error);

    if (getErrorCode(error) === 'P2025') {
      return NextResponse.json({
        success: false,
        message: 'محصول یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      message: getErrorMessage(error, 'خطا در ویرایش محصول')
    }, { status: 400 });
  }
}

// حذف محصول
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

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
  } catch (error: unknown) {
    console.error('خطا در حذف محصول:', error);

    if (getErrorCode(error) === 'P2025') {
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
