import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

// دریافت یک محصول
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json({ 
        success: false, 
        message: 'محصول یافت نشد' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
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
    await dbConnect();
    const body = await request.json();
    
    const product = await Product.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return NextResponse.json({ 
        success: false, 
        message: 'محصول یافت نشد' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
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
    await dbConnect();
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return NextResponse.json({ 
        success: false, 
        message: 'محصول یافت نشد' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'محصول حذف شد' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در حذف محصول' 
    }, { status: 500 });
  }
}