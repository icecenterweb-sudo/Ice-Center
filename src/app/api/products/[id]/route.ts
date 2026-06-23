import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  listPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  brand: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  subcategoryId: z.number().int().positive().optional().nullable(),
  images: z.array(z.string()).optional(),
  thumbnail: z.string().optional().nullable(),
  features: z.array(z.string()).optional(),
  specifications: z.any().optional().nullable(),
}).strict();

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

    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'شناسه محصول نامعتبر است'
      }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: validation.data
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
